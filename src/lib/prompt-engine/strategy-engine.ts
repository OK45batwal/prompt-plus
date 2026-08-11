import { PromptIR, TaskType, StrategyId } from "./types";
import { addConstraint, setOutputContract, updateReasoning } from "./prompt-ir";

export interface Strategy {
  id: StrategyId;
  name: string;
  description: string;
  applicableTasks: TaskType[];
  prerequisites: string[];
  risks: string[];
  estimatedTokenCost: number;
  apply(input: PromptIR): PromptIR;
}

export const StrategyRegistry: Record<StrategyId, Strategy> = {
  clarification: {
    id: "clarification",
    name: "Ambiguity Reduction & Intent Clarification",
    description: "Expands implicit requirements and removes ambiguous phrasing from objective.",
    applicableTasks: ["general", "writing", "rewriting", "summarization"],
    prerequisites: [],
    risks: ["May add slight verbosity"],
    estimatedTokenCost: 40,
    apply(input: PromptIR): PromptIR {
      if (input.objective && !input.objective.includes("Clear, specific objective:")) {
        return {
          ...input,
          objective: `Clear, specific objective: ${input.objective}`,
        };
      }
      return input;
    },
  },

  structure: {
    id: "structure",
    name: "Domain Persona & Section Structuring",
    description: "Organizes the prompt into modular, domain-tailored sections with an expert persona.",
    applicableTasks: ["coding", "research", "writing", "business", "data_analysis", "planning"],
    prerequisites: [],
    risks: [],
    estimatedTokenCost: 100,
    apply(input: PromptIR): PromptIR {
      let role = input.role;
      if (!role) {
        role = "Senior Technical Expert & AI Systems Architect";
      }
      return {
        ...input,
        role,
      };
    },
  },

  constraints: {
    id: "constraints",
    name: "Explicit Output Constraints & Guardrails",
    description: "Adds strict negative constraints, formatting rules, and operational boundaries.",
    applicableTasks: ["coding", "research", "writing", "marketing", "data_analysis"],
    prerequisites: [],
    risks: [],
    estimatedTokenCost: 60,
    apply(input: PromptIR): PromptIR {
      let updated = addConstraint(input, "ZERO ANNOUNCEMENT FILLER: Do not include introductory conversational intros ('Here is your answer') or outros.", "critical", "system");
      updated = addConstraint(updated, "Maintain strict adherence to technical accuracy and specified formatting.", "high", "system");
      return updated;
    },
  },

  output_contract: {
    id: "output_contract",
    name: "Structured Output Contract",
    description: "Defines explicit deliverables, section headers, and output schema.",
    applicableTasks: ["coding", "research", "business", "data_analysis", "planning"],
    prerequisites: [],
    risks: [],
    estimatedTokenCost: 80,
    apply(input: PromptIR): PromptIR {
      return setOutputContract(input, {
        format: input.output?.format || "markdown",
        styleNotes: [
          "Use clear markdown headings (###) for distinct sub-sections.",
          "Present code deliverables in complete, production-ready blocks without truncated placeholders.",
        ],
      });
    },
  },

  few_shot: {
    id: "few_shot",
    name: "Minimal Representative Few-Shot Example",
    description: "Injects clean input/output example to guide model formatting.",
    applicableTasks: ["coding", "prompt_engineering", "data_analysis", "automation"],
    prerequisites: [],
    risks: ["Consumes tokens"],
    estimatedTokenCost: 150,
    apply(input: PromptIR): PromptIR {
      if (input.examples.length === 0) {
        return {
          ...input,
          examples: [
            {
              input: "Analyze user churn for Q3.",
              output: "### Executive Summary\n- Total Churn: 4.2%\n\n### Primary Root Causes\n1. Onboarding friction in step 2.",
              explanation: "Demonstrates required structured summary format.",
            },
          ],
        };
      }
      return input;
    },
  },

  decomposition: {
    id: "decomposition",
    name: "Task Decomposition & Step-by-Step Execution",
    description: "Breaks complex goals into sequential execution steps.",
    applicableTasks: ["coding", "research", "planning", "business", "data_analysis"],
    prerequisites: [],
    risks: [],
    estimatedTokenCost: 70,
    apply(input: PromptIR): PromptIR {
      return updateReasoning(input, { mandateStepByStep: true, effort: "medium" });
    },
  },

  verification: {
    id: "verification",
    name: "Self-Verification & Factuality Check",
    description: "Mandates that the executing AI verifies output correctness before responding.",
    applicableTasks: ["coding", "research", "data_analysis"],
    prerequisites: [],
    risks: [],
    estimatedTokenCost: 50,
    apply(input: PromptIR): PromptIR {
      return addConstraint(input, "VERIFICATION STEP: Review final output for logical flaws, missing requirements, or edge-case failures prior to returning.", "high", "system");
    },
  },

  context_compression: {
    id: "context_compression",
    name: "Context Relevance Compression",
    description: "Prunes low-relevance context items to save tokens and avoid dilution.",
    applicableTasks: ["coding", "research", "writing"],
    prerequisites: [],
    risks: [],
    estimatedTokenCost: -50,
    apply(input: PromptIR): PromptIR {
      if (input.context.length > 3) {
        const sorted = [...input.context].sort((a, b) => b.relevanceScore - a.relevanceScore);
        return { ...input, context: sorted.slice(0, 3) };
      }
      return input;
    },
  },

  schema_enforcement: {
    id: "schema_enforcement",
    name: "JSON Schema Enforcement",
    description: "Enforces strict JSON schema validation contract.",
    applicableTasks: ["coding", "automation", "data_analysis"],
    prerequisites: [],
    risks: [],
    estimatedTokenCost: 60,
    apply(input: PromptIR): PromptIR {
      return setOutputContract(input, {
        format: "json",
        schema: {
          type: "object",
          properties: {
            status: { type: "string" },
            data: { type: "object" },
          },
          required: ["status", "data"],
        },
      });
    },
  },

  model_specific: {
    id: "model_specific",
    name: "Model-Specific Optimization",
    description: "Applies native reasoning & verbosity controls for GPT-5/o3-mini/Claude.",
    applicableTasks: ["coding", "research", "analysis", "prompt_engineering"],
    prerequisites: [],
    risks: [],
    estimatedTokenCost: 30,
    apply(input: PromptIR): PromptIR {
      return updateReasoning(input, { effort: "high", mandateStepByStep: true });
    },
  },

  ambiguity_reduction: {
    id: "ambiguity_reduction",
    name: "Ambiguity Elimination",
    description: "Tightens vague terminology into precise operational targets.",
    applicableTasks: ["general", "writing", "marketing"],
    prerequisites: [],
    risks: [],
    estimatedTokenCost: 40,
    apply(input: PromptIR): PromptIR {
      return addConstraint(input, "Provide concrete, specific examples rather than abstract generalizations.", "medium", "system");
    },
  },
};

export function selectStrategiesForTask(taskType: TaskType, complexity: "low" | "medium" | "high" | "expert"): StrategyId[] {
  if (complexity === "low") {
    return ["clarification", "constraints"];
  }

  if (taskType === "coding") {
    return ["structure", "constraints", "output_contract", "decomposition", "verification"];
  }

  if (taskType === "research") {
    return ["structure", "constraints", "output_contract", "decomposition", "verification"];
  }

  if (taskType === "data_analysis") {
    return ["structure", "constraints", "schema_enforcement", "verification"];
  }

  if (taskType === "writing" || taskType === "marketing") {
    return ["structure", "constraints", "ambiguity_reduction"];
  }

  return ["clarification", "structure", "constraints", "output_contract"];
}
