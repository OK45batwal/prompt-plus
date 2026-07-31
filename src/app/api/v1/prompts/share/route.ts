import { NextRequest } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/db/prisma";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";
import { z } from "zod";

const sharePromptSchema = z.object({
  promptId: z.string().min(1, "promptId is required"),
});

export const POST = withAuth(
  async (request: NextRequest, { userId, requestId, body }) => {
    const { promptId } = body || {};
    if (!promptId) {
      return jsonResponse({ error: "promptId is required" }, { status: 400, requestId });
    }

    const prompt = await getDb().prompt.findFirst({
      where: { id: promptId, userId },
    });

    if (!prompt) {
      return jsonResponse({ error: "Prompt not found" }, { status: 404, requestId });
    }

    const sharedToken = prompt.sharedToken || `sh_${crypto.randomBytes(16).toString("hex")}`;

    const updatedPrompt = await getDb().prompt.update({
      where: { id: promptId },
      data: { sharedToken },
    });

    const origin = request.headers.get("origin") || request.nextUrl.origin;
    const shareUrl = `${origin}/share/${updatedPrompt.sharedToken}`;

    return jsonResponse(
      {
        data: {
          promptId: updatedPrompt.id,
          sharedToken: updatedPrompt.sharedToken,
          shareUrl,
        },
      },
      { requestId }
    );
  },
  { schema: sharePromptSchema }
);

export const DELETE = withAuth(
  async (request: NextRequest, { userId, requestId }) => {
    const { searchParams } = new URL(request.url);
    const promptId = searchParams.get("promptId");

    if (!promptId) {
      return jsonResponse({ error: "promptId is required" }, { status: 400, requestId });
    }

    const prompt = await getDb().prompt.findFirst({
      where: { id: promptId, userId },
    });

    if (!prompt) {
      return jsonResponse({ error: "Prompt not found" }, { status: 404, requestId });
    }

    await getDb().prompt.update({
      where: { id: promptId },
      data: { sharedToken: null },
    });

    return jsonResponse({ data: { success: true } }, { requestId });
  }
);
