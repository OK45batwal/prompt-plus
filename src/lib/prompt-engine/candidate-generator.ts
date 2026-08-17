import { PromptIR, PromptCandidate, TaskType } from "./types";
import { renderPromptIRToString, renderPromptIRToXMLString, removeRedundantInstructions, addConstraint } from "./prompt-ir";
import { StrategyRegistry, selectStrategiesForTask } from "./strategy-engine";
import { synthesizeFewShotExamples } from "./example-synthesizer";

export interface ContradictionConflict {
  constraintA: string;
  constraintB: string;
  recommendedResolution: string;
}

export function detectConstraintContradictions(ir: PromptIR): ContradictionConflict[] {
  const conflicts: ContradictionConflict[] = [];
  const texts = ir.constraints.map((c) => c.text.toLowerCase());

  const hasConcise = texts.some((t) => t.includes("concise") || t.includes("fewer than") || t.includes("under 100 words") || t.includes("brief"));
  const hasDetailed = texts.some((t) => t.includes("extremely detailed") || t.includes("comprehensive") || t.includes("exhaustive") || t.includes("in-depth"));

  if (hasConcise && hasDetailed) {
    conflicts.push({
      constraintA: "High detail / comprehensive output constraint",
      constraintB: "Brevity / under 100 words constraint",
      recommendedResolution: "Prioritize concise output while retaining essential technical facts.",
    });
  }

  const hasJsonOnly = texts.some((t) => t.includes("json only") || t.includes("return json"));
  const hasParagraphs = texts.some((t) => t.includes("explain in paragraphs") || t.includes("prose explanation"));

  if (hasJsonOnly && hasParagraphs) {
    conflicts.push({
      constraintA: "Strict JSON-only deliverable",
      constraintB: "Paragraph prose explanation constraint",
      recommendedResolution: "Return structured JSON containing an 'explanation' field.",
    });
  }

  return conflicts;
}

export function generateCandidates(baseIR: PromptIR, taskType: TaskType, complexity: "low" | "medium" | "high" | "expert"): PromptCandidate[] {
  const candidates: PromptCandidate[] = [];

  // Remove redundancies first
  const { ir: cleanedIR } = removeRedundantInstructions(baseIR);

  // Generate synthetic few-shot examples if none present
  const synthesizedExamples = cleanedIR.examples.length === 0 ? synthesizeFewShotExamples(taskType, cleanedIR.objective) : [];

  // Candidate A: Concise
  const conciseIR: PromptIR = {
    ...cleanedIR,
    instructions: cleanedIR.instructions.slice(0, 3),
    constraints: cleanedIR.constraints.filter((c) => c.priority === "critical" || c.priority === "high"),
    verbosityConfig: { level: "low" },
  };
  const conciseText = renderPromptIRToString(conciseIR);
  candidates.push({
    id: "candidate_concise",
    name: "Concise & Fast",
    strategyName: "Efficiency Optimized",
    ir: conciseIR,
    renderedText: conciseText,
    efficiencyScore: 95,
    estimatedTokens: Math.ceil(conciseText.length / 4),
  });

  // Candidate B: Structured (Standard Production Grade)
  let structuredIR = {
    ...cleanedIR,
    examples: [...cleanedIR.examples, ...synthesizedExamples],
  };
  const targetStrategies = selectStrategiesForTask(taskType, complexity);
  for (const stId of targetStrategies) {
    const strategy = StrategyRegistry[stId];
    if (strategy) {
      structuredIR = strategy.apply(structuredIR);
    }
  }
  const structuredText = renderPromptIRToString(structuredIR);
  candidates.push({
    id: "candidate_structured",
    name: "Structured & Production-Grade",
    strategyName: "Standard Multi-Strategy",
    ir: structuredIR,
    renderedText: structuredText,
    efficiencyScore: 85,
    estimatedTokens: Math.ceil(structuredText.length / 4),
  });

  // Candidate C: Detailed & Exhaustive
  let detailedIR = { ...structuredIR };
  detailedIR = addConstraint(detailedIR, "Cover all edge cases, exception handling, and implicit assumptions explicitly.", "high", "system");
  if (!detailedIR.reasoningConfig?.effort) {
    detailedIR.reasoningConfig = { effort: "high", mandateStepByStep: true };
  }
  const detailedText = renderPromptIRToString(detailedIR);
  candidates.push({
    id: "candidate_detailed",
    name: "Comprehensive & Deep",
    strategyName: "Full Guardrails & Edge Cases",
    ir: detailedIR,
    renderedText: detailedText,
    efficiencyScore: 70,
    estimatedTokens: Math.ceil(detailedText.length / 4),
  });

  // Candidate D: Model-Specific (GPT-5 / o3 / Claude 3.5 Sonnet)
  let modelSpecificIR = { ...structuredIR };
  const modelStrategy = StrategyRegistry["model_specific"];
  if (modelStrategy) {
    modelSpecificIR = modelStrategy.apply(modelSpecificIR);
  }
  const modelSpecificText = renderPromptIRToXMLString(modelSpecificIR);
  candidates.push({
    id: "candidate_model_specific",
    name: "Model-Tuned (GPT-5 / Claude 3.5)",
    strategyName: "Anthropic XML & Reasoning Tuned",
    ir: modelSpecificIR,
    renderedText: modelSpecificText,
    efficiencyScore: 80,
    estimatedTokens: Math.ceil(modelSpecificText.length / 4),
  });

  return candidates;
}
