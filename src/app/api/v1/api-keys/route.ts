import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db/prisma";
import { encrypt } from "@/lib/crypto";

const createApiKeySchema = z.object({
  provider: z.enum(["openai", "anthropic", "google", "openrouter"]),
  apiKey: z.string().min(5, "API key must be at least 5 characters"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
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

  return NextResponse.json({ data: keys });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = createApiKeySchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { provider, apiKey } = parseResult.data;
  const apiKeyEnc = encrypt(apiKey);

  // Deactivate existing key for this provider if any
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

  return NextResponse.json({ data: newKey }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");
  const id = searchParams.get("id");

  if (!provider && !id) {
    return NextResponse.json({ error: "provider or id query parameter required" }, { status: 400 });
  }

  await getDb().apiKey.deleteMany({
    where: {
      userId,
      ...(id ? { id } : { provider: provider! }),
    },
  });

  return NextResponse.json({ data: { success: true } });
}
