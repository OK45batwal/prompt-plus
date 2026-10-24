import { NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/prisma";
import { encrypt, decrypt } from "@/lib/crypto";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";
import { createKeyHint, type KeyValidationStatus } from "@/lib/api-key-hint";

export type { KeyValidationStatus };

const createApiKeySchema = z.object({
  provider: z.enum(["openai", "anthropic", "google", "openrouter", "nvidia"]),
  apiKey: z.string().min(5, "API key must be at least 5 characters"),
});

export const GET = withAuth(async (_req: NextRequest, { userId, requestId }) => {
  const keys = await getDb().apiKey.findMany({
    where: { userId },
    select: {
      id: true,
      provider: true,
      apiKeyEnc: true,
      keyHint: true,
      isActive: true,
      lastUsedAt: true,
      usageCount: true,
      lastValidatedAt: true,
      lastValidationStatus: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = keys.map((k) => {
    let keyHint = k.keyHint || "••••••••";
    if (!k.keyHint) {
      try {
        keyHint = createKeyHint(decrypt(k.apiKeyEnc));
      } catch {
        // Ciphertext from an older key; the hint stays masked.
      }
    }
    return {
      id: k.id,
      provider: k.provider,
      keyHint,
      isActive: k.isActive,
      lastUsedAt: k.lastUsedAt,
      usageCount: k.usageCount,
      lastValidatedAt: k.lastValidatedAt,
      lastValidationStatus: k.lastValidationStatus,
      createdAt: k.createdAt,
    };
  });

  return jsonResponse({ data: formatted }, { requestId });
});

export const POST = withAuth(
  async (req: NextRequest, { userId, requestId }) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, { status: 400, requestId });
    }

    const parseResult = createApiKeySchema.safeParse(body);
    if (!parseResult.success) {
      return jsonResponse(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400, requestId }
      );
    }

    const { provider, apiKey } = parseResult.data;
    const apiKeyEnc = encrypt(apiKey);
    const keyHint = createKeyHint(apiKey.trim());

    // Replace atomically: the unique (user, provider) row means a re-save cannot
    // leave two credentials for one provider behind.
    const newKey = await getDb().apiKey.upsert({
      where: { userId_provider: { userId, provider } },
      create: { userId, provider, apiKeyEnc, keyHint, isActive: true },
      update: {
        apiKeyEnc,
        keyHint,
        isActive: true,
        lastValidatedAt: null,
        lastValidationStatus: null,
      },
      select: {
        id: true,
        provider: true,
        isActive: true,
        createdAt: true,
      },
    });

    return jsonResponse({ data: { ...newKey, keyHint } }, { status: 201, requestId });
  }
);

export const DELETE = withAuth(async (req: NextRequest, { userId, requestId }) => {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider");
  const id = searchParams.get("id");

  if (!provider && !id) {
    return jsonResponse({ error: "provider or id query parameter required" }, { status: 400, requestId });
  }

  await getDb().apiKey.deleteMany({
    where: {
      userId,
      ...(id ? { id } : { provider: provider! }),
    },
  });

  return jsonResponse({ data: { success: true } }, { requestId });
});

