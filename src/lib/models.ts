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
}

export const MODELS: ModelDefinition[] = [
  // Free (OpenRouter)
  { id: "openrouter-gemini-flash-free", name: "Gemini 2.0 Flash", icon: "⚡", free: true, provider: "openrouter", rawModel: "google/gemini-2.0-flash-exp:free", contextWindow: 1_000_000 },
  { id: "openrouter-deepseek-r1-free", name: "DeepSeek R1", icon: "🧠", free: true, provider: "openrouter", rawModel: "deepseek/deepseek-r1:free", contextWindow: 64_000 },
  { id: "openrouter-llama31-free", name: "Llama 3.1 8B", icon: "🦙", free: true, provider: "openrouter", rawModel: "meta-llama/llama-3.1-8b-instruct:free", contextWindow: 128_000 },
  { id: "openrouter-qwen-coder-free", name: "Qwen 2.5 Coder 32B", icon: "💻", free: true, provider: "openrouter", rawModel: "qwen/qwen-2.5-coder-32b-instruct:free", contextWindow: 32_768 },
  { id: "openrouter-mistral-small-free", name: "Mistral Small", icon: "🌊", free: true, provider: "openrouter", rawModel: "mistralai/mistral-small-3.1-24b-instruct:free", contextWindow: 96_000 },
  // Free (NVIDIA)
  { id: "nvidia-llama3", name: "Llama 3.3 70B", icon: "🦙", free: true, provider: "nvidia", rawModel: "meta/llama-3.3-70b-instruct", contextWindow: 128_000 },
  { id: "nvidia-nemotron", name: "Nemotron 70B", icon: "⚡", free: true, provider: "nvidia", rawModel: "nvidia/llama-3.1-nemotron-70b-instruct", contextWindow: 128_000 },
  { id: "nvidia-gemma2", name: "Gemma 2 27B", icon: "🔷", free: true, provider: "nvidia", rawModel: "google/gemma-2-27b-it", contextWindow: 8_192 },
  // Paid (OpenAI)
  { id: "openai-gpt4o", name: "GPT-4o", icon: "🤖", free: false, provider: "openai", rawModel: "gpt-4o", contextWindow: 128_000 },
  { id: "openai-gpt4o-mini", name: "GPT-4o Mini", icon: "⚡", free: false, provider: "openai", rawModel: "gpt-4o-mini", contextWindow: 128_000 },
  { id: "openai-o3-mini", name: "o3-Mini (Reasoning)", icon: "🧠", free: false, provider: "openai", rawModel: "o3-mini", contextWindow: 200_000 },
  // Paid (Anthropic)
  { id: "anthropic-claude-35-sonnet", name: "Claude 3.5 Sonnet", icon: "🎭", free: false, provider: "anthropic", rawModel: "claude-3-5-sonnet-20241022", contextWindow: 200_000 },
  { id: "anthropic-claude-35-haiku", name: "Claude 3.5 Haiku", icon: "🕊️", free: false, provider: "anthropic", rawModel: "claude-3-5-haiku-20241022", contextWindow: 200_000 },
  { id: "anthropic-claude-3-opus", name: "Claude 3 Opus", icon: "👑", free: false, provider: "anthropic", rawModel: "claude-3-opus-20240229", contextWindow: 200_000 },
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
