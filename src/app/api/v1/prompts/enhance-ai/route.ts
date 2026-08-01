import { NextRequest } from "next/server";
import { getDb } from "@/lib/db/prisma";
import { enhancePromptSchema } from "@/lib/validations/prompts";
import { callLLM } from "@/lib/llm/providers";
import { decrypt } from "@/lib/crypto";
import { resolveServerApiKey } from "@/lib/llm/server-api-key";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";
import { buildArchitectMetaPrompt } from "@/lib/llm/meta-prompt";

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

    const userApiKeyRow = await getDb().apiKey.findFirst({
      where: {
        userId,
        provider: targetProvider,
        isActive: true,
      },
    });

    let apiKey: string | undefined = userApiKey;
    let resolvedProvider = targetProvider;

    if (!apiKey && userApiKeyRow) {
      try {
        apiKey = decrypt(userApiKeyRow.apiKeyEnc);
      } catch {
        // bad key fallback
      }
    }

    if (!apiKey) {
      const serverKey = resolveServerApiKey(resolvedProvider);
      if (serverKey) {
        apiKey = serverKey.apiKey;
        resolvedProvider = serverKey.provider;
      }
    }

    if (!apiKey && resolvedProvider === "openrouter") {
      apiKey = "";
    }

    if (apiKey === undefined && resolvedProvider !== "openrouter") {
      return jsonResponse(
        { error: "No API key configured. Add your API key in Settings or choose an OpenRouter Free model." },
        { status: 402, requestId }
      );
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
        { requestId }
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
