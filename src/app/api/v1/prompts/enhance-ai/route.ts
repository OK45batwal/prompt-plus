import { NextRequest, after } from "next/server";
import { getDb } from "@/lib/db/prisma";
import { enhancePromptSchema } from "@/lib/validations/prompts";
import { callLLM, createLLMCacheKey } from "@/lib/llm/providers";
import { decrypt } from "@/lib/crypto";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";
import { buildArchitectMetaPrompt, cleanMasterPromptOutput } from "@/lib/llm/meta-prompt";
import { calculateStructuralScore } from "@/lib/scoring";
import { synthesizeAlgorithmicPrompt } from "@/lib/llm/algorithmic-enhancers";
import { enhancementCache } from "@/lib/llm/cache";

export const maxDuration = 60;

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
    const structuralPair = (enhanced: string) => ({
      ...calculateStructuralScore(enhanced),
      originalTotal: calculateStructuralScore(text).total,
      enhancedTotal: calculateStructuralScore(enhanced).total,
      measuredBy: "structural", measuredTotal: null,
    });

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

    const userApiKeyRow = await getDb().apiKey.findFirst({
      where: {
        userId,
        provider: targetProvider,
        isActive: true,
      },
    });

    let apiKey: string | undefined = userApiKey;

    if (!apiKey && userApiKeyRow) {
      try {
        apiKey = decrypt(userApiKeyRow.apiKeyEnc);
      } catch {
        // bad key
      }
    }

    // STRICT USER API KEY ENFORCEMENT:
    // If the user has no valid key for the selected model's provider, stop. Falling back to a
    // different provider's key would send a foreign key with a model that provider cannot serve.
    if (!apiKey) {
      return jsonResponse(
        {
          error: `No ${targetProvider} API key found. Add one in Settings → API Keys to enhance with this model.`,
          code: "API_KEY_REQUIRED",
          provider: targetProvider,
        },
        { status: 402, requestId }
      );
    }

    const cacheKey = createLLMCacheKey({ userId, apiKey, provider: targetProvider, text, model, category, tone, length, level });
    const cached = enhancementCache.get(cacheKey);
    if (cached) {
      const cleanCachedText = cleanMasterPromptOutput(cached.enhancedText);
      const scoreData = structuralPair(cleanCachedText);
      return jsonResponse({
        data: {
          enhanced: cleanCachedText,
          score: scoreData,
          model: cached.model,
          tokensIn: cached.tokensIn || 0,
          tokensOut: cached.tokensOut || 0,
          latencyMs: Date.now() - startTime,
          provider: "cache",
        },
      }, { requestId });
    }

    const { metaPrompt, systemInstruction } = buildArchitectMetaPrompt(text, category, tone, length, level);

    try {
      const response = await callLLM({
        tenantId: userId,
        provider: targetProvider,
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

      // Reliable background DB sync via Next.js after() (survives Vercel Lambda response lifecycle)
      after(async () => {
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
                score: JSON.parse(JSON.stringify(structuralPair(cleanedOutput))),
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
                score: JSON.parse(JSON.stringify(structuralPair(cleanedOutput))),
                model: response.model,
                category: category || "general",
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
      });

      const promptScore = structuralPair(cleanedOutput);

      return jsonResponse(
        {
          data: {
            promptId: promptId || null,
            enhanced: cleanedOutput,
            score: promptScore,
            provider: response.provider,
            model: response.model,
            tokensIn: response.tokensIn || 0,
            tokensOut: response.tokensOut || 0,
            latencyMs,
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
          provider: targetProvider,
          latencyMs,
          success: false,
        },
      }).catch(() => {});

      // Dynamic algorithmic meta-prompt synthesis
      const fallbackEnhancedText = synthesizeAlgorithmicPrompt(text, level);
      const fallbackScore = structuralPair(fallbackEnhancedText);

      return jsonResponse(
        {
          data: {
            promptId: promptId || "algorithmic",
            enhanced: fallbackEnhancedText,
            score: fallbackScore,
            source: "local-template",
            sourceLabel: "Local template (offline)",
            provider: "prompt-architect-engine",
            model: "algorithmic-v2",
            tokensIn: 0,
            tokensOut: 0,
            latencyMs,
          },
        },
        { requestId }
      );
    }
  }
);
