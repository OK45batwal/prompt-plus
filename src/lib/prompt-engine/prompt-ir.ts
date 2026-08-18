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

export function renderPromptIRToXMLString(ir: PromptIR): string {
  const parts: string[] = [];

  // Role / Persona
  if (ir.role && ir.role.trim()) {
    parts.push(`<role>\n${ir.role.trim()}\n</role>`);
  }

  // Objective
  if (ir.objective && ir.objective.trim()) {
    parts.push(`<objective>\n${ir.objective.trim()}\n</objective>`);
  }

  // Audience & Tone
  if (ir.audience || ir.tone) {
    let metaStr = "<target_audience_and_tone>\n";
    if (ir.audience) metaStr += `  <audience>${ir.audience.trim()}</audience>\n`;
    if (ir.tone) metaStr += `  <tone>${ir.tone.trim()}</tone>\n`;
    metaStr += "</target_audience_and_tone>";
    parts.push(metaStr);
  }

  // Background Context
  if (ir.context && ir.context.length > 0) {
    const ctxStr = `<background_context>\n` +
      ir.context.map((c, i) => `  <item index="${i + 1}" type="${c.type}">\n${c.content.trim()}\n  </item>`).join("\n") +
      `\n</background_context>`;
    parts.push(ctxStr);
  }

  // Inputs
  if (ir.inputs && ir.inputs.length > 0) {
    const inputStr = `<required_inputs>\n` +
      ir.inputs.map((inp) => `  <variable name="${inp.name}" type="${inp.type}">${inp.description || "Required input"}</variable>`).join("\n") +
      `\n</required_inputs>`;
    parts.push(inputStr);
  }

  // Step-by-Step Instructions
  if (ir.instructions && ir.instructions.length > 0) {
    const stepStr = `<instructions>\n` +
      ir.instructions.map((ins, i) => `  <step index="${i + 1}">${ins.text.trim()}</step>`).join("\n") +
      `\n</instructions>`;
    parts.push(stepStr);
  }

  // Constraints
  if (ir.constraints && ir.constraints.length > 0) {
    const constraintStr = `<constraints>\n` +
      ir.constraints.map((c) => `  <rule priority="${c.priority}">${c.text.trim()}</rule>`).join("\n") +
      `\n</constraints>`;
    parts.push(constraintStr);
  }

  // Examples
  if (ir.examples && ir.examples.length > 0) {
    const exStr = `<examples>\n` +
      ir.examples.map((ex, i) =>
        `  <example index="${i + 1}">\n    <input>\n${ex.input}\n    </input>\n    <output>\n${ex.output}\n    </output>${ex.explanation ? `\n    <explanation>${ex.explanation}</explanation>` : ""}\n  </example>`
      ).join("\n") +
      `\n</examples>`;
    parts.push(exStr);
  }

  // Output Contract
  if (ir.output) {
    let outStr = `<output_contract>\n  <format>${ir.output.format.toUpperCase()}</format>`;
    if (ir.output.sections && ir.output.sections.length > 0) {
      outStr += `\n  <required_sections>\n` + ir.output.sections.map((s) => `    <section>${s}</section>`).join("\n") + `\n  </required_sections>`;
    }
    if (ir.output.styleNotes && ir.output.styleNotes.length > 0) {
      outStr += `\n  <guidelines>\n` + ir.output.styleNotes.map((n) => `    <rule>${n}</rule>`).join("\n") + `\n  </guidelines>`;
    }
    if (ir.output.schema) {
      const schemaStr = typeof ir.output.schema === "string" ? ir.output.schema : JSON.stringify(ir.output.schema, null, 2);
      outStr += `\n  <json_schema>\n${schemaStr}\n  </json_schema>`;
    }
    outStr += `\n</output_contract>`;
    parts.push(outStr);
  }

  // Reasoning Requirements
  if (ir.reasoningConfig?.mandateStepByStep || ir.reasoningConfig?.effort) {
    let reasonStr = `<reasoning_requirement>\n  Before returning the final output, perform a step-by-step reasoning analysis inside a <thought> block.`;
    if (ir.reasoningConfig.effort) {
      reasonStr += ` Set effort level to: ${ir.reasoningConfig.effort}.`;
    }
    reasonStr += `\n</reasoning_requirement>`;
    parts.push(reasonStr);
  }

  return parts.join("\n\n");
}

import { autocorrectText } from "./autocorrect";

export function parseTextToPromptIR(rawText: string): PromptIR {
  const ir = createEmptyPromptIR(rawText);
  if (!rawText || !rawText.trim()) return ir;

  const normalized = autocorrectText(rawText).correctedText;
  const text = normalized.trim();
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
