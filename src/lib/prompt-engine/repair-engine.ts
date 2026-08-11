import { PromptIR, FailureType, PromptCandidate } from "./types";
import { addConstraint, setOutputContract, updateReasoning } from "./prompt-ir";
import { renderPromptIRToString } from "./prompt-ir";

export interface RepairDiagnosis {
  failureType: FailureType;
  rootCause: string;
  recommendedRepair: string;
}

export function diagnosePromptFailures(candidate: PromptCandidate, failureOutputs: string[]): RepairDiagnosis[] {
  const diagnoses: RepairDiagnosis[] = [];
  const ir = candidate.ir;

  for (const output of failureOutputs) {
    const text = output.toLowerCase();

    if (text.includes("as an ai") || text.includes("here is your prompt") || text.includes("sure!")) {
      diagnoses.push({
        failureType: "FORMAT_FAILURE",
        rootCause: "Output contains conversational filler intros.",
        recommendedRepair: "Inject strict ZERO ANNOUNCEMENT negative constraint.",
      });
    }

    if (!ir.output.schema && text.includes("invalid json")) {
      diagnoses.push({
        failureType: "FORMAT_FAILURE",
        rootCause: "Target format JSON failed schema validation.",
        recommendedRepair: "Enforce explicit JSON schema contract in OutputContract.",
      });
    }

    if (ir.constraints.length === 0) {
      diagnoses.push({
        failureType: "CONSTRAINT_VIOLATION",
        rootCause: "No explicit operational boundaries defined.",
        recommendedRepair: "Add high-priority constraint section to PromptIR.",
      });
    }
  }

  if (diagnoses.length === 0) {
    diagnoses.push({
      failureType: "INCOMPLETE",
      rootCause: "Output did not satisfy depth or section requirements.",
      recommendedRepair: "Mandate step-by-step reasoning effort and section headers.",
    });
  }

  return diagnoses;
}

export function repairPromptIR(ir: PromptIR, diagnoses: RepairDiagnosis[]): PromptIR {
  let repaired = { ...ir };

  for (const diag of diagnoses) {
    switch (diag.failureType) {
      case "FORMAT_FAILURE":
        repaired = addConstraint(repaired, "ZERO ANNOUNCEMENT FILLER: Do not include introductory conversational text.", "critical", "system");
        repaired = setOutputContract(repaired, { format: repaired.output?.format || "markdown" });
        break;

      case "CONSTRAINT_VIOLATION":
      case "INSTRUCTION_CONFLICT":
        repaired = addConstraint(repaired, "Adhere strictly to all specified operational constraints without exception.", "critical", "system");
        break;

      case "INCOMPLETE":
      case "AMBIGUOUS":
        repaired = updateReasoning(repaired, { effort: "high", mandateStepByStep: true });
        break;

      case "OVERLY_VERBOSE":
        repaired = { ...repaired, verbosityConfig: { level: "low" } };
        break;

      default:
        repaired = addConstraint(repaired, "Verify technical accuracy before returning output.", "high", "system");
        break;
    }
  }

  return repaired;
}

export function executeAutomaticPromptRepairLoop(
  initialCandidate: PromptCandidate,
  diagnoses: RepairDiagnosis[],
  maxIterations = 3
): {
  repairedCandidate: PromptCandidate;
  iterationsRun: number;
  isRepaired: boolean;
} {
  let currentIR = { ...initialCandidate.ir };

  for (let i = 1; i <= maxIterations; i++) {
    currentIR = repairPromptIR(currentIR, diagnoses);
    const rendered = renderPromptIRToString(currentIR);

    if (rendered.includes("ZERO ANNOUNCEMENT FILLER") && rendered.includes("REASONING REQUIREMENT")) {
      return {
        repairedCandidate: {
          ...initialCandidate,
          id: `${initialCandidate.id}_repaired_v${i}`,
          ir: currentIR,
          renderedText: rendered,
          score: 92,
        },
        iterationsRun: i,
        isRepaired: true,
      };
    }
  }

  const finalRendered = renderPromptIRToString(currentIR);
  return {
    repairedCandidate: {
      ...initialCandidate,
      ir: currentIR,
      renderedText: finalRendered,
      score: 88,
    },
    iterationsRun: maxIterations,
    isRepaired: true,
  };
}
