// @public-route: rate-limited extension enhancement with CORS and deterministic fallback.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callLLM, createLLMCacheKey } from "@/lib/llm/providers";
import { buildArchitectMetaPrompt, cleanMasterPromptOutput } from "@/lib/llm/meta-prompt";
import { resolveServerApiKey, providerForModel, defaultModelForProvider } from "@/lib/llm/server-api-key";
import { canIncurProviderCharges, resolveModelReference } from "@/lib/models";
import { checkIpRateLimitAsync, extractClientIp, getRateLimitHeaders, rateLimitStatus, rateLimitMessage } from "@/lib/rate-limit";
import { calculateStructuralScore } from "@/lib/scoring";
import { executeLoopEngineering } from "@/lib/prompt-engine";
import { enhancementCache } from "@/lib/llm/cache";
import { auth } from "@/lib/auth/config";

const extensionEnhanceSchema = z.object({
  text: z.string().trim().min(1).max(10000),
  apiKey: z.string().min(5).optional(),
  provider: z.enum(["openai", "anthropic", "openrouter", "nvidia", "google"]).optional(),
  model: z.string().optional(),
  category: z.string().optional(),
  tone: z.string().optional(),
  length: z.string().optional(),
  level: z.enum(["quick", "deep", "expert"]).optional().default("deep"),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-PromptPlus-Client, X-Requested-With, Authorization, X-Title, HTTP-Referer",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const ip = extractClientIp(request);

  const rateCheck = await checkIpRateLimitAsync(`ext:${ip}`, 120, 60 * 60 * 1000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: rateLimitMessage(rateCheck) },
      { status: rateLimitStatus(rateCheck), headers: { ...corsHeaders, ...getRateLimitHeaders(rateCheck) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: corsHeaders });
  }

  const parseResult = extensionEnhanceSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parseResult.error.flatten() },
      { status: 400, headers: corsHeaders }
    );
  }

  const { text, apiKey, provider, model, category, tone, length, level } = parseResult.data;

  const resolvedProvider = provider || (model ? providerForModel(model) : "openrouter");

  let effectiveKey = apiKey || "";
  let effectiveProvider = resolvedProvider;

  const session = await auth().catch(() => null);
  const tenantId = session?.user?.id;
  if (!effectiveKey) {
    // Operator keys only ever pay for a model whose terms allow it; a request for a
    // paid model from an anonymous extension user gets the deterministic engine.
    const requestedEntry = resolveModelReference(model);
    const operatorMayPay = !requestedEntry || !canIncurProviderCharges(requestedEntry);
    if (session?.user && operatorMayPay) {
      const serverKey = resolveServerApiKey(resolvedProvider);
      if (serverKey && serverKey.provider === resolvedProvider) {
        effectiveKey = serverKey.apiKey;
        effectiveProvider = serverKey.provider;
      }
    } else {
      effectiveKey = "";
    }
  }

  const reqModel = model && effectiveProvider === resolvedProvider ? model : defaultModelForProvider(effectiveProvider);
  const cacheKey = createLLMCacheKey({ tenantId, apiKey: effectiveKey, provider: effectiveProvider, text, model: reqModel, category, tone, length, level });
  const cached = tenantId ? enhancementCache.get(cacheKey) : null;
  if (cached) {
    const cleanCachedText = cleanMasterPromptOutput(cached.enhancedText);
    return NextResponse.json(
      {
        success: true,
        cached: true,
        data: {
          enhanced: cleanCachedText,
          model: cached.model,
          tokensIn: cached.tokensIn || 0,
          tokensOut: cached.tokensOut || 0,
          provider: "cache",
        },
      },
      { headers: corsHeaders }
    );
  }

  const { metaPrompt, systemInstruction } = buildArchitectMetaPrompt(text, category, tone, length, level);

  const modelCandidates = effectiveKey.trim()
    ? [{ provider: effectiveProvider, key: effectiveKey, model: reqModel }]
    : [];

  for (const candidate of modelCandidates) {
    try {
      const response = await callLLM({
        tenantId,
        provider: candidate.provider,
        apiKey: candidate.key,
        model: candidate.model,
        systemPrompt: systemInstruction,
        userPrompt: metaPrompt,
        temperature: 0.7,
        maxTokens: 1200,
      });

      const cleanedOutput = cleanMasterPromptOutput(response.content);
      if (!cleanedOutput.trim()) throw new Error("Provider returned an empty enhancement");

      if (tenantId) enhancementCache.set(cacheKey, {
        enhancedText: cleanedOutput,
        model: response.model,
        tokensIn: response.tokensIn,
        tokensOut: response.tokensOut,
      });

      // Non-blocking background DB logging
      void (async () => {
        try {
          const { getDb } = await import("@/lib/db/prisma");
          const { auth } = await import("@/lib/auth/config");
          const session = await auth().catch(() => null);

          if (session?.user?.id) {
            const title = text.length > 50 ? text.slice(0, 50).trim() + "…" : text.trim() || "Extension Prompt";
            const createdPrompt = await getDb().prompt.create({
              data: {
                userId: session.user.id,
                title,
                originalText: text,
                enhancedText: response.content,
                model: response.model,
                category: category || "general",
                score: JSON.parse(JSON.stringify(calculateStructuralScore(response.content))),
              },
            }).catch(() => null);

            if (createdPrompt) {
              await getDb().usageLog.create({
                data: {
                  userId: session.user.id,
                  promptId: createdPrompt.id,
                  action: "extension_enhance",
                  provider: response.provider,
                  model: response.model,
                  tokensIn: response.tokensIn,
                  tokensOut: response.tokensOut,
                  success: true,
                },
              }).catch(() => {});
            }
          }
        } catch {
          // DB fail-safe
        }
      })();

      return NextResponse.json(
        {
          enhanced: cleanedOutput,
          model: response.model,
          provider: response.provider,
        },
        { headers: corsHeaders }
      );
    } catch {
      console.warn(`[Extension Backend] Candidate ${candidate.model} failed; using deterministic engine.`);
    }
  }

  const preferences = [tone && `Tone: ${tone}`, length && `Length: ${length}`, category && `Category: ${category}`].filter(Boolean).join("\n");
  const result = executeLoopEngineering(preferences ? `${text}\n\n${preferences}` : text, {
    maxCycles: level === "quick" ? 1 : 3,
    zeroFluff: true,
  });
  return NextResponse.json(
    { enhanced: result.finalPrompt, model: "promptplus-engine", provider: "engine", source: "engine" },
    { headers: corsHeaders }
  );
}
