import { getDb } from "@/lib/db/prisma";
import { decrypt } from "@/lib/crypto";
import {
  canIncurProviderCharges,
  getModelById,
  providerLabel,
  resolveModelReference,
  type ModelDefinition,
} from "@/lib/models";

/**
 * Single place where a request turns into (provider, key, model). Every cloud call goes
 * through here so the provider can never disagree with the key, and so no paid run can
 * start without an explicit choice from the user.
 *
 * Website requests only ever use the signed-in user's key. Operator keys stay reserved
 * for the public extension demo; there is no silent fallback between them.
 */

export type CredentialFailureCode =
  | "model_not_found"
  | "model_unavailable"
  | "missing_key"
  | "key_decrypt_failed"
  | "paid_consent_required"
  | "credentials_unavailable";

export interface CredentialFailure {
  ok: false;
  status: number;
  code: CredentialFailureCode;
  message: string;
  provider?: string;
}

export interface ResolvedCredentials {
  ok: true;
  model: ModelDefinition;
  provider: ModelDefinition["provider"];
  apiKey: string;
  source: "user";
}

function settingsPath(provider: string): string {
  return `/dashboard/settings?tab=api-keys&provider=${encodeURIComponent(provider)}`;
}

export async function resolveModelCredentials(input: {
  userId: string;
  modelId: string;
  paidConsent?: boolean;
}): Promise<ResolvedCredentials | CredentialFailure> {
  const model = resolveModelReference(input.modelId);
  if (!model) {
    return {
      ok: false,
      status: 400,
      code: "model_not_found",
      message: `Unknown model "${input.modelId}". Pick a model from the catalog.`,
    };
  }

  if (model.availability !== "active") {
    return {
      ok: false,
      status: 409,
      code: "model_unavailable",
      message: `${model.name} is ${model.availability}. Pick another model.`,
      provider: model.provider,
    };
  }

  if (canIncurProviderCharges(model) && input.paidConsent !== true) {
    return {
      ok: false,
      status: 402,
      code: "paid_consent_required",
      message: `${model.name} can bill your ${providerLabel(model.provider)} account. Confirm the paid run first.`,
      provider: model.provider,
    };
  }

  let stored: { apiKeyEnc: string } | null = null;
  try {
    stored = await getDb().apiKey.findFirst({
      where: { userId: input.userId, provider: model.provider, isActive: true },
      select: { apiKeyEnc: true },
    });
  } catch {
    return {
      ok: false,
      status: 503,
      code: "credentials_unavailable",
      message: "Your saved credentials are temporarily unavailable. Try again shortly.",
      provider: model.provider,
    };
  }

  if (!stored) {
    return {
      ok: false,
      status: 400,
      code: "missing_key",
      message: `Connect a ${providerLabel(model.provider)} key to run ${model.name}.`,
      provider: model.provider,
    };
  }

  let apiKey: string;
  try {
    apiKey = decrypt(stored.apiKeyEnc);
  } catch {
    return {
      ok: false,
      status: 400,
      code: "key_decrypt_failed",
      message: `Your ${providerLabel(model.provider)} key could not be decrypted. Replace it in Settings → API Keys.`,
      provider: model.provider,
    };
  }

  if (!apiKey.trim()) {
    return {
      ok: false,
      status: 400,
      code: "missing_key",
      message: `Your ${providerLabel(model.provider)} key is empty. Replace it in Settings → API Keys.`,
      provider: model.provider,
    };
  }

  return { ok: true, model, provider: model.provider, apiKey, source: "user" };
}

export function credentialActionPath(failure: CredentialFailure): string | null {
  if (failure.code === "missing_key" || failure.code === "key_decrypt_failed") {
    return settingsPath(failure.provider || "");
  }
  return null;
}

/** Catalog entry for a request, used to label results even when no cloud call runs. */
export function catalogModel(modelId: string | undefined | null): ModelDefinition | undefined {
  return getModelById(modelId);
}
