import { PromptCandidate, EvaluationResult } from "./types";
import { validatePromptIR } from "./validation-engine";
import { calculateIntentPreservationScore, extractIntent } from "./intent-engine";
import { callLLM } from "../llm/providers";

export interface HybridScoreBreakdown {
  totalScore: number; // 0 to 100
  structuralScore: number; // Max 20
  intentScore: number; // Max 20
  constraintScore: number; // Max 20
  evaluationScore: number; // Max 25
  efficiencyScore: number; // Max 15
  dimensionBreakdown: {
    clarity: number;
    specificity: number;
    structure: number;
    actionability: number;
  };
}

export function calculateHybridScore(
  originalPrompt: string,
  candidate: PromptCandidate,
  evalResultScore = 85
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
  const evaluationScore = Math.round((evalResultScore / 100) * 25);

  // 5. Efficiency Score (Max 15)
  const rawEff = candidate.efficiencyScore || 80;
  const efficiencyScore = Math.round((rawEff / 100) * 15);

  const totalScore = structuralScore + intentScore + constraintScore + evaluationScore + efficiencyScore;

  return {
    totalScore,
    structuralScore,
    intentScore,
    constraintScore,
    evaluationScore,
    efficiencyScore,
    dimensionBreakdown: {
      clarity: Math.round(intentPreservation * 0.9),
      specificity: Math.round(rawConstraint * 0.95),
      structure: Math.round(validation.score * 0.9),
      actionability: Math.round(evalResultScore * 0.9),
    },
  };
}

export function evaluateOutputQuality(output: string): number {
  if (!output || output.startsWith("Execution failed")) return 25;

  let score = 55;
  const clean = output.trim();
  const wordCount = clean.split(/\s+/).filter(Boolean).length;

  // Substance factor (up to 20 pts)
  if (wordCount >= 40 && wordCount <= 800) {
    score += 20;
  } else if (wordCount >= 15) {
    score += 10;
  }

  // Formatting & structure factor (markdown headers, code blocks, lists)
  const hasFormatting = /```|###|\n- |\n\d+\. /m.test(clean);
  if (hasFormatting) score += 15;

  // Fluff penalty
  const hasFluff = /\b(as an ai|here is the|sure!|certainly!|i hope this helps|feel free to ask)\b/i.test(clean);
  if (hasFluff) score -= 15;

  return Math.min(98, Math.max(25, score));
}

/**
 * Executes Real Prompt Evaluation by running Original vs Optimized Prompts on a target LLM model.
 */
export async function runRealPromptEvaluation(
  originalPrompt: string,
  candidatePromptText: string,
  targetModel = "google/gemini-2.0-flash-exp:free"
): Promise<{
  originalOutput: string;
  optimizedOutput: string;
  baselineScore: number;
  optimizedScore: number;
  improvementDelta: number;
  winner: "original" | "optimized";
}> {
  let originalOutput = "";
  let optimizedOutput = "";

  try {
    const resOrig = await callLLM({
      systemPrompt: "You are a helpful AI assistant. Answer the user prompt directly.",
      userPrompt: originalPrompt,
      model: targetModel,
      maxTokens: 800,
    });
    originalOutput = resOrig.content;
  } catch {
    originalOutput = "Execution failed on original prompt.";
  }

  try {
    const resOpt = await callLLM({
      systemPrompt: "You are an elite AI assistant executing an optimized master prompt. Follow all instructions and output contracts precisely.",
      userPrompt: candidatePromptText,
      model: targetModel,
      maxTokens: 800,
    });
    optimizedOutput = resOpt.content;
  } catch {
    optimizedOutput = "Execution failed on optimized prompt.";
  }

  const baselineScore = evaluateOutputQuality(originalOutput);
  const optimizedScore = evaluateOutputQuality(optimizedOutput);
  const improvementDelta = optimizedScore - baselineScore;

  return {
    originalOutput,
    optimizedOutput,
    baselineScore,
    optimizedScore,
    improvementDelta,
    winner: improvementDelta >= 0 ? "optimized" : "original",
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

  const count = v2Results.length || 1;
  const averageScoreChange = Math.round((totalDelta / count) * 10) / 10;

  return {
    hasRegression: regressedCasesCount > 0,
    regressedCasesCount,
    improvedCasesCount,
    averageScoreChange,
    details,
  };
}
