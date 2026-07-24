import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/prisma";
import { scorePromptSchema } from "@/lib/validations/prompts";
import { checkRateLimit } from "@/lib/rate-limit";
import { callLLM } from "@/lib/llm/providers";
import { decrypt } from "@/lib/crypto";

const scoreOutputSchema = z.object({
  total: z.number().int().min(0).max(100),
  dimensions: z.object({
    clarity: z.number().int().min(0).max(100),
    specificity: z.number().int().min(0).max(100),
    structure: z.number().int().min(0).max(100),
    context: z.number().int().min(0).max(100),
    length: z.number().int().min(0).max(100),
    actionability: z.number().int().min(0).max(100),
  }),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
});

function heuristicScorePrompt(text: string) {
  const wc = text.split(/\s+/).length;
  const total = Math.min(100, Math.max(30, wc * 2));
  return {
    total,
    dimensions: {
      clarity: Math.min(100, 40 + wc),
      specificity: Math.min(100, 35 + wc),
      structure: Math.min(100, 30 + wc),
      context: Math.min(100, 35 + wc),
      length: Math.min(100, 40 + wc),
      actionability: Math.min(100, 40 + wc),
    },
    strengths: wc > 15 ? ["Good length and initial direction"] : ["Concise core concept"],
    weaknesses: wc < 20 ? ["Lacks specific formatting guidelines", "Needs background context"] : ["Could define constraints better"],
    recommendations: ["Add a specific persona/role", "Specify step-by-step output requirements"],
  };
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const rateCheck = checkRateLimit(userId);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Daily quota exceeded. Try again tomorrow or add an API key." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rateCheck.resetMs / 1000)) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = scorePromptSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { promptId, text } = parseResult.data;

  // Check user keys first
  const userKey = await db.apiKey.findFirst({
    where: { userId, isActive: true },
  });

  let apiKey: string | undefined;
  let provider: "openai" | "anthropic" = "openai";

  if (userKey) {
    try {
      apiKey = decrypt(userKey.apiKeyEnc);
      provider = (userKey.provider as "openai" | "anthropic") || "openai";
    } catch {
      // ignore bad key
    }
  }

  if (!apiKey) {
    apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
      provider = "anthropic";
    }
  }

  if (!apiKey) {
    return NextResponse.json({ data: { promptId, ...heuristicScorePrompt(text) } });
  }

  const systemPrompt = `You are a prompt scoring engine. Rate the user's prompt on a scale of 0 to 100 across 6 dimensions and output a JSON object strictly matching this schema:
{
  "total": number (overall quality score 0-100),
  "dimensions": {
    "clarity": number (0-100),
    "specificity": number (0-100),
    "structure": number (0-100),
    "context": number (0-100),
    "length": number (0-100),
    "actionability": number (0-100)
  },
  "strengths": string[],
  "weaknesses": string[],
  "recommendations": string[]
}
Return ONLY raw valid JSON, with no markdown formatting or commentary.`;

  const startTime = Date.now();

  try {
    const response = await callLLM({
      provider,
      apiKey,
      systemPrompt,
      userPrompt: text,
      temperature: 0.3,
      responseFormatJson: true,
    });

    const latencyMs = Date.now() - startTime;

    await db.usageLog.create({
      data: {
        userId,
        promptId: promptId || null,
        action: "score",
        provider,
        model: response.model,
        tokensIn: response.tokensIn,
        tokensOut: response.tokensOut,
        latencyMs,
        success: true,
      },
    }).catch(() => {});

    // Parse model output
    const jsonStart = response.content.indexOf("{");
    const jsonEnd = response.content.lastIndexOf("}");
    const jsonString = jsonStart !== -1 && jsonEnd !== -1
      ? response.content.slice(jsonStart, jsonEnd + 1)
      : response.content;

    const rawObj = JSON.parse(jsonString);
    const validatedOutput = scoreOutputSchema.parse(rawObj);

    return NextResponse.json({ data: { promptId, ...validatedOutput } });
  } catch (error) {
    console.error("LLM Scoring Error (falling back to heuristic):", error);

    await db.usageLog.create({
      data: {
        userId,
        promptId: promptId || null,
        action: "score",
        provider,
        latencyMs: Date.now() - startTime,
        success: false,
      },
    }).catch(() => {});

    return NextResponse.json({ data: { promptId, ...heuristicScorePrompt(text) } });
  }
}
