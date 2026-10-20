/**
 * Shared model catalog: single source of truth for the Studio selector, Settings,
 * comparison, server validation, and provider routing.
 *
 * Access is about the provider's terms, not the signed-in user's key: whether a model
 * costs money is separate from whether this account has a working credential.
 */

import catalog from "./models.json";

export type ModelProvider = "openrouter" | "openai" | "anthropic" | "nvidia" | "google";

/** How the provider charges for this model. */
export type ModelAccess = "free" | "free_tier_available" | "paid" | "unknown";
export type ModelAvailability = "active" | "unavailable" | "deprecated";

export interface ModelPrice {
  inputPer1M: number | null;
  outputPer1M: number | null;
  currency: "USD";
  sourceUrl: string;
  /** ISO date the price/availability was checked. null means unverified. */
  verifiedAt: string | null;
  note?: string;
}

export interface ModelDefinition {
  id: string;
  name: string;
  icon: string;
  provider: ModelProvider;
  /** Exact API model id sent to the provider. */
  rawModel: string;
  access: ModelAccess;
  availability: ModelAvailability;
  capabilities: { text: boolean; json: boolean };
  contextWindow?: number;
  maxOutputTokens?: number;
  pricing: ModelPrice;
  description?: string;
}

// Data lives in models.json so the catalog-refresh script can read and update it
// without parsing TypeScript. Types and derivations stay here.
export const MODELS: ModelDefinition[] = catalog as ModelDefinition[];

export const DEFAULT_MODEL_ID = "openrouter-nemotron-free";

/** Retired or renamed ids that may still be stored in user preferences. */
export const MODEL_ALIASES: Record<string, string> = {
  "google-gemini-pro": "google-gemini-38-flash",
  "openrouter-nemotron": "openrouter-nemotron-free",
};

export function getModelById(id: string | undefined | null): ModelDefinition | undefined {
  if (!id) return undefined;
  return MODELS.find((m) => m.id === id) || getModelById(MODEL_ALIASES[id]);
}

/** Resolve a stored preference or a request model reference to a current catalog entry. */
export function resolveModelReference(idOrRawModel: string | undefined | null): ModelDefinition | undefined {
  if (!idOrRawModel) return undefined;
  return getModelById(idOrRawModel) || MODELS.find((m) => m.rawModel === idOrRawModel);
}

const PROVIDER_LABELS: Record<ModelProvider, string> = {
  openrouter: "OpenRouter",
  openai: "OpenAI",
  anthropic: "Anthropic",
  nvidia: "NVIDIA",
  google: "Google Gemini",
};

export function providerLabel(provider: ModelProvider): string {
  return PROVIDER_LABELS[provider] ?? provider;
}

export function accessLabel(model: Pick<ModelDefinition, "access" | "pricing">): string {
  switch (model.access) {
    case "free":
      return "Free model";
    case "free_tier_available":
      return "Free tier available";
    case "paid":
      return model.pricing.verifiedAt ? "Paid" : "Paid · price unverified";
    default:
      return "Pricing unverified";
  }
}

/** Whether running this model can bill the connected provider account. */
export function canIncurProviderCharges(model: Pick<ModelDefinition, "access">): boolean {
  return model.access === "paid" || model.access === "unknown";
}

/** Format for Settings select dropdown */
export function getModelDisplayLabel(m: ModelDefinition): string {
  return `${m.name} (${providerLabel(m.provider)} · ${accessLabel(m)})`;
}
