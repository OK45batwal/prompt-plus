import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";
import { checkIpRateLimitAsync, extractClientIp, getRateLimitHeaders } from "@/lib/rate-limit";
import {
  validatePromptIR,
  calculateHybridScore,
  routeToOptimalModel,
  addConstraint,
  renderPromptIRToString,
  executeLoopEngineering,
} from "@/lib/prompt-engine";
import { callLLM } from "@/lib/llm/providers";
import { z } from "zod";

const optimizeSchema = z.object({
  text: z
    .string()
    .min(1, "Text is required")
    .max(50000, "Text is too long (max 50,000 characters)"),
  mode: z.enum(["api", "algorithmic", "device"]).optional(),
  taskType: z.string().optional(),
  answers: z.record(z.string(), z.string().max(2000)).optional(),
  targetModel: z.string().optional(),
  privacyPreference: z.enum(["public", "private_cloud", "local_only"]).optional(),
});

export const maxDuration = 60;

export const POST = withAuth(
  async (request: NextRequest, { requestId }) => {
    const clientIp = extractClientIp(request);
    const rateCheck = await checkIpRateLimitAsync(`rate_v2_optimize_${clientIp}`, 60, 60000);
    if (!rateCheck.allowed) {
      return jsonResponse(
        { error: "Rate limit exceeded. Please wait before retrying." },
        { status: 429, requestId, headers: getRateLimitHeaders(rateCheck) }
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

    // Execute Loop Engineering Optimization Loop (Generate -> Critique -> Auto-Repair -> Polish)
    const loopResult = executeLoopEngineering(text, { zeroFluff: true });

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

    // Hybrid Mode: If mode is "api", polish the algorithmic IR candidate using LLM
    if (mode === "api" && privacyPreference !== "local_only") {
      try {
        const targetModel = reqModel || modelRouting.recommendedModel.model;
        const llmRes = await callLLM({
          systemPrompt: "You are the Prompt+ Meta-Architect. Take this structured Prompt IR and produce a world-class, production-grade master prompt. Preserve all constraints and eliminate any meta-chatter.",
          userPrompt: `Target Task: ${loopResult.intent.taskType}\n\nStructured Prompt IR Draft:\n${finalSelected.renderedText}\n\nDeliver the final polished prompt directly:`,
          model: targetModel,
          temperature: 0.5,
          maxTokens: 3000,
        });
        if (llmRes.content && llmRes.content.trim().length > 30) {
          finalSelected = {
            ...finalSelected,
            renderedText: llmRes.content.trim(),
            strategyName: `${finalSelected.strategyName} + LLM Refined (${llmRes.model})`,
          };
        }
      } catch {
        // Fall back gracefully to algorithmic candidate
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
