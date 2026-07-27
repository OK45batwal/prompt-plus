import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callLLM } from "@/lib/llm/providers";
import { buildArchitectMetaPrompt } from "@/lib/llm/meta-prompt";

const extensionEnhanceSchema = z.object({
  text: z.string().min(1).max(10000),
  apiKey: z.string().min(5),
  provider: z.enum(["openai", "anthropic", "openrouter"]).optional(),
  model: z.string().optional(),
  category: z.string().optional(),
  tone: z.string().optional(),
  length: z.string().optional(),
});

export async function POST(request: NextRequest) {
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

  const { text, apiKey, provider, model, category, tone, length } = parseResult.data;

  let resolvedProvider: "openai" | "anthropic" | "openrouter" =
    provider || (model?.includes("claude") ? "anthropic" : model?.includes("/") ? "openrouter" : "openai");

  const { metaPrompt, systemInstruction } = buildArchitectMetaPrompt(text, category, tone, length);

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

    return NextResponse.json({
      data: {
        enhanced: response.content,
        provider: response.provider,
        model: response.model,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI enhancement failed" },
      { status: 502 }
    );
  }
}
