import { NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/prisma";
import { scorePromptSchema } from "@/lib/validations/prompts";
import { calculateStructuralScore } from "@/lib/scoring";
import { callLLM, type LLMOptions } from "@/lib/llm/providers";
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

    const savedPrompt = promptId ? await getDb().prompt.findFirst({
      where: { id: promptId, userId, deletedAt: null },
      select: { id: true, originalText: true, enhancedText: true },
    }) : null;
    if (promptId && !savedPrompt) return jsonResponse({ error: "Prompt not found" }, { status: 404, requestId });
    if (savedPrompt && savedPrompt.enhancedText !== text) return jsonResponse({ error: "Score text must match the saved enhancement" }, { status: 409, requestId });
    const fallback = () => jsonResponse({ data: {
      promptId, ...calculateStructuralScore(text), source: "heuristic", measuredBy: "structural",
      measuredTotal: null, originalTotal: null, enhancedTotal: null,
    } }, { requestId });

    const userKey = await getDb().apiKey.findFirst({
      where: { userId, isActive: true, provider: { in: ["openai", "anthropic", "google", "openrouter", "nvidia"] } },
    });

    let apiKey: string | undefined;
    let provider: LLMOptions["provider"] = "openai";

    if (userKey) {
      try {
        apiKey = decrypt(userKey.apiKeyEnc);
        provider = (userKey.provider as LLMOptions["provider"]) || "openai";
      } catch {
        // ignore bad key
      }
    }

    if (!apiKey) {
      return fallback();
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

    async function assess(input: string) {
      const startTime = Date.now();
      try {
        const response = await callLLM({ tenantId: userId, provider, apiKey, systemPrompt,
          userPrompt: input, temperature: 0, responseFormatJson: true });
        const jsonStart = response.content.indexOf("{");
        const jsonEnd = response.content.lastIndexOf("}");
        const score = scoreOutputSchema.parse(JSON.parse(response.content.slice(jsonStart, jsonEnd + 1)));
        await getDb().usageLog.create({ data: { userId, promptId: promptId || null,
          action: "score", provider: response.provider, model: response.model,
          tokensIn: response.tokensIn, tokensOut: response.tokensOut,
          latencyMs: Date.now() - startTime, success: true } });
        return { score, model: response.model, provider: response.provider };
      } catch (error) {
        await getDb().usageLog.create({ data: { userId, promptId: promptId || null,
          action: "score", provider, latencyMs: Date.now() - startTime, success: false } }).catch(() => {});
        throw error;
      }
    }

    try {
      const enhanced = await assess(text);
      const original = savedPrompt ? await assess(savedPrompt.originalText) : null;
      const paired = original && original.model === enhanced.model && original.provider === enhanced.provider;
      const score = { ...enhanced.score, source: "llm" as const, measuredBy: "llm" as const,
        measuredTotal: enhanced.score.total, originalTotal: paired ? original.score.total : null,
        enhancedTotal: enhanced.score.total, model: enhanced.model, provider: enhanced.provider };
      if (savedPrompt) {
        // Prevent a slow assessment from overwriting a newer edit.
        await getDb().prompt.updateMany({ where: { id: savedPrompt.id, userId, deletedAt: null,
          originalText: savedPrompt.originalText, enhancedText: text }, data: { score } });
      }
      return jsonResponse({ data: { promptId, ...score } }, { requestId });
    } catch {
      return fallback();
    }
  }
);
