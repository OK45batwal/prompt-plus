/**
 * Shared model definitions used across the Prompt Builder, Settings, and other pages.
 * Single source of truth for available AI models in the Prompt+ UI.
 */

export type ModelProvider = "openrouter" | "openai" | "anthropic" | "nvidia";

export interface ModelDefinition {
  id: string;
  name: string;
  icon: string;
  free: boolean;
  provider: ModelProvider;
  rawModel: string;
  contextWindow?: number;
  description?: string;
}

export const MODELS: ModelDefinition[] = [
  // ─── Free (OpenRouter) ──────────────────────────────────────────────────
  { id: "openrouter-gemini-flash-free", name: "Gemini 2.0 Flash", icon: "⚡", free: true, provider: "openrouter", rawModel: "google/gemini-2.0-flash-exp:free", contextWindow: 1_000_000, description: "Fastest Google multimodal model" },
  { id: "openrouter-gemini-pro-free", name: "Gemini 2.0 Pro", icon: "✨", free: true, provider: "openrouter", rawModel: "google/gemini-2.0-pro-exp-02-05:free", contextWindow: 2_000_000, description: "Deep reasoning & coding" },
  { id: "openrouter-deepseek-r1-free", name: "DeepSeek R1", icon: "🧠", free: true, provider: "openrouter", rawModel: "deepseek/deepseek-r1:free", contextWindow: 64_000, description: "Open-source reasoning champion" },
  { id: "openrouter-deepseek-v3-free", name: "DeepSeek V3", icon: "💡", free: true, provider: "openrouter", rawModel: "deepseek/deepseek-chat:free", contextWindow: 64_000, description: "General conversation & coding" },
  { id: "openrouter-llama33-70b-free", name: "Llama 3.3 70B", icon: "🦙", free: true, provider: "openrouter", rawModel: "meta-llama/llama-3.3-70b-instruct:free", contextWindow: 128_000, description: "State-of-the-art open weights" },
  { id: "openrouter-llama31-free", name: "Llama 3.1 8B", icon: "🦙", free: true, provider: "openrouter", rawModel: "meta-llama/llama-3.1-8b-instruct:free", contextWindow: 128_000, description: "Ultra-compact fast model" },
  { id: "openrouter-qwen-coder-free", name: "Qwen 2.5 Coder 32B", icon: "💻", free: true, provider: "openrouter", rawModel: "qwen/qwen-2.5-coder-32b-instruct:free", contextWindow: 32_768, description: "Best-in-class coding specialist" },
  { id: "openrouter-mistral-small-free", name: "Mistral Small 24B", icon: "🌊", free: true, provider: "openrouter", rawModel: "mistralai/mistral-small-3.1-24b-instruct:free", contextWindow: 96_000, description: "Concise & precise European model" },
  { id: "openrouter-phi35-mini-free", name: "Phi-3.5 Mini", icon: "🔬", free: true, provider: "openrouter", rawModel: "microsoft/phi-3.5-mini-128k-instruct:free", contextWindow: 128_000, description: "Microsoft lightweight reasoning" },

  // ─── Free (NVIDIA NIM) ──────────────────────────────────────────────────
  { id: "nvidia-llama33-70b", name: "Llama 3.3 70B NIM", icon: "🟢", free: true, provider: "nvidia", rawModel: "meta/llama-3.3-70b-instruct", contextWindow: 128_000, description: "NVIDIA accelerated Llama 3.3" },
  { id: "nvidia-llama31-405b", name: "Llama 3.1 405B Ultra", icon: "🏔️", free: true, provider: "nvidia", rawModel: "meta/llama-3.1-405b-instruct", contextWindow: 128_000, description: "Largest open foundation model" },
  { id: "nvidia-nemotron-70b", name: "Nemotron 70B Super", icon: "⚡", free: true, provider: "nvidia", rawModel: "nvidia/llama-3.1-nemotron-70b-instruct", contextWindow: 128_000, description: "NVIDIA RLHF tuned powerhouse" },
  { id: "nvidia-nemotron-340b", name: "Nemotron 4 340B", icon: "🚀", free: true, provider: "nvidia", rawModel: "nvidia/nemotron-4-340b-instruct", contextWindow: 128_000, description: "Synthetic data & reasoning" },
  { id: "nvidia-gemma2-27b", name: "Gemma 2 27B NIM", icon: "🔷", free: true, provider: "nvidia", rawModel: "google/gemma-2-27b-it", contextWindow: 8_192, description: "Google architecture on TensorRT" },
  { id: "nvidia-gemma2-9b", name: "Gemma 2 9B NIM", icon: "🔹", free: true, provider: "nvidia", rawModel: "google/gemma-2-9b-it", contextWindow: 8_192, description: "Fast responsive Gemma" },
  { id: "nvidia-mistral-large", name: "Mistral Large 2 NIM", icon: "🌪️", free: true, provider: "nvidia", rawModel: "mistralai/mistral-large-2-instruct", contextWindow: 128_000, description: "Top-tier multilingual & code" },
  { id: "nvidia-mixtral-8x22b", name: "Mixtral 8x22B MoE", icon: "🧩", free: true, provider: "nvidia", rawModel: "mistralai/mixtral-8x22b-instruct-v0.1", contextWindow: 64_000, description: "Sparse mixture of experts" },

  // ─── Paid / Custom Key (OpenAI) ─────────────────────────────────────────
  { id: "openai-gpt4o", name: "GPT-4o", icon: "🤖", free: false, provider: "openai", rawModel: "gpt-4o", contextWindow: 128_000, description: "Flagship omni model" },
  { id: "openai-gpt4o-mini", name: "GPT-4o Mini", icon: "⚡", free: false, provider: "openai", rawModel: "gpt-4o-mini", contextWindow: 128_000, description: "Fast & affordable" },
  { id: "openai-o3-mini", name: "o3-Mini (Reasoning)", icon: "🧠", free: false, provider: "openai", rawModel: "o3-mini", contextWindow: 200_000, description: "Advanced STEM & logic reasoning" },

  // ─── Paid / Custom Key (Anthropic) ──────────────────────────────────────
  { id: "anthropic-claude-35-sonnet", name: "Claude 3.5 Sonnet", icon: "🎭", free: false, provider: "anthropic", rawModel: "claude-3-5-sonnet-20241022", contextWindow: 200_000, description: "Benchmark leader in prompt writing" },
  { id: "anthropic-claude-35-haiku", name: "Claude 3.5 Haiku", icon: "🕊️", free: false, provider: "anthropic", rawModel: "claude-3-5-haiku-20241022", contextWindow: 200_000, description: "Sub-second lightning responses" },
  { id: "anthropic-claude-3-opus", name: "Claude 3 Opus", icon: "👑", free: false, provider: "anthropic", rawModel: "claude-3-opus-20240229", contextWindow: 200_000, description: "Deep nuanced long-form writing" },
];

export const DEFAULT_MODEL_ID = "openrouter-gemini-flash-free";

export function getModelById(id: string): ModelDefinition | undefined {
  return MODELS.find((m) => m.id === id);
}

export function getFreeModels(): ModelDefinition[] {
  return MODELS.filter((m) => m.free);
}

/** Format for Settings select dropdown */
export function getModelDisplayLabel(m: ModelDefinition): string {
  const providerLabel =
    m.provider === "openrouter" ? "OpenRouter" :
    m.provider === "openai" ? "OpenAI" :
    m.provider === "anthropic" ? "Anthropic" :
    "NVIDIA";
  return `${m.name} (${providerLabel}${m.free ? " · Free" : ""})`;
}

