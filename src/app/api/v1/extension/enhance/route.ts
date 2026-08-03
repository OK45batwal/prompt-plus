// @public-route: Chrome extension enhancement endpoint with custom key or IP rate limiting & free model routing
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callLLM } from "@/lib/llm/providers";
import { buildArchitectMetaPrompt } from "@/lib/llm/meta-prompt";
import { resolveServerApiKey } from "@/lib/llm/server-api-key";
import { checkIpRateLimit } from "@/lib/rate-limit";

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

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";

  const rateCheck = checkIpRateLimit(`ext:${ip}`, 120, 60 * 60 * 1000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests from this address. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rateCheck.resetMs / 1000)) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = extensionEnhanceSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { text, apiKey, provider, model, category, tone, length, level } = parseResult.data;

  let resolvedProvider: "openai" | "anthropic" | "openrouter" | "nvidia";
  if (provider === "nvidia" || provider === "openrouter" || provider === "anthropic" || provider === "openai") {
    resolvedProvider = provider;
  } else if (model?.startsWith("meta/") || model?.startsWith("nvidia/") || model?.startsWith("google/gemma") || model?.startsWith("mistralai/mistral-7b")) {
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

  // If no user API key passed, try server key or route to 100% free OpenRouter model
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
  const { metaPrompt, systemInstruction } = buildArchitectMetaPrompt(text, category, tone, length, level);

  try {
    const response = await callLLM({
      provider: effectiveProvider,
      apiKey: effectiveKey,
      model: reqModel,
      systemPrompt: systemInstruction,
      userPrompt: metaPrompt,
      temperature: 0.7,
      maxTokens: 1200,
    });

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
            score: { total: 85, clarity: 85, specificity: 85, structure: 85, context: 85, length: 85, actionability: 85 },
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
      // Async database logging fail-safe
    }

    return NextResponse.json({
      enhanced: response.content,
      model: response.model,
      provider: response.provider,
    });
  } catch (error) {
    console.error("Extension enhance error (using heuristic fallback):", error);

    // Bulletproof Architect Heuristic Fallback
    const fallbackEnhancedText = `[ROLE & PERSONA]\nAct as an expert ${category || "General"} AI Specialist.\n\n[OBJECTIVE]\n${text.trim()}\n\n[KEY REQUIREMENTS & CONSTRAINTS]\n- Tone: ${tone || "Professional, practical, and clear"}\n- Format: Comprehensive, structured, zero filler text.\n- Instructions: Provide actionable step-by-step guidance with relevant examples.`;

    return NextResponse.json({
      enhanced: fallbackEnhancedText,
      model: "prompt-architect-heuristic",
      provider: "openrouter",
    });
  }
}
