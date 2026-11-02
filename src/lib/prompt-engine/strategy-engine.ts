import { PromptIR, TaskType, StrategyId, OutputContract } from "./types";
import { addConstraint, setOutputContract, updateReasoning } from "./prompt-ir";
import { PromptSlots, extractSlots } from "./slots";
import { classifyTaskType } from "./intent-engine";
import { selectFewShotExamples } from "./example-synthesizer";

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

const TASK_PERSONAS: Record<TaskType, string> = {
  coding: "software engineer",
  research: "research analyst",
  writing: "editor",
  rewriting: "editor",
  summarization: "analyst",
  analysis: "analyst",
  education: "teacher",
  marketing: "marketing strategist",
  business: "strategy consultant",
  data_analysis: "data analyst",
  planning: "programme planner",
  creative: "writer",
  image_generation: "art director",
  video_generation: "video director",
  automation: "automation engineer",
  prompt_engineering: "prompt engineer",
  general: "subject-matter expert",
};

const ACTION_FOCUS: Record<string, string> = {
  build: "implementation and system design",
  write: "writing and editorial judgement",
  debug: "debugging and failure analysis",
  fix: "diagnosis and repair",
  refactor: "refactoring and code health",
  optimize: "performance analysis and tuning",
  analyze: "analysis and evidence",
  review: "critical review",
  summarize: "summarisation",
  explain: "clear explanation",
  compare: "comparative analysis",
  migrate: "migration and compatibility",
  convert: "data transformation",
  translate: "translation",
  test: "testing and verification",
  document: "technical documentation",
  plan: "planning and sequencing",
  design: "design",
  generate: "generation",
  rewrite: "rewriting and editing",
  research: "research and source evaluation",
  extract: "structured extraction",
  deploy: "deployment and operations",
  measure: "measurement and benchmarking",
};

/**
 * Builds the role from what the request actually says. The old version mapped a
 * keyword category to one frozen string, so every coding request -- a Node
 * memory leak and a React component alike -- got the same persona.
 */
function composePersona(slots: PromptSlots, taskType: TaskType): string {
  const base = TASK_PERSONAS[taskType] || TASK_PERSONAS.general;
  const named = slots.entities.slice(0, 2).join(" and ");
  const focus = slots.action ? ACTION_FOCUS[slots.action] : undefined;
  return ["Senior", named ? `${named} ${base}` : base, focus ? `focused on ${focus}` : ""].filter(Boolean).join(" ");
}

const FORMAT_FOR_SLOT: Record<string, OutputContract["format"]> = {
  json: "json",
  csv: "custom",
  yaml: "custom",
  xml: "custom",
  table: "table",
  bullets: "bullets",
  markdown: "markdown",
  diagram: "custom",
};

export const StrategyRegistry: Record<StrategyId, Strategy> = {
  clarification: {
    id: "clarification",
    name: "Ambiguity Reduction & Intent Clarification",
    description: "Strips conversational prefixes so the objective reads as a directive.",
    applicableTasks: ["general", "writing", "rewriting", "summarization"],
    prerequisites: [],
    risks: ["May add slight verbosity"],
    estimatedTokenCost: 40,
    apply(input: PromptIR): PromptIR {
      if (!input.objective) return input;
      let obj = input.objective.trim();
      // Remove conversational prefix fluff
      obj = obj.replace(/^(?:please\s+|can\s+you\s+|help\s+me\s+|i\s+want\s+to\s+|i\s+need\s+to\s+|how\s+to\s+|kindly\s+)+/i, "");
      if (obj.length > 0) {
        obj = obj.charAt(0).toUpperCase() + obj.slice(1);
      }
      return {
        ...input,
        objective: obj,
      };
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
      if (input.role) return input;
      const objective = input.objective || "";
      return {
        ...input,
        role: composePersona(extractSlots(objective), classifyTaskType(objective)),
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
      const slots = extractSlots(input.objective || "");
      let updated = addConstraint(input, "ZERO ANNOUNCEMENT FILLER: Do not include introductory conversational intros ('Here is your answer') or outros.", "critical", "system");
      if (slots.mentionsCode) {
        updated = addConstraint(updated, "Handle the invalid-input and failure paths, not only the happy path.", "high", "system");
      }
      if (slots.formats.includes("json")) {
        updated = addConstraint(updated, "Return only the JSON object, with no prose around it.", "critical", "system");
      }
      if (slots.modifiers.includes("concise")) {
        updated = addConstraint(updated, "Do not restate the request and do not summarise what you did.", "high", "system");
      }
      if (slots.modifiers.includes("detailed")) {
        updated = addConstraint(updated, "Cover the edge cases you considered and the options you rejected.", "high", "system");
      }
      if (slots.audience) {
        updated = addConstraint(updated, `Write for ${slots.audience}; do not assume knowledge they were not described as having.`, "medium", "system");
      }
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
      const slots = extractSlots(input.objective || "");
      const format = FORMAT_FOR_SLOT[slots.formats[0]] || input.output?.format || "markdown";
      const styleNotes: string[] = [];
      if (slots.mentionsCode) {
        styleNotes.push("Return complete, runnable blocks -- never a placeholder or a truncated body.");
      }
      if (slots.modifiers.includes("concise")) {
        styleNotes.push("Lead with the answer; keep the body as short as the task allows.");
      }
      if (slots.modifiers.includes("detailed")) {
        styleNotes.push("Include the reasoning behind each decision you make.");
      }
      if (slots.modifiers.includes("tested")) {
        styleNotes.push("Show the cases the result is expected to pass.");
      }
      if (slots.entities.length > 0) {
        styleNotes.push(`Ground the answer in ${slots.entities.slice(0, 3).join(", ")}.`);
      }
      return setOutputContract(input, styleNotes.length > 0 ? { format, styleNotes } : { format });
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
      if (input.examples.length > 0) return input;
      // One source of truth for examples; this strategy used to carry a second
      // hardcoded pair that could not be kept in step with the library.
      return {
        ...input,
        examples: selectFewShotExamples(classifyTaskType(input.objective || ""), input.objective || ""),
      };
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
      const slots = extractSlots(input.objective || "");
      const rule = slots.entities.length > 0
        ? `Stay on ${slots.entities.slice(0, 2).join(" and ")}; do not drift into unrelated alternatives.`
        : "Give concrete specifics instead of general claims.";
      return addConstraint(input, rule, "medium", "system");
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
