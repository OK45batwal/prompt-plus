import { NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/prisma";
import { encrypt } from "@/lib/crypto";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";

const createApiKeySchema = z.object({
  provider: z.enum(["openai", "anthropic", "google", "openrouter"]),
  apiKey: z.string().min(5, "API key must be at least 5 characters"),
});

export const GET = withAuth(async (_req: NextRequest, { userId, requestId }) => {
  const keys = await getDb().apiKey.findMany({
    where: { userId },
    select: {
      id: true,
      provider: true,
      isActive: true,
      lastUsedAt: true,
      usageCount: true,
      createdAt: true,
    },
  });

  return jsonResponse({ data: keys }, { requestId });
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

    return jsonResponse({ data: newKey }, { status: 201, requestId });
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
