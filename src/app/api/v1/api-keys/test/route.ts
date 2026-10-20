import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";
import { getDb } from "@/lib/db/prisma";
import { decrypt } from "@/lib/crypto";
import { providerLabel } from "@/lib/models";
import { z } from "zod";

const testKeySchema = z.object({
  provider: z.enum(["openai", "anthropic", "google", "openrouter", "nvidia"]),
  /** Optional: test a key before saving it. Without it, the stored key is tested. */
  apiKey: z.string().min(1).optional(),
});

type Provider = z.infer<typeof testKeySchema>["provider"];

/**
 * Cheap authenticated GETs that prove a credential works without spending tokens.
 * This endpoint used to only check the key's prefix and then report a success
 * message, which was not a validation at all.
 */
const PROBES: Record<Provider, (key: string) => { url: string; headers: Record<string, string> }> = {
  openai: (key) => ({
    url: "https://api.openai.com/v1/models",
    headers: { Authorization: `Bearer ${key}` },
  }),
  anthropic: (key) => ({
    url: "https://api.anthropic.com/v1/models",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
  }),
  openrouter: (key) => ({
    url: "https://openrouter.ai/api/v1/auth/key",
    headers: { Authorization: `Bearer ${key}` },
  }),
  nvidia: (key) => ({
    url: "https://integrate.api.nvidia.com/v1/models",
    headers: { Authorization: `Bearer ${key}` },
  }),
  google: (key) => ({
    url: `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
    headers: {},
  }),
};

export const POST = withAuth(
  async (_req, { requestId, userId, body }) => {
    const { provider, apiKey: submittedKey } = body!;

    let apiKey = submittedKey?.trim() || "";
    if (!apiKey) {
      const stored = await getDb().apiKey.findFirst({
        where: { userId, provider, isActive: true },
        select: { apiKeyEnc: true },
      });
      if (!stored) {
        return jsonResponse(
          { error: `No saved ${providerLabel(provider)} key to test.`, code: "missing_key" },
          { status: 400, requestId }
        );
      }
      try {
        apiKey = decrypt(stored.apiKeyEnc);
      } catch {
        await recordValidation(userId, provider, "rejected");
        return jsonResponse(
          { error: `The saved ${providerLabel(provider)} key could not be decrypted. Replace it.`, code: "key_decrypt_failed", success: false },
          { status: 400, requestId }
        );
      }
    }

    const { url, headers } = PROBES[provider](apiKey);

    let res: Response;
    try {
      res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    } catch {
      await recordValidation(userId, provider, submittedKey ? undefined : "unreachable");
      return jsonResponse(
        { error: `Could not reach ${providerLabel(provider)}. Check your connection and try again.`, success: false },
        { status: 502, requestId }
      );
    }

    if (!res.ok) {
      const reason =
        res.status === 401 || res.status === 403
          ? `${providerLabel(provider)} rejected this key.`
          : `${providerLabel(provider)} returned HTTP ${res.status}.`;
      if (!submittedKey) await recordValidation(userId, provider, "rejected");
      return jsonResponse({ error: reason, success: false }, { status: 400, requestId });
    }

    const status = submittedKey ? undefined : "accepted";
    if (status) await recordValidation(userId, provider, status);

    return jsonResponse(
      {
        success: true,
        data: {
          provider,
          status: "connected",
          message: `${providerLabel(provider)} accepted this key.`,
        },
      },
      { requestId }
    );
  },
  { schema: testKeySchema }
);

async function recordValidation(
  userId: string,
  provider: Provider,
  status: "accepted" | "rejected" | "unreachable" | undefined
) {
  if (!status) return;
  const data =
    status === "unreachable"
      ? { lastValidationStatus: status }
      : { lastValidationStatus: status, lastValidatedAt: new Date() };
  await getDb().apiKey
    .updateMany({ where: { userId, provider }, data })
    .catch(() => {});
}
