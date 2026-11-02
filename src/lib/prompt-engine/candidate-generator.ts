import { PromptIR, PromptCandidate, TaskType, ComplexityLevel } from "./types";
import { renderPromptIRToString, renderPromptIRToXMLString, removeRedundantInstructions } from "./prompt-ir";
import { StrategyRegistry, selectStrategiesForTask } from "./strategy-engine";
import { selectFewShotExamples } from "./example-synthesizer";

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

function toCandidate(id: string, name: string, strategyName: string, ir: PromptIR, renderedText: string): PromptCandidate {
  return { id, name, strategyName, ir, renderedText, estimatedTokens: Math.ceil(renderedText.length / 4) };
}

/**
 * Four genuinely different approaches -- a bare directive, a structured role, a
 * rule-only guardrail set and an explicit reasoning pass -- instead of four
 * verbosity levels of one prompt. Each carries its own cost, and which one wins
 * depends on what the request actually asked for.
 */
export function generateCandidates(baseIR: PromptIR, taskType: TaskType, complexity: ComplexityLevel): PromptCandidate[] {
  // Remove redundancies first
  const { ir: cleanedIR } = removeRedundantInstructions(baseIR);

  // The one library example whose tags best match this request.
  const selectedExamples = cleanedIR.examples.length === 0 ? selectFewShotExamples(taskType, cleanedIR.objective) : [];

  // A -- Direct: the request, tightened. No persona and no worked example, for
  // requests short and specific enough that scaffolding is only cost. Critical
  // rules stay, and so do the stated assumptions -- dropping either would lose
  // something the user needs to see.
  const directIR: PromptIR = {
    ...cleanedIR,
    role: undefined,
    instructions: cleanedIR.instructions.slice(0, 3),
    constraints: cleanedIR.constraints.filter((c) => c.priority === "critical" || c.source === "inferred"),
    examples: [],
    verbosityConfig: { level: "low" },
  };

  // B -- Role & Structure: the strategies declared for this task, plus the
  // matched example.
  let structuredIR: PromptIR = {
    ...cleanedIR,
    examples: [...cleanedIR.examples, ...selectedExamples],
  };
  for (const strategyId of selectStrategiesForTask(taskType, complexity)) {
    const strategy = StrategyRegistry[strategyId];
    if (strategy) structuredIR = strategy.apply(structuredIR);
  }

  // C -- Lean: B's structure without the worked example, for requests where the
  // example would be the largest single cost.
  const leanIR: PromptIR = { ...structuredIR, examples: [] };

  // D -- Reasoning: B plus a reasoning mandate, rendered as XML tags.
  const reasoningIR: PromptIR = StrategyRegistry.model_specific.apply(structuredIR);

  return [
    toCandidate("candidate_concise", "Direct & Minimal", "No persona, critical rules only", directIR, renderPromptIRToString(directIR)),
    toCandidate("candidate_structured", "Role & Structure", "Task strategies + matched example", structuredIR, renderPromptIRToString(structuredIR)),
    toCandidate("candidate_lean", "Lean & Structured", "Task strategies, no example", leanIR, renderPromptIRToString(leanIR)),
    toCandidate("candidate_reasoning", "Reasoning-Led (XML)", "Step-by-step mandate, XML sections", reasoningIR, renderPromptIRToXMLString(reasoningIR)),
  ];
}
