import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  let body: { promptId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { promptId } = body;
  if (!promptId) {
    return NextResponse.json({ error: "promptId is required" }, { status: 400 });
  }

  // Ensure prompt belongs to authenticated user
  const prompt = await db.prompt.findFirst({
    where: { id: promptId, userId },
  });

  if (!prompt) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  // Reuse existing shared token or generate new one
  const sharedToken = prompt.sharedToken || `sh_${crypto.randomBytes(16).toString("hex")}`;

  const updatedPrompt = await db.prompt.update({
    where: { id: promptId },
    data: { sharedToken },
  });

  const origin = request.headers.get("origin") || request.nextUrl.origin;
  const shareUrl = `${origin}/share/${updatedPrompt.sharedToken}`;

  return NextResponse.json({
    data: {
      promptId: updatedPrompt.id,
      sharedToken: updatedPrompt.sharedToken,
      shareUrl,
    },
  });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const promptId = searchParams.get("promptId");

  if (!promptId) {
    return NextResponse.json({ error: "promptId is required" }, { status: 400 });
  }

  const prompt = await db.prompt.findFirst({
    where: { id: promptId, userId },
  });

  if (!prompt) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  await db.prompt.update({
    where: { id: promptId },
    data: { sharedToken: null },
  });

  return NextResponse.json({ data: { success: true } });
}
