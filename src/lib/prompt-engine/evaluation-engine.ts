import { PromptCandidate, EvaluationResult } from "./types";
import { validatePromptIR } from "./validation-engine";
import { calculateIntentPreservationScore, extractIntent } from "./intent-engine";
import { callLLM, LLMOptions, LLMResponse } from "../llm/providers";

export interface HybridScoreBreakdown {
  totalScore: number; // 0 to 100
  structuralScore: number; // Max 20
  intentScore: number; // Max 20
  constraintScore: number; // Max 20
  evaluationScore: number | null;
  evaluationStatus: "measured" | "unevaluated"; // Max 25
  efficiencyScore: number; // Max 15
  dimensionBreakdown: {
    clarity: number;
    specificity: number;
    structure: number;
    actionability: number | null;
  };
}

export function calculateHybridScore(
  originalPrompt: string,
  candidate: PromptCandidate,
  evalResultScore?: number
): HybridScoreBreakdown {
  const ir = candidate.ir;

  // 1. Structural Score (Max 20)
  const validation = validatePromptIR(ir);
  const structuralScore = Math.round((validation.score / 100) * 20);

  // 2. Intent Score (Max 20)
  const intent = extractIntent(originalPrompt);
  const intentPreservation = calculateIntentPreservationScore(intent, ir);
  const intentScore = Math.round((intentPreservation / 100) * 20);

  // 3. Constraint Score (Max 20)
  const hasCritical = ir.constraints.some((c) => c.priority === "critical");
  const constraintCount = ir.constraints.length;
  const rawConstraint = Math.min(100, (hasCritical ? 50 : 30) + constraintCount * 15);
  const constraintScore = Math.round((rawConstraint / 100) * 20);

  // 4. Evaluation Score (Max 25)
  const measured = evalResultScore !== undefined && Number.isFinite(evalResultScore);
  const evaluationScore = measured ? Math.round((Math.max(0, Math.min(100, evalResultScore)) / 100) * 25) : null;

  // 5. Efficiency Score (Max 15)
  const rawEff = candidate.efficiencyScore ?? 0;
  const efficiencyScore = Math.round((rawEff / 100) * 15);

  const subtotal = structuralScore + intentScore + constraintScore + efficiencyScore;
  const totalScore = measured ? subtotal + (evaluationScore ?? 0) : Math.round(subtotal / 75 * 100);

  return {
    totalScore,
    structuralScore,
    intentScore,
    constraintScore,
    evaluationScore,
    evaluationStatus: measured ? "measured" : "unevaluated",
    efficiencyScore,
    dimensionBreakdown: {
      clarity: Math.round(intentPreservation * 0.9),
      specificity: Math.round(rawConstraint * 0.95),
      structure: Math.round(validation.score * 0.9),
      actionability: measured ? Math.round(evalResultScore * 0.9) : null,
    },
  };
}

export interface OutputRubric {
  exact?: string;
  required?: string[];
  forbidden?: string[];
}

/** Task-specific checks, not a general semantic quality score. */
export function evaluateOutputQuality(output: string, rubric?: OutputRubric): number | null {
  if (!rubric || (rubric.exact === undefined && !rubric.required?.length && !rubric.forbidden?.length)) return null;
  const clean = output.trim();
  if (!clean) return 0;
  if (rubric.exact !== undefined && clean !== rubric.exact.trim()) return 0;
  if (rubric.required?.some((text) => !clean.includes(text))) return 0;
  if (rubric.forbidden?.some((text) => clean.includes(text))) return 0;
  return 100;
}

export async function runRealPromptEvaluation(
  originalPrompt: string,
  candidatePromptText: string,
  targetModel = "google/gemini-2.0-flash-exp:free",
  options: { rubric?: OutputRubric; apiKey?: string; provider?: LLMOptions["provider"]; tenantId?: string } = {},
) {
  const settings = {
    systemPrompt: "You are a helpful AI assistant. Answer the user prompt directly.",
    model: targetModel,
    maxTokens: 800,
    temperature: 0,
    bypassCache: true,
    disableFailover: true,
    maxAttempts: 1 as const,
    apiKey: options.apiKey,
    provider: options.provider,
    tenantId: options.tenantId,
  };
  async function execute(userPrompt: string) {
    const start = Date.now();
    try {
      const response = await callLLM({ ...settings, userPrompt });
      return { response, latencyMs: Date.now() - start, error: null };
    } catch {
      return { response: null as LLMResponse | null, latencyMs: Date.now() - start, error: "execution_failed" };
    }
  }
  // Two requests maximum per explicitly requested evaluation; no retries/failover.
  const original = await execute(originalPrompt);
  const optimized = await execute(candidatePromptText);
  const sameModel = original.response && optimized.response && original.response.model === optimized.response.model && original.response.provider === optimized.response.provider;
  const failed = !original.response?.content || !optimized.response?.content;
  const baselineScore = failed || !sameModel ? null : evaluateOutputQuality(original.response!.content, options.rubric);
  const optimizedScore = failed || !sameModel ? null : evaluateOutputQuality(optimized.response!.content, options.rubric);
  const improvementDelta = baselineScore === null || optimizedScore === null ? null : optimizedScore - baselineScore;
  const status = failed ? "failed" : !sameModel ? "inconclusive" : improvementDelta === null ? "unevaluated" : "measured";
  return {
    originalOutput: original.response?.content ?? "",
    optimizedOutput: optimized.response?.content ?? "",
    baselineScore, optimizedScore, improvementDelta, status,
    winner: improvementDelta === null ? null : improvementDelta === 0 ? "tie" : improvementDelta > 0 ? "optimized" : "original",
    grading: "task-rubric" as const,
    settings: { targetModel, temperature: settings.temperature, maxTokens: settings.maxTokens, maxRequests: 2 },
    runs: [original, optimized].map(({ response, latencyMs, error }) => ({ model: response?.model ?? null, provider: response?.provider ?? null, tokensIn: response?.tokensIn ?? null, tokensOut: response?.tokensOut ?? null, latencyMs, error })),
  };
}

/**
 * Runs Regression Test across an evaluation dataset
 */
export function runRegressionTest(
  v1Results: EvaluationResult[],
  v2Results: EvaluationResult[]
): {
  hasRegression: boolean;
  regressedCasesCount: number;
  improvedCasesCount: number;
  averageScoreChange: number;
  details: string[];
  missingCases: string[];
  addedCases: string[];
} {
  let regressedCasesCount = 0;
  let improvedCasesCount = 0;
  let totalDelta = 0;
  const details: string[] = [];

  const v1Map = new Map(v1Results.map((r) => [r.caseId, r.score]));

  for (const r2 of v2Results) {
    const v1Score = v1Map.get(r2.caseId);
    if (v1Score !== undefined) {
      const delta = r2.score - v1Score;
      totalDelta += delta;
      if (delta < -5) {
        regressedCasesCount++;
        details.push(`Case ${r2.caseId}: Performance dropped from ${v1Score} to ${r2.score} (${delta})`);
      } else if (delta > 5) {
        improvedCasesCount++;
      }
    }
  }

  const newIds = new Set(v2Results.map((r) => r.caseId));
  const missingCases = v1Results.filter((r) => !newIds.has(r.caseId)).map((r) => r.caseId);
  const addedCases = v2Results.filter((r) => !v1Map.has(r.caseId)).map((r) => r.caseId);
  const count = v2Results.filter((r) => v1Map.has(r.caseId)).length || 1;
  const averageScoreChange = Math.round((totalDelta / count) * 10) / 10;

  return {
    hasRegression: regressedCasesCount > 0 || missingCases.length > 0,
    missingCases, addedCases,
    regressedCasesCount,
    improvedCasesCount,
    averageScoreChange,
    details,
  };
}
