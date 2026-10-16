import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";
import { checkIpRateLimitAsync, extractClientIp, getRateLimitHeaders, rateLimitStatus, rateLimitMessage } from "@/lib/rate-limit";
import {
  validatePromptIR,
  calculateHybridScore,
  routeToOptimalModel,
  addConstraint,
  renderPromptIRToString,
  executeLoopEngineering,
} from "@/lib/prompt-engine";
import { decrypt } from "@/lib/crypto";
import { getDb } from "@/lib/db/prisma";
import { resolveServerApiKey } from "@/lib/llm/server-api-key";
import { callLLM } from "@/lib/llm/providers";
import { z } from "zod";

const optimizeSchema = z.object({
  text: z
    .string()
    .min(1, "Text is required")
    .max(50000, "Text is too long (max 50,000 characters)"),
  mode: z.enum(["api", "algorithmic", "device"]).optional(),
  taskType: z.string().optional(),
  provider: z.enum(["openai", "anthropic", "openrouter", "google", "nvidia"]).optional(),
  userApiKey: z.string().max(1000).optional(),
  tone: z.string().max(100).optional(),
  length: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  answers: z.record(z.string(), z.string().max(2000)).optional(),
  targetModel: z.string().optional(),
  privacyPreference: z.enum(["public", "private_cloud", "local_only"]).optional(),
});

export const maxDuration = 60;

export const POST = withAuth(
  async (request: NextRequest, { requestId, userId }) => {
    const clientIp = userId || extractClientIp(request);
    const rateCheck = await checkIpRateLimitAsync(`rate_v2_optimize_${clientIp}`, 60, 60000);
    if (!rateCheck.allowed) {
      return jsonResponse(
        { error: rateLimitMessage(rateCheck) },
        { status: rateLimitStatus(rateCheck), requestId, headers: getRateLimitHeaders(rateCheck) }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, { status: 400, requestId });
    }

    const parseResult = optimizeSchema.safeParse(body);
    if (!parseResult.success) {
      return jsonResponse({ error: "Validation failed", details: parseResult.error.flatten() }, { status: 400, requestId });
    }

    const { text, mode, answers, targetModel: reqModel, privacyPreference } = parseResult.data;

    const preferences = [parseResult.data.tone && `Tone: ${parseResult.data.tone}`, parseResult.data.length && `Length: ${parseResult.data.length}`, parseResult.data.category && `Category: ${parseResult.data.category}`].filter(Boolean).join("\n");

    // Execute Loop Engineering Optimization Loop (Generate -> Critique -> Auto-Repair -> Polish)
    const loopResult = executeLoopEngineering(preferences ? `${text}\n\n${preferences}` : text, { zeroFluff: true });

    // Incorporate any user answers to adaptive questions
    let finalSelected = loopResult.selectedCandidate;
    if (answers) {
      let irWithAnswers = { ...finalSelected.ir };
      for (const [field, val] of Object.entries(answers)) {
        if (val) {
          irWithAnswers = addConstraint(irWithAnswers, `User specified ${field.replace(/_/g, " ")}: ${val}`, "high", "user");
        }
      }
      finalSelected = {
        ...finalSelected,
        ir: irWithAnswers,
        renderedText: renderPromptIRToString(irWithAnswers),
      };
    }

    // Model Router Recommendation
    const modelRouting = routeToOptimalModel({
      taskType: loopResult.intent.taskType,
      complexity: loopResult.intent.complexity,
      privacyPreference,
    });

    let source: "llm" | "local-template" = "local-template";
    const startedAt = Date.now();

    // Hybrid Mode: If mode is "api", polish the algorithmic IR candidate using LLM
    if (mode === "api" && privacyPreference !== "local_only") {
      try {
        const targetModel = reqModel || modelRouting.recommendedModel.model;
        let key = resolveServerApiKey(parseResult.data.provider);
        if (parseResult.data.userApiKey) key = { apiKey: parseResult.data.userApiKey, provider: key.provider };
        else {
          const stored = await getDb().apiKey.findFirst({ where: { userId, isActive: true, provider: parseResult.data.provider || key.provider } });
          if (stored) key = { apiKey: decrypt(stored.apiKeyEnc), provider: key.provider };
        }
        const llmRes = await callLLM({
          ...key,
          provider: parseResult.data.provider || key.provider,
          tenantId: userId,
          systemPrompt: "Improve the clarity and structure of this prompt. Preserve its intent and every explicit constraint. Do not invent requirements or claims. Return only the improved prompt.",
          userPrompt: `Target Task: ${loopResult.intent.taskType}\n\nStructured Prompt IR Draft:\n${finalSelected.renderedText}\n\nDeliver the final polished prompt directly:`,
          model: targetModel,
          temperature: 0.5,
          maxTokens: 3000,
        });
        if (llmRes.content && llmRes.content.trim().length > 30) {
          source = "llm";
          await getDb().usageLog.create({ data: { userId, action: "enhance", provider: llmRes.provider, model: llmRes.model, tokensIn: llmRes.tokensIn, tokensOut: llmRes.tokensOut, latencyMs: Date.now() - startedAt, success: true } });
          finalSelected = {
            ...finalSelected,
            renderedText: llmRes.content.trim(),
            strategyName: `${finalSelected.strategyName} + LLM Refined (${llmRes.model})`,
          };
        }
      } catch {
        source = "local-template";
        await getDb().usageLog.create({ data: { userId, action: "enhance", latencyMs: Date.now() - startedAt, success: false } }).catch(() => {});
      }
    }

    // Score & Validate Candidates
    const scoredCandidates = loopResult.candidates.map((cand) => {
      const validation = validatePromptIR(cand.ir);
      const hybridScore = calculateHybridScore(text, cand);
      return {
        ...cand,
        validation,
        hybridScore,
      };
    });

    return jsonResponse(
      {
        success: true,
        data: {
          source,
          sourceLabel: source === "llm" ? "Cloud model" : "Local template (offline)",
          autoCorrect: loopResult.autoCorrect,
          security: loopResult.security,
          intent: loopResult.intent,
          selectedCandidate: finalSelected,
          candidates: scoredCandidates,
          modelRouting,
          loopTrace: loopResult.loopTrace,
        },
      },
      { requestId }
    );
  },
  { schema: optimizeSchema }
);
