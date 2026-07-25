import { NextRequest } from "next/server";
import { getDb } from "@/lib/db/prisma";
import { enhancePromptSchema } from "@/lib/validations/prompts";
import { checkRateLimit } from "@/lib/rate-limit";
import { callLLM } from "@/lib/llm/providers";
import { decrypt } from "@/lib/crypto";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";

function buildSystemPrompt(category?: string, tone?: string, length?: string): string {
  let sp = "You are an expert prompt engineer. Transform the user's prompt into an optimized version. Be concise but comprehensive.";
  if (category) sp += `\n\nThe prompt is for: ${category}`;
  if (tone) sp += `\nTone preference: ${tone}`;
  if (length) sp += `\nDesired response length: ${length}`;
  return sp;
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

  const targetProvider = reqProvider || (model?.includes("claude") ? "anthropic" : model?.includes("openrouter") ? "openrouter" : "openai");

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
    const enhancedText = `Act as an expert assistant. ${text} Be specific and thorough.`;
    const latencyMs = Date.now() - startTime;

    await getDb().usageLog.create({
      data: {
        userId,
        promptId: promptId || null,
        action: "enhance",
        provider: "local",
        model: model || "local-enhancement",
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
          model: model || "local-enhancement",
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
      userPrompt: `Transform this prompt into an optimized version:\n\n"${text}"\n\nProvide the enhanced prompt directly, without explanations.`,
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

    const fallbackText = `Act as an expert assistant. ${text} Be specific and thorough.`;

    return jsonResponse(
      {
        data: {
          enhanced: fallbackText,
          provider: "local-fallback",
          model: "local-enhancement",
          error: error instanceof Error ? error.message : "API error",
        },
      },
      { rateLimit: rateCheck, requestId }
    );
  }
}, { allowGuest: true });
