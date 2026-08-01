import { NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/prisma";
import { callLLM } from "@/lib/llm/providers";
import { decrypt } from "@/lib/crypto";
import { resolveServerApiKey } from "@/lib/llm/server-api-key";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";

const SUPPORTED_PROVIDERS = ["openai", "anthropic", "openrouter", "nvidia"] as const;

const DEFAULT_MODELS: Record<(typeof SUPPORTED_PROVIDERS)[number], string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-sonnet-20241022",
  openrouter: "meta-llama/llama-3.3-70b-instruct:free",
  nvidia: "nvidia/llama-3.3-70b-instruct",
};

const compareSchema = z.object({
  text: z.string().min(3).max(8000),
  models: z
    .array(z.object({
      provider: z.enum(SUPPORTED_PROVIDERS),
      model: z.string().max(120).optional(),
    }))
    .min(1)
    .max(4),
});

export const POST = withAuth(
  async (request: NextRequest, { userId, requestId }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, { status: 400, requestId });
    }

    const parseResult = compareSchema.safeParse(body);
    if (!parseResult.success) {
      return jsonResponse(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400, requestId }
      );
    }

    const { text, models } = parseResult.data;
    const startTime = Date.now();

    const keyRows = await getDb().apiKey.findMany({
      where: { userId, isActive: true, provider: { in: [...SUPPORTED_PROVIDERS] } },
    });

    const results = await Promise.allSettled(
      models.map(async ({ provider, model }) => {
        let apiKey: string | undefined;
        const keyRow = keyRows.find((k) => k.provider === provider);
        if (keyRow) {
          try {
            apiKey = decrypt(keyRow.apiKeyEnc);
          } catch {
            apiKey = undefined;
          }
        }
        if (!apiKey) {
          const serverKey = resolveServerApiKey(provider);
          if (serverKey) apiKey = serverKey.apiKey;
        }

        const resolvedModel = model || DEFAULT_MODELS[provider];

        if (!apiKey) {
          return {
            provider,
            model: resolvedModel,
            error: `No API key configured for ${provider}. Add one in Settings to include this model.`,
          };
        }

        const response = await callLLM({
          provider,
          apiKey,
          model: resolvedModel,
          systemPrompt: "You are a helpful AI assistant.",
          userPrompt: text,
          temperature: 0.7,
          maxTokens: 1000,
        });

        return { provider, model: response.model, content: response.content, tokensIn: response.tokensIn, tokensOut: response.tokensOut };
      })
    );

    const latencyMs = Date.now() - startTime;

    const data = results.map((r, idx) => {
      const { provider, model } = models[idx];
      if (r.status === "fulfilled") return r.value;
      return {
        provider,
        model: model || DEFAULT_MODELS[provider],
        error: r.reason instanceof Error ? r.reason.message : "Request failed",
      };
    });

    const successes = data.filter((d) => !("error" in d) || !d.error);
    await getDb().usageLog.create({
      data: {
        userId,
        action: "compare",
        provider: successes[0]?.provider || "openai",
        model: successes[0]?.model || undefined,
        tokensIn: successes.reduce((sum, d) => sum + (d.tokensIn || 0), 0),
        tokensOut: successes.reduce((sum, d) => sum + (d.tokensOut || 0), 0),
        latencyMs,
        success: successes.length > 0,
      },
    }).catch(() => {});

    return jsonResponse({ data }, { requestId });
  }
);
