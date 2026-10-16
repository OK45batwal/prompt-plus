import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";
import { z } from "zod";

const testKeySchema = z.object({
  provider: z.enum(["openai", "anthropic", "google", "openrouter", "nvidia"]),
  apiKey: z.string().min(1, "API Key is required"),
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
  async (_req, { requestId, body }) => {
    const { provider, apiKey } = body!;
    const { url, headers } = PROBES[provider](apiKey);

    let res: Response;
    try {
      res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    } catch {
      return jsonResponse(
        { error: `Could not reach ${provider}. Check your connection and try again.` },
        { status: 502, requestId }
      );
    }

    if (!res.ok) {
      const reason =
        res.status === 401 || res.status === 403
          ? `${provider.toUpperCase()} rejected this key.`
          : `${provider.toUpperCase()} returned HTTP ${res.status}.`;
      return jsonResponse({ error: reason, success: false }, { status: 400, requestId });
    }

    return jsonResponse(
      {
        success: true,
        data: {
          provider,
          status: "connected",
          message: `${provider.toUpperCase()} accepted this key.`,
        },
      },
      { requestId }
    );
  },
  { schema: testKeySchema }
);
