import { NextRequest } from "next/server";
import { getDb } from "@/lib/db/prisma";
import { enhancePromptSchema } from "@/lib/validations/prompts";
import { checkRateLimit } from "@/lib/rate-limit";
import { callLLM } from "@/lib/llm/providers";
import { decrypt } from "@/lib/crypto";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";

function buildSystemPrompt(category?: string, tone?: string, length?: string): string {
  let sp = "You are an expert prompt engineer. Transform the user's prompt into a highly structured, clear, and effective prompt framework. Return ONLY the enhanced prompt itself without introductory chatter.";
  if (category) sp += `\n\nTarget Domain / Category: ${category}`;
  if (tone) sp += `\nTone Preference: ${tone}`;
  if (length) sp += `\nDesired Length: ${length}`;
  return sp;
}

function generateSmartEnhancedPrompt(
  text: string,
  category?: string,
  tone?: string,
  length?: string
): string {
  const cleanText = text.trim();
  const cat = category || "General Task";
  const preferredTone = tone ? `in a ${tone.toLowerCase()} tone` : "in a professional, clear tone";
  const preferredLength = length ? `Keep the output ${length.toLowerCase()}.` : "Provide a comprehensive, well-structured response.";

  return `### Role & Objective
You are an elite AI assistant specializing in ${cat}. Your objective is to fulfill the request below ${preferredTone} with maximum accuracy and depth.

### Request / Input
${cleanText}

### Core Instructions
1. Analyze the objective thoroughly and identify all implicit constraints and key deliverables.
2. Provide a structured, step-by-step response that directly answers the input prompt.
3. Highlight key takeaways, best practices, or actionable code where applicable.
4. Maintain clarity, rigor, and precision while eliminating filler text.

### Output Constraints & Format
- ${preferredLength}
- Format using clean Markdown with distinct headers, bullet points, and code blocks as appropriate.
- Ensure all technical terms, code snippets, and guidance are production-ready.`;
}

export const POST = withAuth(
  async (request: NextRequest, { userId, requestId }) => {
    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      return jsonResponse(
        { error: "Daily limit reached. Please try again tomorrow or configure your own API key in Settings." },
        { status: 429, rateLimit: rateCheck, requestId }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, { status: 400, requestId });
    }

    const parseResult = enhancePromptSchema.safeParse(body);
    if (!parseResult.success) {
      return jsonResponse(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400, requestId }
      );
    }

    const { promptId, text, model, provider: reqProvider, category, tone, length } = parseResult.data;
    const startTime = Date.now();

    const targetProvider =
      reqProvider ||
      (model?.includes("claude") ? "anthropic" : model?.includes("openrouter") ? "openrouter" : "openai");

    const userApiKeyRow = await getDb().apiKey.findFirst({
      where: {
        userId,
        provider: targetProvider,
        isActive: true,
      },
    });

    let apiKey: string | undefined;
    let resolvedProvider: "openai" | "anthropic" | "openrouter" =
      targetProvider === "openrouter"
        ? "openrouter"
        : targetProvider === "anthropic"
        ? "anthropic"
        : "openai";

    if (userApiKeyRow) {
      try {
        apiKey = decrypt(userApiKeyRow.apiKeyEnc);
      } catch {
        // bad key fallback
      }
    }

    if (!apiKey) {
      if (resolvedProvider === "openrouter" && process.env.OPENROUTER_API_KEY) {
        apiKey = process.env.OPENROUTER_API_KEY;
      } else if (resolvedProvider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
        apiKey = process.env.ANTHROPIC_API_KEY;
      } else if (process.env.OPENAI_API_KEY) {
        apiKey = process.env.OPENAI_API_KEY;
        resolvedProvider = "openai";
      } else if (process.env.OPENROUTER_API_KEY) {
        apiKey = process.env.OPENROUTER_API_KEY;
        resolvedProvider = "openrouter";
      } else if (process.env.ANTHROPIC_API_KEY) {
        apiKey = process.env.ANTHROPIC_API_KEY;
        resolvedProvider = "anthropic";
      }
    }

    if (!apiKey) {
      const enhancedText = generateSmartEnhancedPrompt(text, category, tone, length);
      const latencyMs = Date.now() - startTime;

      await getDb().usageLog.create({
        data: {
          userId,
          promptId: promptId || null,
          action: "enhance",
          provider: "local",
          model: model || "smart-enhancement",
          tokensIn: text.length,
          tokensOut: enhancedText.length,
          latencyMs,
          success: true,
        },
      }).catch(() => {});

      if (promptId) {
        const latestVersion = await getDb().version.findFirst({
          where: { promptId },
          orderBy: { version: "desc" },
        });
        const nextVer = (latestVersion?.version || 0) + 1;
        await getDb().version.create({
          data: { promptId, version: nextVer, text: enhancedText },
        }).catch(() => {});
      }

      return jsonResponse(
        {
          data: {
            enhanced: enhancedText,
            provider: "local",
            model: model || "smart-enhancement",
          },
        },
        { rateLimit: rateCheck, requestId }
      );
    }

    try {
      const response = await callLLM({
        provider: resolvedProvider,
        apiKey,
        model,
        systemPrompt: buildSystemPrompt(category, tone, length),
        userPrompt: `Transform the following user prompt into a high-quality, professional, structured AI prompt:\n\n"${text}"\n\nReturn ONLY the final enhanced prompt text.`,
        temperature: 0.7,
        maxTokens: 1000,
      });

      const latencyMs = Date.now() - startTime;

      if (userApiKeyRow) {
        await getDb().apiKey.update({
          where: { id: userApiKeyRow.id },
          data: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
        }).catch(() => {});
      }

      await getDb().usageLog.create({
        data: {
          userId,
          promptId: promptId || null,
          action: "enhance",
          provider: response.provider,
          model: response.model,
          tokensIn: response.tokensIn,
          tokensOut: response.tokensOut,
          latencyMs,
          success: true,
        },
      }).catch(() => {});

      if (promptId) {
        const latestVersion = await getDb().version.findFirst({
          where: { promptId },
          orderBy: { version: "desc" },
        });
        const nextVer = (latestVersion?.version || 0) + 1;
        await getDb().version.create({
          data: { promptId, version: nextVer, text: response.content },
        }).catch(() => {});
      }

      return jsonResponse(
        {
          data: {
            enhanced: response.content,
            provider: response.provider,
            model: response.model,
          },
        },
        { rateLimit: rateCheck, requestId }
      );
    } catch (error) {
      const latencyMs = Date.now() - startTime;

      await getDb().usageLog.create({
        data: {
          userId,
          promptId: promptId || null,
          action: "enhance",
          provider: resolvedProvider,
          latencyMs,
          success: false,
        },
      }).catch(() => {});

      const fallbackText = generateSmartEnhancedPrompt(text, category, tone, length);

      return jsonResponse(
        {
          data: {
            enhanced: fallbackText,
            provider: "local-fallback",
            model: model || "smart-enhancement",
            error: error instanceof Error ? error.message : "API error",
          },
        },
        { rateLimit: rateCheck, requestId }
      );
    }
  },
  { allowGuest: true }
);
