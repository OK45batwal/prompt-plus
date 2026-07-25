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

function generateSmartEnhancedPrompt(
  text: string,
  category?: string,
  tone?: string,
  length?: string
): string {
  const cleanText = text.trim();
  const cat = category || "General Task";
  const preferredTone = tone ? `in a ${tone.toLowerCase()} tone` : "in a professional, clear tone";
  const preferredLength = length ? `Keep the response ${length.toLowerCase()}.` : "Provide a comprehensive, well-structured output.";

  return `### Role & Objective
Act as an expert AI consultant and senior specialist in ${cat}. Your objective is to process and execute the task below ${preferredTone}.

### Context & Requirements
- Primary Domain: ${cat}
- Desired Quality: Production-ready, precise, and verified against best practices.

### Core Task Input
"${cleanText}"

### Step-by-Step Execution Instructions
1. Intent & Context Analysis: Evaluate key requirements, implicit assumptions, and deliverables.
2. Solution Architecture: Formulate a step-by-step, logically structured solution that directly fulfills the task.
3. Quality & Edge Cases: Identify potential pitfalls, security considerations, or performance edge cases.
4. Actionable Output: Provide concrete recommendations, code snippets, or structured guidance.

### Constraints & Output Format
- ${preferredLength}
- Format using clean Markdown headers, bullet lists, and syntax-highlighted code blocks where applicable.
- Eliminate generic fluff, disclaimers, or conversational boilerplate.`;
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

    const { metaPrompt, systemInstruction } = buildArchitectMetaPrompt(text, category, tone, length);

    if (!apiKey) {
      const enhancedText = generateSmartEnhancedPrompt(text, category, tone, length);
      const latencyMs = Date.now() - startTime;

      await getDb().usageLog.create({
        data: {
          userId,
          promptId: promptId || null,
          action: "enhance",
          provider: "local",
          model: model || "architect-engine",
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
            model: model || "architect-engine",
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

      const fallbackText = generateSmartEnhancedPrompt(text, category, tone, length);

      return jsonResponse(
        {
          data: {
            enhanced: fallbackText,
            provider: "local-fallback",
            model: model || "architect-engine",
            error: error instanceof Error ? error.message : "API error",
          },
        },
        { rateLimit: rateCheck, requestId }
      );
    }
  },
  { allowGuest: true }
);
