export interface ModelPricing {
  id: string;
  name: string;
  provider: string;
  inputCostPer1M: number; // in USD
  outputCostPer1M: number; // in USD
}

export const MODEL_PRICING: ModelPricing[] = [
  { id: "openrouter-free", name: "OpenRouter Free Models", provider: "OpenRouter", inputCostPer1M: 0.00, outputCostPer1M: 0.00 },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", inputCostPer1M: 0.15, outputCostPer1M: 0.60 },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", inputCostPer1M: 2.50, outputCostPer1M: 10.00 },
  { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic", inputCostPer1M: 3.00, outputCostPer1M: 15.00 },
  { id: "gemini-1-5-pro", name: "Gemini 1.5 Pro", provider: "Google", inputCostPer1M: 1.25, outputCostPer1M: 5.00 },
];

/**
 * Estimates token count for raw input text using standard ~4 chars per token rule of thumb.
 */
export function estimateTokenCount(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  // Average English word is ~4.5 chars, 1 token is ~4 chars / ~0.75 words
  const trimmed = text.trim();
  const charEstimate = Math.ceil(trimmed.length / 4);
  const wordCount = trimmed.split(/\s+/).length;
  const wordEstimate = Math.ceil(wordCount * 1.33);
  return Math.max(charEstimate, wordEstimate);
}

export interface CostEstimate {
  modelId: string;
  modelName: string;
  provider: string;
  estimatedInputTokens: number;
  estimatedCostUSD: number;
  formattedCost: string;
}

export function calculateCostEstimates(text: string, expectedOutputRatio = 1.5): CostEstimate[] {
  const inputTokens = estimateTokenCount(text);
  const outputTokens = Math.ceil(inputTokens * expectedOutputRatio);

  return MODEL_PRICING.map((model) => {
    const inputCost = (inputTokens / 1_000_000) * model.inputCostPer1M;
    const outputCost = (outputTokens / 1_000_000) * model.outputCostPer1M;
    const totalCost = inputCost + outputCost;

    let formattedCost = "$0.0000";
    if (totalCost === 0 && model.inputCostPer1M === 0) {
      formattedCost = "$0.00 (FREE)";
    } else if (totalCost > 0) {
      formattedCost = totalCost < 0.0001 ? "<$0.0001" : `$${totalCost.toFixed(4)}`;
    }

    return {
      modelId: model.id,
      modelName: model.name,
      provider: model.provider,
      estimatedInputTokens: inputTokens,
      estimatedCostUSD: totalCost,
      formattedCost,
    };
  });
}
