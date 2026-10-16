export interface ModelPricing {
  id: string;
  name: string;
  provider: string;
  inputCostPer1M: number; // in USD
  outputCostPer1M: number; // in USD
  verifiedAt?: string;
  sourceUrl?: string;
}

export { MODEL_PRICING } from "./model-pricing";
import { MODEL_PRICING } from "./model-pricing";

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
  estimatedCostUSD: number | null;
  formattedCost: string;
  pricingStatus: "verified" | "unverified";
}

export function calculateCostEstimates(text: string, expectedOutputRatio = 1.5): CostEstimate[] {
  const inputTokens = estimateTokenCount(text);
  const outputTokens = Math.ceil(inputTokens * expectedOutputRatio);

  return MODEL_PRICING.map((model) => {
    const inputCost = (inputTokens / 1_000_000) * model.inputCostPer1M;
    const outputCost = (outputTokens / 1_000_000) * model.outputCostPer1M;
    const totalCost = inputCost + outputCost;

    // Legacy prices remain historical reference data, never a current quote.
    const verifiedAt = model.verifiedAt ? Date.parse(model.verifiedAt) : NaN;
    const verified = Number.isFinite(verifiedAt) && Date.now() >= verifiedAt && Date.now() - verifiedAt < 30 * 86400000;
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
      estimatedCostUSD: verified ? totalCost : null,
      formattedCost: verified ? formattedCost : "Price unverified",
      pricingStatus: verified ? "verified" : "unverified",
    };
  });
}
