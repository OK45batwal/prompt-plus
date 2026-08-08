// @public-route: Chrome extension enhancement endpoint with multi-provider retry loop & free model auto-routing
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callLLM } from "@/lib/llm/providers";
import { buildArchitectMetaPrompt, cleanMasterPromptOutput } from "@/lib/llm/meta-prompt";
import { resolveServerApiKey } from "@/lib/llm/server-api-key";
import { checkIpRateLimitAsync, extractClientIp } from "@/lib/rate-limit";
import { calculateDynamicPromptScore } from "@/lib/scoring";
import { synthesizeAlgorithmicPrompt } from "@/lib/llm/algorithmic-enhancers";
import { enhancementCache } from "@/lib/llm/cache";

const extensionEnhanceSchema = z.object({
  text: z.string().min(1).max(10000),
  apiKey: z.string().min(5).optional(),
  provider: z.enum(["openai", "anthropic", "openrouter", "nvidia"]).optional(),
  model: z.string().optional(),
  category: z.string().optional(),
  tone: z.string().optional(),
  length: z.string().optional(),
  level: z.enum(["quick", "deep", "expert"]).optional().default("deep"),
});

const FALLBACK_FREE_MODELS = [
  "google/gemini-2.0-flash-exp:free",
  "deepseek/deepseek-r1:free",
  "meta-llama/llama-3.1-8b-instruct:free",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Title, HTTP-Referer",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const ip = extractClientIp(request);

  const rateCheck = await checkIpRateLimitAsync(`ext:${ip}`, 120, 60 * 60 * 1000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests from this address. Try again in a few minutes." },
      { status: 429, headers: { ...corsHeaders, "Retry-After": String(Math.ceil(rateCheck.resetMs / 1000)) } }
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

  let resolvedProvider: "openai" | "anthropic" | "openrouter" | "nvidia";
  if (provider === "nvidia" || provider === "openrouter" || provider === "anthropic" || provider === "openai") {
    resolvedProvider = provider;
  } else if (model?.startsWith("meta/") || model?.startsWith("nvidia/") || model?.startsWith("google/gemma")) {
    resolvedProvider = "nvidia";
  } else if (model?.includes("claude")) {
    resolvedProvider = "anthropic";
  } else if (model?.includes(":") || model?.includes("/")) {
    resolvedProvider = "openrouter";
  } else {
    resolvedProvider = "openrouter";
  }

  let effectiveKey = apiKey || "";
  let effectiveProvider = resolvedProvider;

  if (!effectiveKey) {
    const serverKey = resolveServerApiKey(resolvedProvider);
    if (serverKey) {
      effectiveKey = serverKey.apiKey;
      effectiveProvider = serverKey.provider;
    } else {
      effectiveProvider = "openrouter";
      effectiveKey = "";
    }
  }

  const reqModel = model || (effectiveKey ? "gpt-4o-mini" : "google/gemini-2.0-flash-exp:free");
  const cacheKey = `ext:${text}:${reqModel}:${category || ""}:${tone || ""}:${length || ""}:${level || ""}`;
  const cached = enhancementCache.get(cacheKey);
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

  const modelCandidates = [
    { provider: effectiveProvider, key: effectiveKey, model: reqModel },
    ...FALLBACK_FREE_MODELS.filter((m) => m !== reqModel).map((m) => ({
      provider: "openrouter" as const,
      key: "",
      model: m,
    })),
  ];

  let lastError: unknown = null;

  for (const candidate of modelCandidates) {
    try {
      const response = await callLLM({
        provider: candidate.provider,
        apiKey: candidate.key,
        model: candidate.model,
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
                score: JSON.parse(JSON.stringify(calculateDynamicPromptScore(response.content))),
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
          enhanced: response.content,
          model: response.model,
          provider: response.provider,
        },
        { headers: corsHeaders }
      );
    } catch (err) {
      lastError = err;
      console.warn(`[Extension Backend] Candidate ${candidate.model} failed, trying next candidate...`);
    }
  }

  console.log("[Extension Backend] Serving dynamic Algorithmic Meta-Prompt Synthesis:", lastError);

  const enhancedText = synthesizeAlgorithmicPrompt(text, level);

  return NextResponse.json(
    {
      enhanced: enhancedText,
      model: "prompt-architect-algorithmic",
      provider: "local",
    },
    { headers: corsHeaders }
  );
}
