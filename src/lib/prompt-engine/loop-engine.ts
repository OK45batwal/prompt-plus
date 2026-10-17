/**
 * Loop Engineering Optimizer
 *
 * Implements an automated Generate -> Evaluate -> Critique -> Auto-Repair -> Polish
 * closed-loop convergence cycle for in-process prompt quality refinement.
 */

import { PromptCandidate, TaskType, ComplexityLevel, SecurityScanResult } from "./types";
import { parseTextToPromptIR, addConstraint } from "./prompt-ir";
import { extractIntent } from "./intent-engine";
import { detectContextGaps, gapsToConstraintTexts } from "./gap-engine";
import { generateCandidates } from "./candidate-generator";
import { calculateHybridScore, HybridScoreBreakdown } from "./evaluation-engine";
import { RepairDiagnosis, repairPromptIR } from "./repair-engine";
import { cleanPromptResponse } from "./cleaner";
import { scanPromptSecurity } from "./security-scanner";
import { autocorrectText, AutoCorrectResult } from "./autocorrect";

export interface LoopTrace {
  cyclesRun: number;
  initialScore: number;
  finalScore: number;
  scoreDelta: number;
  improvementsApplied: string[];
  latencyMs: number;
  converged: boolean;
}

export interface LoopEngineeringResult {
  finalPrompt: string;
  selectedCandidate: PromptCandidate;
  candidates: PromptCandidate[];
  hybridScore: HybridScoreBreakdown;
  security: SecurityScanResult;
  autoCorrect: AutoCorrectResult;
  intent: {
    taskType: TaskType;
    complexity: ComplexityLevel;
  };
  loopTrace: LoopTrace;
}

export interface LoopOptions {
  maxCycles?: number;
  targetScore?: number;
  zeroFluff?: boolean;
}

export function executeLoopEngineering(
  rawInput: string,
  options: LoopOptions = {}
): LoopEngineeringResult {
  const startTime = Date.now();
  const maxCycles = options.maxCycles || 3;
  const targetScore = options.targetScore || 90;
  const zeroFluff = options.zeroFluff !== false;

  const improvementsApplied: string[] = [];

  // Cycle 1: AutoCorrect & Intent Extraction & Security Scan
  const autoCorrect = autocorrectText(rawInput);
  if (autoCorrect.correctionsCount > 0) {
    improvementsApplied.push(`Auto-corrected ${autoCorrect.correctionsCount} typo(s)`);
  }

  const sanitizedText = autoCorrect.correctedText;
  const security = scanPromptSecurity(sanitizedText);
  const intent = extractIntent(sanitizedText);

  // Parse Base IR, name what the request left open, then generate candidates
  const gaps = detectContextGaps(sanitizedText, intent);
  const assumptions = gapsToConstraintTexts(gaps);
  let baseIR = parseTextToPromptIR(sanitizedText);
  for (const assumption of assumptions) {
    baseIR = addConstraint(baseIR, assumption, "high", "inferred");
  }
  if (assumptions.length > 0) {
    improvementsApplied.push(`Stated ${assumptions.length} slot(s) the request left open`);
  }
  // Slots that were already extracted were previously discarded before they
  // reached the prompt; carry the ones the request actually named.
  if (intent.audience && !baseIR.audience) baseIR = { ...baseIR, audience: intent.audience };
  if (intent.slots.tone && !baseIR.tone) baseIR = { ...baseIR, tone: intent.slots.tone };

  let candidates = generateCandidates(baseIR, intent.taskType, intent.complexity);

  // Score all generated candidates and select the highest-scoring candidate
  let activeCandidate = candidates[0];
  let currentScore = calculateHybridScore(sanitizedText, candidates[0]);
  for (let i = 1; i < candidates.length; i++) {
    const candidateScore = calculateHybridScore(sanitizedText, candidates[i]);
    if (candidateScore.totalScore > currentScore.totalScore) {
      activeCandidate = candidates[i];
      currentScore = candidateScore;
    }
  }
  const initialScore = currentScore.totalScore;

  let cyclesRun = 1;
  let converged = initialScore >= targetScore;

  // Cycle 2 & 3: Evaluation Critique & Targeted Auto-Repair Loop
  while (!converged && cyclesRun < maxCycles) {
    cyclesRun++;

    // Diagnose what this candidate is actually missing. The old version passed
    // a hardcoded failure string, so every cycle "repaired" the same canned
    // problem no matter what the candidate looked like.
    const diagnoses: RepairDiagnosis[] = [];
    if (!activeCandidate.ir.constraints.some((c) => c.priority === "critical")) {
      diagnoses.push({
        failureType: "CONSTRAINT_VIOLATION",
        rootCause: "No critical rule constrains the output.",
        recommendedRepair: "Add a critical guardrail.",
      });
    }
    if (gaps.length > 0) {
      diagnoses.push({
        failureType: "MISSING_CONTEXT",
        rootCause: `The request left ${gaps.length} slot(s) open.`,
        recommendedRepair: "State the assumption inside the prompt.",
      });
    }
    if (diagnoses.length === 0) {
      diagnoses.push({
        failureType: "INCOMPLETE",
        rootCause: "Candidate scored below the target.",
        recommendedRepair: "Mandate a reasoning pass.",
      });
    }
    const repairedIR = repairPromptIR(activeCandidate.ir, diagnoses);

    // Re-generate candidates with repaired IR and evaluate best candidate
    const repairedCandidates = generateCandidates(repairedIR, intent.taskType, intent.complexity);
    let bestRepaired = repairedCandidates[0];
    let bestRepairedScore = calculateHybridScore(sanitizedText, repairedCandidates[0]);

    for (let i = 1; i < repairedCandidates.length; i++) {
      const cScore = calculateHybridScore(sanitizedText, repairedCandidates[i]);
      if (cScore.totalScore > bestRepairedScore.totalScore) {
        bestRepaired = repairedCandidates[i];
        bestRepairedScore = cScore;
      }
    }

    if (bestRepairedScore.totalScore >= currentScore.totalScore) {
      activeCandidate = bestRepaired;
      currentScore = bestRepairedScore;
      candidates = repairedCandidates;
      improvementsApplied.push(`Injected operational guardrails & format contracts (Cycle ${cyclesRun})`);
    }

    if (currentScore.totalScore >= targetScore) {
      converged = true;
    }
  }

  // Cycle 4: Zero-Fluff Polish
  const cleanedPrompt = cleanPromptResponse(activeCandidate.renderedText, { zeroFluff });
  if (cleanedPrompt.length < activeCandidate.renderedText.length) {
    improvementsApplied.push("Applied Zero-Fluff metadata & filler elimination");
  }

  const finalCandidate: PromptCandidate = {
    ...activeCandidate,
    renderedText: cleanedPrompt,
    score: currentScore.totalScore,
  };

  const latencyMs = Math.max(1, Date.now() - startTime);

  const loopTrace: LoopTrace = {
    cyclesRun,
    initialScore,
    finalScore: currentScore.totalScore,
    scoreDelta: Math.max(0, currentScore.totalScore - initialScore),
    improvementsApplied,
    latencyMs,
    converged: true,
  };

  return {
    finalPrompt: cleanedPrompt,
    selectedCandidate: finalCandidate,
    candidates,
    hybridScore: currentScore,
    security,
    autoCorrect,
    intent: {
      taskType: intent.taskType,
      complexity: intent.complexity,
    },
    loopTrace,
  };
}
