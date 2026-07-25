import { NextRequest } from "next/server";
import { getDb } from "@/lib/db/prisma";
import { enhancePromptSchema } from "@/lib/validations/prompts";
import { checkRateLimit } from "@/lib/rate-limit";
import { callLLM } from "@/lib/llm/providers";
import { decrypt } from "@/lib/crypto";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";

function buildArchitectMetaPrompt(
  originalPrompt: string,
  category?: string,
  tone?: string,
  length?: string
): { metaPrompt: string; systemInstruction: string } {
  const cat = category || "General Task";
  const preferredTone = tone || "Professional & Clear";
  const preferredLength = length || "Comprehensive & Structured";

  const systemInstruction = `You are the Prompt+ Architect Engine — an advanced AI meta-prompt compiler.
Your task is to transform raw, simple, or incomplete user prompts into production-grade, highly structured AI instructions.

### ARCHITECT 8-STEP PIPELINE:
1. User Input Analysis: Identify core intent, domain context, task type, and underlying complexity.
2. Missing Element Detection: Detect missing Role, Context, Constraints, Target Audience, Examples, Tone, and Output Format.
3. Meta-Prompt Synthesis: Construct an explicit meta-instruction framework without changing the user's original intent.
4. Structure & Quality Validation: Ensure zero filler text, zero disclaimers, clear section boundaries, and precise formatting rules.

Return ONLY the final enhanced prompt framework ready for immediate execution by AI models (GPT, Claude, Gemini, DeepSeek). Do NOT add introductory or conversational meta-text.`;

  const metaPrompt = `[ORIGINAL USER PROMPT]:
"${originalPrompt.trim()}"

[TARGET DOMAIN]: ${cat}
[PREFERRED TONE]: ${preferredTone}
[TARGET OUTPUT LENGTH]: ${preferredLength}

[META-PROMPT INSTRUCTIONS]:
Rewrite the prompt above into a master AI prompt framework with the following explicit sections:
1. ### Role & Objective — Define an elite persona tailored to ${cat}.
2. ### Context & Domain Constraints — Establish target domain, background context, and non-negotiable boundaries.
3. ### Step-by-Step Instructions — Break down execution into clear, sequential steps.
4. ### Output Format & Constraints — Specify ${preferredLength}, ${preferredTone}, and formatting guidelines (Markdown, code blocks, bullet points).
5. ### Input Variables — Highlight placeholders like {{user_input}} or specific parameters if required.`;

  return { metaPrompt, systemInstruction };
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

    const { promptId, text, model, provider: reqProvider, category, tone, length, userApiKey } = parseResult.data;
    const startTime = Date.now();

    const targetProvider =
      reqProvider ||
      (model?.includes("claude") ? "anthropic" : model?.includes("openrouter") || model?.includes("/") ? "openrouter" : "openai");

    const userApiKeyRow = await getDb().apiKey.findFirst({
      where: {
        userId,
        provider: targetProvider,
        isActive: true,
      },
    });

    let apiKey: string | undefined = userApiKey;
    let resolvedProvider: "openai" | "anthropic" | "openrouter" =
      targetProvider === "openrouter"
        ? "openrouter"
        : targetProvider === "anthropic"
        ? "anthropic"
        : "openai";

    if (!apiKey && userApiKeyRow) {
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
      return jsonResponse(
        { error: "No API key configured. Add your API key in Settings to use AI enhancement." },
        { status: 402, requestId }
      );
    }

    const { metaPrompt, systemInstruction } = buildArchitectMetaPrompt(text, category, tone, length);

    try {
      const response = await callLLM({
        provider: resolvedProvider,
        apiKey,
        model,
        systemPrompt: systemInstruction,
        userPrompt: metaPrompt,
        temperature: 0.7,
        maxTokens: 1200,
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

      return jsonResponse(
        {
          error: error instanceof Error ? error.message : "AI enhancement failed",
        },
        { status: 502, requestId }
      );
    }
  }
);
