import { NextRequest } from "next/server";
import { getDb } from "@/lib/db/prisma";
import { enhancePromptSchema } from "@/lib/validations/prompts";
import { callLLM } from "@/lib/llm/providers";
import { decrypt } from "@/lib/crypto";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";
import { buildArchitectMetaPrompt, cleanMasterPromptOutput } from "@/lib/llm/meta-prompt";
import { calculateDynamicPromptScore } from "@/lib/scoring";
import { synthesizeAlgorithmicPrompt } from "@/lib/llm/algorithmic-enhancers";
import { enhancementCache } from "@/lib/llm/cache";

export const POST = withAuth(
  async (request: NextRequest, { userId, requestId }) => {
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

    const { promptId, text, model, provider: reqProvider, category, tone, length, level, userApiKey } = parseResult.data;
    const startTime = Date.now();

    let targetProvider: "openai" | "anthropic" | "openrouter" | "google" | "nvidia";
    if (reqProvider === "nvidia" || reqProvider === "openrouter" || reqProvider === "anthropic" || reqProvider === "google" || reqProvider === "openai") {
      targetProvider = reqProvider;
    } else if (model?.startsWith("meta/") || model?.startsWith("nvidia/") || model?.startsWith("google/gemma") || model?.startsWith("mistralai/mistral-7b")) {
      targetProvider = "nvidia";
    } else if (model?.includes("claude")) {
      targetProvider = "anthropic";
    } else if (model?.includes(":") || model?.includes("/")) {
      targetProvider = "openrouter";
    } else {
      targetProvider = "openai";
    }

    let userApiKeyRow = await getDb().apiKey.findFirst({
      where: {
        userId,
        provider: targetProvider,
        isActive: true,
      },
    });

    let resolvedProvider = targetProvider;

    // If no key for targetProvider, check if user has another active provider key
    if (!userApiKey && !userApiKeyRow) {
      const anyActiveKey = await getDb().apiKey.findFirst({
        where: {
          userId,
          isActive: true,
        },
      });
      if (anyActiveKey) {
        userApiKeyRow = anyActiveKey;
        resolvedProvider = anyActiveKey.provider as typeof targetProvider;
      }
    }

    let apiKey: string | undefined = userApiKey;

    if (!apiKey && userApiKeyRow) {
      try {
        apiKey = decrypt(userApiKeyRow.apiKeyEnc);
      } catch {
        // bad key
      }
    }

    // STRICT USER API KEY ENFORCEMENT:
    // If the user does not have a valid API key connected or provided, disallow API-based prompt enhancement.
    if (!apiKey) {
      return jsonResponse(
        {
          error: "API key required. Please add your API key in Settings -> API Keys to use AI prompt enhancement.",
          code: "API_KEY_REQUIRED",
          provider: targetProvider,
        },
        { status: 402, requestId }
      );
    }

    const cacheKey = `web:${userId}:${text}:${model || "default"}:${category || ""}:${tone || ""}:${length || ""}:${level || ""}`;
    const cached = enhancementCache.get(cacheKey);
    if (cached) {
      const cleanCachedText = cleanMasterPromptOutput(cached.enhancedText);
      const scoreData = calculateDynamicPromptScore(cleanCachedText);
      return jsonResponse({
        data: {
          enhanced: cleanCachedText,
          score: scoreData,
          model: cached.model,
          tokensIn: cached.tokensIn || 0,
          tokensOut: cached.tokensOut || 0,
          latencyMs: 12,
          provider: "cache",
        },
      }, { requestId });
    }

    const { metaPrompt, systemInstruction } = buildArchitectMetaPrompt(text, category, tone, length, level);

    try {
      const response = await callLLM({
        provider: resolvedProvider,
        apiKey: apiKey || "",
        model,
        systemPrompt: systemInstruction,
        userPrompt: metaPrompt,
        temperature: 0.7,
        maxTokens: 1200,
      });

      const cleanedOutput = cleanMasterPromptOutput(response.content);

      enhancementCache.set(cacheKey, {
        enhancedText: cleanedOutput,
        model: response.model,
        tokensIn: response.tokensIn,
        tokensOut: response.tokensOut,
      });

      const latencyMs = Date.now() - startTime;

      // Non-blocking background DB sync
      void (async () => {
        try {
          if (userApiKeyRow) {
            await getDb().apiKey.update({
              where: { id: userApiKeyRow.id },
              data: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
            }).catch(() => {});
          }

          let activePromptId = promptId;
          let isOwner = false;
          if (activePromptId) {
            const existingPrompt = await getDb().prompt.findFirst({
              where: { id: activePromptId, userId },
              select: { id: true },
            }).catch(() => null);
            if (existingPrompt) {
              isOwner = true;
            }
          }

          if (activePromptId && isOwner) {
            await getDb().prompt.update({
              where: { id: activePromptId },
              data: {
                enhancedText: cleanedOutput,
                model: response.model,
              },
            }).catch(() => {});
          } else {
            const title = text.length > 50 ? text.slice(0, 50).trim() + "…" : text.trim() || "Untitled Prompt";
            const created = await getDb().prompt.create({
              data: {
                userId,
                title,
                originalText: text,
                enhancedText: cleanedOutput,
                model: response.model,
                category: category || "general",
                score: JSON.parse(JSON.stringify(calculateDynamicPromptScore(cleanedOutput))),
              },
            }).catch(() => null);
            if (created) activePromptId = created.id;
          }

          await getDb().usageLog.create({
            data: {
              userId,
              promptId: activePromptId || null,
              action: "enhance",
              provider: response.provider,
              model: response.model,
              tokensIn: response.tokensIn,
              tokensOut: response.tokensOut,
              latencyMs,
              success: true,
            },
          }).catch(() => {});

          if (activePromptId) {
            const latestVersion = await getDb().version.findFirst({
              where: { promptId: activePromptId },
              orderBy: { version: "desc" },
            });
            const nextVer = (latestVersion?.version || 0) + 1;
            await getDb().version.create({
              data: { promptId: activePromptId, version: nextVer, text: cleanedOutput },
            }).catch(() => {});
          }
        } catch {
          // DB fail-safe
        }
      })();

      return jsonResponse(
        {
          data: {
            promptId: promptId || null,
            enhanced: cleanedOutput,
            provider: response.provider,
            model: response.model,
          },
        },
        { requestId }
      );
    } catch (error) {
      console.error("Enhance API Exception (using heuristic fallback):", error);
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

      // Dynamic algorithmic meta-prompt synthesis
      const fallbackEnhancedText = synthesizeAlgorithmicPrompt(text, level);

      return jsonResponse(
        {
          data: {
            promptId: promptId || "algorithmic",
            enhanced: fallbackEnhancedText,
            provider: "prompt-architect-engine",
            model: "algorithmic-v2",
          },
        },
        { requestId }
      );
    }
  }
);
