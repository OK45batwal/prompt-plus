import { ModelProfile, TaskType } from "./types";

export const MODEL_REGISTRY: Record<string, ModelProfile> = {
  "gpt-5": {
    provider: "openai",
    model: "gpt-5",
    contextWindow: 128000,
    supportsReasoning: true,
    supportsStructuredOutput: true,
    supportsTools: true,
    reasoningLevels: ["minimal", "low", "medium", "high"],
    verbosityLevels: ["low", "medium", "high"],
    strengths: ["Complex Reasoning", "Architecture", "Multimodal", "Instruction Following"],
    limitations: ["Higher latency on high reasoning effort"],
  },
  "gpt-4o": {
    provider: "openai",
    model: "gpt-4o",
    contextWindow: 128000,
    supportsReasoning: false,
    supportsStructuredOutput: true,
    supportsTools: true,
    strengths: ["Fast execution", "Multimodal", "Structured JSON"],
    limitations: [],
  },
  "claude-3-5-sonnet-20241022": {
    provider: "anthropic",
    model: "claude-3-5-sonnet-20241022",
    contextWindow: 200000,
    supportsReasoning: true,
    supportsStructuredOutput: true,
    supportsTools: true,
    strengths: ["Code generation", "Nuanced writing", "Large context window"],
    limitations: [],
  },
  "nvidia/nemotron-3.5-super-vl:free": {
    provider: "openrouter",
    model: "nvidia/nemotron-3.5-super-vl:free",
    contextWindow: 1000000,
    supportsReasoning: true,
    supportsStructuredOutput: true,
    supportsTools: true,
    strengths: ["Multimodal input", "1M token context"],
    limitations: [],
  },
  "xingchen-agi/xing4.0-29b-a4b:free": {
    provider: "openrouter",
    model: "xingchen-agi/xing4.0-29b-a4b:free",
    contextWindow: 262144,
    supportsReasoning: true,
    supportsStructuredOutput: false,
    supportsTools: false,
    strengths: ["Deep chain-of-thought math & code reasoning", "Free tier"],
    limitations: ["Higher latency"],
  },
  "meta/llama-3.3-70b-instruct": {
    provider: "nvidia",
    model: "meta/llama-3.3-70b-instruct",
    contextWindow: 128000,
    supportsReasoning: false,
    supportsStructuredOutput: true,
    supportsTools: true,
    strengths: ["High-speed open model", "Enterprise reliability"],
    limitations: [],
  },
};

export interface RouteRequestOptions {
  taskType: TaskType;
  complexity: "low" | "medium" | "high" | "expert";
  privacyPreference?: "public" | "private_cloud" | "local_only";
  hasUserApiKey?: boolean;
  targetProvider?: string;
}

export function routeToOptimalModel(options: RouteRequestOptions): {
  recommendedModel: ModelProfile;
  reasoningEffort?: "minimal" | "low" | "medium" | "high";
  verbosity?: "low" | "medium" | "high";
  rationale: string;
} {
  const { taskType, complexity, privacyPreference, hasUserApiKey } = options;

  // Local / Private constraint
  if (privacyPreference === "local_only") {
    return {
      recommendedModel: {
        provider: "google",
        model: "gemini-nano-ondevice",
        contextWindow: 8192,
        supportsReasoning: true,
        supportsStructuredOutput: true,
        supportsTools: false,
        strengths: ["On-device privacy", "Zero network traffic"],
        limitations: ["Local device memory limits"],
      },
      rationale: "Selected Chrome On-Device Gemini Nano for zero-data-leakage privacy.",
    };
  }

  // Complex coding / engineering task
  if (taskType === "coding" && (complexity === "high" || complexity === "expert")) {
    if (hasUserApiKey) {
      return {
        recommendedModel: MODEL_REGISTRY["claude-3-5-sonnet-20241022"],
        rationale: "Selected Claude 3.5 Sonnet for expert code architecture and instruction adherence.",
      };
    }
    return {
      recommendedModel: MODEL_REGISTRY["nvidia/nemotron-3.5-super-vl:free"],
      rationale: "Selected Nemotron 3.5 Super VL for code optimization (OpenRouter key required).",
    };
  }

  // Deep reasoning tasks
  if (taskType === "research" || taskType === "prompt_engineering" || complexity === "expert") {
    return {
      recommendedModel: MODEL_REGISTRY["xingchen-agi/xing4.0-29b-a4b:free"],
      reasoningEffort: "high",
      rationale: "Selected Xing4.0 for deep chain-of-thought reasoning.",
    };
  }

  // Fast / Default tasks
  return {
    recommendedModel: MODEL_REGISTRY["nvidia/nemotron-3.5-super-vl:free"],
    reasoningEffort: "medium",
    verbosity: "medium",
    rationale: "Selected Nemotron 3.5 Super VL for general tasks (OpenRouter key required).",
  };
}
