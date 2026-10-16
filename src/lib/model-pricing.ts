import type { ModelPricing } from "./token-calculator";

// Historical entries: verifiedAt intentionally absent until checked against the provider.
export const MODEL_PRICING: ModelPricing[] = [
  { id: "openrouter-free", name: "OpenRouter Free Models", provider: "OpenRouter", sourceUrl: "https://openrouter.ai/models", inputCostPer1M: 0.00, outputCostPer1M: 0.00 },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", sourceUrl: "https://openai.com/api/pricing/", inputCostPer1M: 0.15, outputCostPer1M: 0.60 },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", sourceUrl: "https://openai.com/api/pricing/", inputCostPer1M: 2.50, outputCostPer1M: 10.00 },
  { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic", sourceUrl: "https://platform.claude.com/docs/en/about-claude/pricing", inputCostPer1M: 3.00, outputCostPer1M: 15.00 },
  { id: "gemini-1-5-pro", name: "Gemini 1.5 Pro", provider: "Google", sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing", inputCostPer1M: 1.25, outputCostPer1M: 5.00 },
  { id: "nvidia-free", name: "NVIDIA Free Models", provider: "NVIDIA", sourceUrl: "https://build.nvidia.com/", inputCostPer1M: 0.00, outputCostPer1M: 0.00 },
];
