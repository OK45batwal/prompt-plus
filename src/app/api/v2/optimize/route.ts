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
  TaskType,
} from "@/lib/prompt-engine";
import { getDb } from "@/lib/db/prisma";
import { resolveModelCredentials, credentialActionPath } from "@/lib/llm/resolve-credentials";
import { DEFAULT_MODEL_ID, getModelById } from "@/lib/models";
import { callLLM } from "@/lib/llm/providers";
import { z } from "zod";

const optimizeSchema = z.object({
  text: z
    .string()
    .min(1, "Text is required")
    .max(50000, "Text is too long (max 50,000 characters)"),
  level: z.enum(["quick", "deep", "expert"]).optional(),
  mode: z.enum(["auto", "api", "algorithmic", "device"]).optional(),
  taskType: z.string().optional(),
  /** Catalog id; the authoritative choice of provider and model. */
  modelId: z.string().max(100).optional(),
  /** Explicit choice before a run that can bill the connected provider account. */
  confirmPaidUsage: z.boolean().optional(),
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
    const loopResult = executeLoopEngineering(preferences ? `${text}\n\n${preferences}` : text, {
      zeroFluff: true,
      maxCycles: parseResult.data.level === "quick" ? 1 : 3,
      taskType: parseResult.data.taskType as TaskType | undefined,
    });

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

    let source: "llm" | "engine" = "engine";
    const startedAt = Date.now();
    let actualModel = "promptplus-engine";
    let actualProvider = "engine";
    let cloud: {
      status: "used" | "skipped" | "unavailable";
      code?: string;
      message?: string;
      provider?: string;
      actionPath?: string | null;
    } = { status: "skipped", message: "Cloud models were not requested for this run." };

    const wantsCloud = (!mode || mode === "auto" || mode === "api") && privacyPreference !== "local_only";
    const requestedModel = parseResult.data.modelId || reqModel || DEFAULT_MODEL_ID;
    const requestedModelEntry = getModelById(requestedModel);

    if (wantsCloud) {
      const credentials = await resolveModelCredentials({
        userId,
        modelId: requestedModel,
        paidConsent: parseResult.data.confirmPaidUsage,
      });

      if (!credentials.ok) {
        // An explicit cloud request fails visibly. Auto mode still returns the
        // deterministic result, but says why the model did not run.
        if (mode === "api") {
          return jsonResponse(
            {
              error: credentials.message,
              code: credentials.code,
              actionPath: credentialActionPath(credentials),
              model: requestedModelEntry?.name ?? requestedModel,
            },
            { status: credentials.status, requestId }
          );
        }
        cloud = {
          status: "unavailable",
          code: credentials.code,
          message: credentials.message,
          provider: credentials.provider,
          actionPath: credentialActionPath(credentials),
        };
      } else {
        try {
          const llmRes = await callLLM({
            apiKey: credentials.apiKey,
            provider: credentials.provider,
            model: credentials.model.rawModel,
            tenantId: userId,
            systemPrompt: "Improve the clarity and structure of this prompt. Preserve its intent and every explicit constraint. Do not invent requirements or claims. Return only the improved prompt.",
            userPrompt: `Target Task: ${loopResult.intent.taskType}\n\nStructured Prompt IR Draft:\n${finalSelected.renderedText}\n\nDeliver the final polished prompt directly:`,
            temperature: 0.5,
            maxTokens: 3000,
          });
          if (llmRes.content && llmRes.content.trim().length > 30) {
            source = "llm";
            actualModel = llmRes.model;
            actualProvider = llmRes.provider;
            cloud = { status: "used", provider: llmRes.provider };
            await getDb().usageLog.create({ data: { userId, action: "enhance", provider: llmRes.provider, model: llmRes.model, tokensIn: llmRes.tokensIn, tokensOut: llmRes.tokensOut, latencyMs: Date.now() - startedAt, success: true } }).catch(() => {});
            finalSelected = {
              ...finalSelected,
              renderedText: llmRes.content.trim(),
              strategyName: `${finalSelected.strategyName} + LLM Refined (${llmRes.model})`,
            };
          } else {
            cloud = {
              status: "unavailable",
              code: "empty_response",
              message: `${credentials.model.name} returned no usable text. The deterministic result is shown instead.`,
              provider: credentials.provider,
            };
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "The model call failed.";
          await getDb().usageLog.create({ data: { userId, action: "enhance", latencyMs: Date.now() - startedAt, success: false } }).catch(() => {});
          if (mode === "api") {
            return jsonResponse(
              { error: message, code: "provider_error", model: credentials.model.name },
              { status: 502, requestId }
            );
          }
          cloud = {
            status: "unavailable",
            code: "provider_error",
            message: `${message} The deterministic result is shown instead.`,
            provider: credentials.provider,
          };
        }
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
          model: actualModel,
          provider: actualProvider,
          requestedModel: requestedModelEntry
            ? { id: requestedModelEntry.id, name: requestedModelEntry.name, provider: requestedModelEntry.provider }
            : null,
          cloud,
          sourceLabel: source === "llm" ? "Cloud model" : "Deterministic engine · no model ran",
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
