import { NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/prisma";
import { encrypt, decrypt } from "@/lib/crypto";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";

export function createKeyHint(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= 8) {
    return `••••${trimmed.slice(-3)}`;
  }
  let prefix = "";
  if (trimmed.startsWith("sk-proj-")) {
    prefix = "sk-proj-";
  } else if (trimmed.startsWith("sk-ant-")) {
    prefix = "sk-ant-";
  } else if (trimmed.startsWith("sk-")) {
    prefix = "sk-";
  } else if (trimmed.startsWith("AIza")) {
    prefix = "AIza";
  } else if (trimmed.startsWith("nvapi-")) {
    prefix = "nvapi-";
  } else {
    prefix = trimmed.slice(0, 3);
  }
  const suffix = trimmed.slice(-4);
  return `${prefix}••••••••${suffix}`;
}

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
      isActive: true,
      lastUsedAt: true,
      usageCount: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = keys.map((k) => {
    let keyHint = "••••••••";
    try {
      const decrypted = decrypt(k.apiKeyEnc);
      keyHint = createKeyHint(decrypted);
    } catch {
      // Fallback preview
    }
    return {
      id: k.id,
      provider: k.provider,
      keyHint,
      isActive: k.isActive,
      lastUsedAt: k.lastUsedAt,
      usageCount: k.usageCount,
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
    const keyHint = createKeyHint(apiKey);

    await getDb().apiKey.deleteMany({
      where: { userId, provider },
    }).catch(() => {});

    const newKey = await getDb().apiKey.create({
      data: {
        userId,
        provider,
        apiKeyEnc,
        isActive: true,
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

