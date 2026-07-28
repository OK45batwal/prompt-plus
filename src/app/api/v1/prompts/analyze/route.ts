import { NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/prisma";
import { analyzePromptSchema } from "@/lib/validations/prompts";
import { checkRateLimit } from "@/lib/rate-limit";
import { callLLM } from "@/lib/llm/providers";
import { decrypt } from "@/lib/crypto";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";

const analysisOutputSchema = z.object({
  intent: z.string().default("content_generation"),
  category: z.string().default("other"),
  complexity: z.number().int().min(1).max(5).default(2),
  confidence: z.number().min(0).max(1).default(0.8),
  entities: z.array(z.string()).default([]),
  context: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  missing: z.array(z.object({
    field: z.string(),
    label: z.string(),
    priority: z.string(),
  })).default([]),
  suggestions: z.array(z.object({
    text: z.string(),
    impact: z.string(),
    category: z.string(),
  })).default([]),
});

function heuristicAnalyzePrompt(text: string) {
  const wc = text.split(/\s+/).length;
  const keywords = text.split(/\s+/).filter((w) => w.length > 4).slice(0, 10);
  return {
    intent: "content_generation",
    category: "other",
    complexity: wc > 50 ? 3 : wc > 20 ? 2 : 1,
    confidence: 0.6,
    entities: [],
    context: [],
    keywords,
    missing: [
      { field: "target_audience", label: "Target Audience", priority: "medium" },
      { field: "output_format", label: "Output Format", priority: "high" },
    ],
    suggestions: [
      { text: "Specify the intended target audience", impact: "high", category: "context" },
      { text: "Define expected response format and structure", impact: "medium", category: "structure" },
    ],
  };
}

export const POST = withAuth(
  async (request: NextRequest, { userId, requestId }) => {
    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      return jsonResponse(
        { error: "Daily quota exceeded. Try again tomorrow or add an API key." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rateCheck.resetMs / 1000)) }, requestId }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, { status: 400, requestId });
    }

    const parseResult = analyzePromptSchema.safeParse(body);
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
      return jsonResponse({ data: { promptId, ...heuristicAnalyzePrompt(text) } }, { requestId });
    }

    const systemPrompt = `You are a prompt analysis engine. Analyze the given user prompt and output a JSON object strictly matching this schema:
{
  "intent": string,
  "category": string (e.g. "Blog Post", "Email", "Code", "Social Media", "Tutorial", "Marketing", "other"),
  "complexity": number (1 to 5),
  "confidence": number (0.0 to 1.0),
  "entities": string[],
  "context": string[],
  "keywords": string[],
  "missing": [ { "field": string, "label": string, "priority": "high"|"medium"|"low" } ],
  "suggestions": [ { "text": string, "impact": "high"|"medium"|"low", "category": string } ]
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
          action: "analyze",
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
      const validatedOutput = analysisOutputSchema.parse(rawObj);

      return jsonResponse({ data: { promptId, ...validatedOutput } }, { requestId });
    } catch (error) {
      console.error("LLM Analysis Error (falling back to heuristic):", error);

      await getDb().usageLog.create({
        data: {
          userId,
          promptId: promptId || null,
          action: "analyze",
          provider,
          latencyMs: Date.now() - startTime,
          success: false,
        },
      }).catch(() => {});

      return jsonResponse({ data: { promptId, ...heuristicAnalyzePrompt(text) } }, { requestId });
    }
  }
);
