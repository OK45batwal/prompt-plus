import type { ModelPricing } from "./token-calculator";
import { MODELS, providerLabel } from "./models";

/**
 * Cost table derived from the model catalog so a price can never exist in two places.
 * Models whose price has not been verified are omitted: the calculator never guesses.
 */
export const MODEL_PRICING: ModelPricing[] = MODELS.filter(
  (model) => model.pricing.inputPer1M !== null && model.pricing.outputPer1M !== null
).map((model) => ({
  id: model.id,
  name: model.name,
  provider: providerLabel(model.provider),
  inputCostPer1M: model.pricing.inputPer1M as number,
  outputCostPer1M: model.pricing.outputPer1M as number,
  verifiedAt: model.pricing.verifiedAt ?? undefined,
  sourceUrl: model.pricing.sourceUrl,
}));
