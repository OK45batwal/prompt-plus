import { NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/prisma";
import { scorePromptSchema } from "@/lib/validations/prompts";
import { callLLM } from "@/lib/llm/providers";
import { decrypt } from "@/lib/crypto";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";

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

export const POST = withAuth(
  async (request: NextRequest, { userId, requestId }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, { status: 400, requestId });
    }

    const parseResult = scorePromptSchema.safeParse(body);
    if (!parseResult.success) {
      return jsonResponse(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400, requestId }
      );
    }

    const { promptId, text } = parseResult.data;

    const userKey = await getDb().apiKey.findFirst({
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
      return jsonResponse({ data: { promptId, ...heuristicScorePrompt(text) } }, { requestId });
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

      await getDb().usageLog.create({
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

      const jsonStart = response.content.indexOf("{");
      const jsonEnd = response.content.lastIndexOf("}");
      const jsonString = jsonStart !== -1 && jsonEnd !== -1
        ? response.content.slice(jsonStart, jsonEnd + 1)
        : response.content;

      const rawObj = JSON.parse(jsonString);
      const validatedOutput = scoreOutputSchema.parse(rawObj);

      return jsonResponse({ data: { promptId, ...validatedOutput } }, { requestId });
    } catch (error) {
      console.error("LLM Scoring Error (falling back to heuristic):", error);

      await getDb().usageLog.create({
        data: {
          userId,
          promptId: promptId || null,
          action: "score",
          provider,
          latencyMs: Date.now() - startTime,
          success: false,
        },
      }).catch(() => {});

      return jsonResponse({ data: { promptId, ...heuristicScorePrompt(text) } }, { requestId });
    }
  }
);
