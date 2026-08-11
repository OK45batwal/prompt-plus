import { PromptIR } from "./types";

export interface ValidationIssue {
  type: "error" | "warning";
  code: string;
  message: string;
  field?: string;
}

export interface StructuralValidationResult {
  isValid: boolean;
  score: number; // 0 to 100
  issues: ValidationIssue[];
}

export function validatePromptIR(ir: PromptIR): StructuralValidationResult {
  const issues: ValidationIssue[] = [];

  // 1. Objective presence
  if (!ir.objective || !ir.objective.trim()) {
    issues.push({
      type: "error",
      code: "MISSING_OBJECTIVE",
      message: "Prompt objective is empty or missing.",
      field: "objective",
    });
  }

  // 2. Length check
  const renderedLength = ir.objective.length;
  if (renderedLength < 10) {
    issues.push({
      type: "warning",
      code: "TOO_SHORT",
      message: "Prompt objective is extremely short (< 10 characters).",
      field: "objective",
    });
  }

  // 3. Unresolved template variables check (e.g. {{variable}} or {var})
  const unmappedVars = ir.objective.match(/\{\{?\w+\}?\}|\[YOUR_\w+\]/g);
  if (unmappedVars && unmappedVars.length > 0) {
    issues.push({
      type: "warning",
      code: "UNRESOLVED_VARIABLES",
      message: `Prompt contains unresolved variable placeholders: ${unmappedVars.join(", ")}`,
      field: "objective",
    });
  }

  // 4. Duplicate constraints check
  const seenConstraints = new Set<string>();
  for (const c of ir.constraints) {
    const norm = c.text.toLowerCase().trim();
    if (seenConstraints.has(norm)) {
      issues.push({
        type: "warning",
        code: "DUPLICATE_CONSTRAINT",
        message: `Duplicate constraint detected: "${c.text}"`,
        field: "constraints",
      });
    } else {
      seenConstraints.add(norm);
    }
  }

  // 5. Deliverable contract check
  if (!ir.output || !ir.output.format) {
    issues.push({
      type: "warning",
      code: "MISSING_OUTPUT_CONTRACT",
      message: "No deliverable format contract specified.",
      field: "output",
    });
  }

  const errorsCount = issues.filter((i) => i.type === "error").length;
  const warningsCount = issues.filter((i) => i.type === "warning").length;

  const score = Math.max(0, 100 - errorsCount * 40 - warningsCount * 10);
  const isValid = errorsCount === 0;

  return {
    isValid,
    score,
    issues,
  };
}
