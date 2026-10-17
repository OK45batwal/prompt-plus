import { getDb } from "@/lib/db/prisma";
import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";
import { runRealPromptEvaluation } from "@/lib/prompt-engine";
import { checkIpRateLimitAsync, getRateLimitHeaders, rateLimitMessage, rateLimitStatus } from "@/lib/rate-limit";
import { resolveServerApiKey, providerForModel } from "@/lib/llm/server-api-key";
import { z } from "zod";

const evaluateSchema = z.object({
  promptId: z.string().optional(),
  originalPrompt: z.string().min(1, "Original prompt required").max(10000),
  candidateText: z.string().min(1, "Candidate text required").max(10000),
  confirmLiveEvaluation: z.literal(true),
  rubric: z.object({ exact: z.string().max(10000).optional(), required: z.array(z.string().min(1).max(1000)).max(20).optional(), forbidden: z.array(z.string().min(1).max(1000)).max(20).optional() }).optional(),
  targetModel: z.string().optional(),
});

export const maxDuration = 60;

export const POST = withAuth(
  async (request: NextRequest, { requestId, userId }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, { status: 400, requestId });
    }

    const parseResult = evaluateSchema.safeParse(body);
    if (!parseResult.success) {
      return jsonResponse({ error: "Validation failed", details: parseResult.error.flatten() }, { status: 400, requestId });
    }

    const { originalPrompt, candidateText, targetModel, promptId } = parseResult.data;

    if (promptId) {
      const saved = await getDb().prompt.findFirst({ where: { id: promptId, userId, deletedAt: null, originalText: originalPrompt, enhancedText: candidateText }, select: { id: true } });
      if (!saved) return jsonResponse({ error: "Saved prompt changed or was not found. Enhance again before verifying." }, { status: 409, requestId });
    }
    const budget = await checkIpRateLimitAsync(`evaluation:${userId}`, 5, 3600000);
    if (!budget.allowed) return jsonResponse({ error: rateLimitMessage(budget) }, { status: rateLimitStatus(budget), headers: getRateLimitHeaders(budget), requestId });
    const model = targetModel || "nvidia/nemotron-3.5-super-vl:free";
    const provider = providerForModel(model);
    const resolved = resolveServerApiKey(provider);
    // Only use the resolved key when it belongs to the model's provider; never mix a key with a foreign model.
    const apiKey = resolved?.provider === provider ? resolved.apiKey : "";
    if (!apiKey) {
      return jsonResponse(
        { error: `Live verification needs a ${provider} API key on the server. Pick a model from a configured provider with a matching API key.`, code: "PROVIDER_KEY_MISSING", provider },
        { status: 402, requestId }
      );
    }
    const evaluation = await runRealPromptEvaluation(
      originalPrompt,
      candidateText,
      model,
      { rubric: parseResult.data.rubric, tenantId: userId, apiKey, provider }
    );

    for (const run of evaluation.runs) {
      await getDb().usageLog.create({ data: { userId, promptId: promptId ?? null,
        action: "evaluate", model: run.model, provider: run.provider, tokensIn: run.tokensIn,
        tokensOut: run.tokensOut, latencyMs: run.latencyMs, success: !run.error } });
    }
    await getDb().analytics.create({ data: { userId, promptId: promptId ?? null, action: "evaluate",
      metadata: JSON.parse(JSON.stringify({ ...evaluation, rubric: parseResult.data.rubric })) } });

    return jsonResponse(
      {
        success: true,
        data: evaluation,
      },
      { requestId }
    );
  },
  { schema: evaluateSchema }
);
