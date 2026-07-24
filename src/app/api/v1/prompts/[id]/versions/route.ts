import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db/prisma";

const createVersionSchema = z.object({
  text: z.string().min(1, "text is required"),
  score: z.record(z.string(), z.unknown()).optional(),
  changes: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: promptId } = await params;
  const userId = session.user.id;

  const prompt = await getDb().prompt.findFirst({
    where: { id: promptId, userId },
  });

  if (!prompt) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  const versions = await getDb().version.findMany({
    where: { promptId },
    orderBy: { version: "desc" },
  });

  return NextResponse.json({ data: versions });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: promptId } = await params;
  const userId = session.user.id;

  const prompt = await getDb().prompt.findFirst({
    where: { id: promptId, userId },
  });

  if (!prompt) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = createVersionSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { text, score, changes } = parseResult.data;

  const latestVersion = await getDb().version.findFirst({
    where: { promptId },
    orderBy: { version: "desc" },
  });

  const nextVersionNum = (latestVersion?.version || 0) + 1;

  const versionObj = await getDb().version.create({
    data: {
      promptId,
      version: nextVersionNum,
      text,
      score: score ? JSON.parse(JSON.stringify(score)) : undefined,
      changes: changes ? JSON.parse(JSON.stringify(changes)) : undefined,
    },
  });

  return NextResponse.json({ data: versionObj }, { status: 201 });
}
