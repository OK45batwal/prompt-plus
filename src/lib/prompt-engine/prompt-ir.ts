import {
  PromptIR,
  Constraint,
  Instruction,
  Example,
  OutputContract,
  ReasoningConfig,
} from "./types";

export function createEmptyPromptIR(objective = ""): PromptIR {
  const now = Date.now();
  return {
    objective,
    context: [],
    inputs: [],
    instructions: [],
    constraints: [],
    examples: [],
    output: {
      format: "markdown",
    },
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
  };
}

export function renderPromptIRToString(ir: PromptIR): string {
  const parts: string[] = [];

  // Role / Persona
  if (ir.role && ir.role.trim()) {
    parts.push(`### ROLE & PERSONA\n${ir.role.trim()}`);
  }

  // Objective
  if (ir.objective && ir.objective.trim()) {
    parts.push(`### OBJECTIVE & GOAL\n${ir.objective.trim()}`);
  }

  // Audience & Tone
  if ((ir.audience && ir.audience.trim()) || (ir.tone && ir.tone.trim())) {
    const metaStr = [
      ir.audience ? `Target Audience: ${ir.audience.trim()}` : "",
      ir.tone ? `Tone Profile: ${ir.tone.trim()}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
    parts.push(`### TARGET AUDIENCE & TONE\n${metaStr}`);
  }

  // Context Blocks
  if (ir.context && ir.context.length > 0) {
    const ctxLines = ir.context
      .map((c, i) => `[Context Item ${i + 1}] (${c.type}): ${c.content.trim()}`)
      .join("\n\n");
    parts.push(`### BACKGROUND CONTEXT\n${ctxLines}`);
  }

  // Input Definitions
  if (ir.inputs && ir.inputs.length > 0) {
    const inputLines = ir.inputs
      .map((inp) => `- ${inp.name} (${inp.type}): ${inp.description || "Required input"}`)
      .join("\n");
    parts.push(`### REQUIRED INPUT VARIABLES\n${inputLines}`);
  }

  // Instructions
  if (ir.instructions && ir.instructions.length > 0) {
    const stepLines = ir.instructions
      .map((ins, i) => `${i + 1}. ${ins.text.trim()}`)
      .join("\n");
    parts.push(`### STEP-BY-STEP INSTRUCTIONS\n${stepLines}`);
  }

  // Constraints
  if (ir.constraints && ir.constraints.length > 0) {
    const constraintLines = ir.constraints
      .map((c) => `- [${c.priority.toUpperCase()}] ${c.text.trim()}`)
      .join("\n");
    parts.push(`### CONSTRAINTS & OPERATING RULES\n${constraintLines}`);
  }

  // Few-Shot Examples
  if (ir.examples && ir.examples.length > 0) {
    const exLines = ir.examples
      .map(
        (ex, i) =>
          `[Example ${i + 1}]\nInput:\n${ex.input}\n\nOutput:\n${ex.output}${
            ex.explanation ? `\n\nExplanation:\n${ex.explanation}` : ""
          }`
      )
      .join("\n\n---\n\n");
    parts.push(`### EXAMPLES\n${exLines}`);
  }

  // Output Contract
  if (ir.output) {
    let outStr = `Format: ${ir.output.format.toUpperCase()}`;
    if (ir.output.sections && ir.output.sections.length > 0) {
      outStr += `\nRequired Sections:\n` + ir.output.sections.map((s) => `- ${s}`).join("\n");
    }
    if (ir.output.styleNotes && ir.output.styleNotes.length > 0) {
      outStr += `\nOutput Guidelines:\n` + ir.output.styleNotes.map((n) => `- ${n}`).join("\n");
    }
    if (ir.output.schema) {
      const schemaStr = typeof ir.output.schema === "string" ? ir.output.schema : JSON.stringify(ir.output.schema, null, 2);
      outStr += `\nJSON Schema:\n\`\`\`json\n${schemaStr}\n\`\`\``;
    }
    parts.push(`### DELIVERABLE FORMAT & OUTPUT CONTRACT\n${outStr}`);
  }

  // Reasoning Requirements
  if (ir.reasoningConfig?.mandateStepByStep || ir.reasoningConfig?.effort) {
    let reasonStr = "Before returning the final output, perform a step-by-step reasoning analysis.";
    if (ir.reasoningConfig.effort) {
      reasonStr += ` Set reasoning effort to: ${ir.reasoningConfig.effort}.`;
    }
    parts.push(`### REASONING REQUIREMENT\n${reasonStr}`);
  }

  return parts.join("\n\n");
}

export function parseTextToPromptIR(rawText: string): PromptIR {
  const ir = createEmptyPromptIR(rawText);
  if (!rawText || !rawText.trim()) return ir;

  const text = rawText.trim();
  ir.objective = text;

  // Extract explicit sections if markdown headers are present
  const sectionRegex = /###?\s+([^\n]+)\n([\s\S]*?)(?=(?:###?\s+|$))/gi;
  let match: RegExpExecArray | null;

  while ((match = sectionRegex.exec(text)) !== null) {
    const title = match[1].toLowerCase().trim();
    const content = match[2].trim();

    if (title.includes("role") || title.includes("persona")) {
      ir.role = content;
    } else if (title.includes("objective") || title.includes("goal")) {
      ir.objective = content;
    } else if (title.includes("instruction") || title.includes("step")) {
      ir.instructions = content
        .split(/\n+/)
        .map((line) => line.replace(/^\d+\.\s*|-\s*/, "").trim())
        .filter(Boolean)
        .map((t, idx) => ({ stepNumber: idx + 1, text: t }));
    } else if (title.includes("constraint") || title.includes("rule")) {
      ir.constraints = content
        .split(/\n+/)
        .map((line) => line.replace(/^-\s*|\[[^\]]+\]\s*/, "").trim())
        .filter(Boolean)
        .map((t) => ({ text: t, priority: "high", source: "user" }));
    } else if (title.includes("context") || title.includes("background")) {
      ir.context.push({
        content,
        type: "document",
        trustLevel: "trusted",
        relevanceScore: 0.9,
      });
    } else if (title.includes("format") || title.includes("output")) {
      ir.output.styleNotes = content.split(/\n+/).filter(Boolean);
    }
  }

  return ir;
}

/**
 * Atomic AST Modifications
 */
export function addConstraint(ir: PromptIR, constraintText: string, priority: Constraint["priority"] = "high", source: Constraint["source"] = "user"): PromptIR {
  const existing = ir.constraints.some((c) => c.text.toLowerCase() === constraintText.toLowerCase());
  if (existing) return ir;

  return {
    ...ir,
    constraints: [...ir.constraints, { text: constraintText, priority, source }],
    metadata: { ...ir.metadata, updatedAt: Date.now() },
  };
}

export function removeRedundantInstructions(ir: PromptIR): { ir: PromptIR; tokensSaved: number } {
  const uniqueInstructions: Instruction[] = [];
  const seen = new Set<string>();
  let tokensSaved = 0;

  for (const ins of ir.instructions) {
    const normalized = ins.text.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seen.has(normalized)) {
      tokensSaved += Math.ceil(ins.text.length / 4);
    } else {
      seen.add(normalized);
      uniqueInstructions.push(ins);
    }
  }

  return {
    ir: {
      ...ir,
      instructions: uniqueInstructions,
      metadata: { ...ir.metadata, updatedAt: Date.now() },
    },
    tokensSaved,
  };
}

export function setOutputContract(ir: PromptIR, contract: Partial<OutputContract>): PromptIR {
  return {
    ...ir,
    output: {
      ...ir.output,
      ...contract,
    },
    metadata: { ...ir.metadata, updatedAt: Date.now() },
  };
}

export function addExample(ir: PromptIR, example: Example): PromptIR {
  return {
    ...ir,
    examples: [...ir.examples, example],
    metadata: { ...ir.metadata, updatedAt: Date.now() },
  };
}

export function compressContext(ir: PromptIR, maxBlocks = 3): { ir: PromptIR; removedCount: number } {
  if (ir.context.length <= maxBlocks) return { ir, removedCount: 0 };

  const sorted = [...ir.context].sort((a, b) => b.relevanceScore - a.relevanceScore);
  const kept = sorted.slice(0, maxBlocks);
  const removedCount = ir.context.length - maxBlocks;

  return {
    ir: {
      ...ir,
      context: kept,
      metadata: { ...ir.metadata, updatedAt: Date.now() },
    },
    removedCount,
  };
}

export function updateReasoning(ir: PromptIR, reasoning: ReasoningConfig): PromptIR {
  return {
    ...ir,
    reasoningConfig: {
      ...ir.reasoningConfig,
      ...reasoning,
    },
    metadata: { ...ir.metadata, updatedAt: Date.now() },
  };
}
