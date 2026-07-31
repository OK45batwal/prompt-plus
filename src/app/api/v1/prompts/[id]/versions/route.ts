import { NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/prisma";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";

const createVersionSchema = z.object({
  text: z.string().min(1, "text is required"),
  score: z.record(z.string(), z.unknown()).optional(),
  changes: z.record(z.string(), z.unknown()).optional(),
});

export const GET = withAuth(
  async (request: NextRequest, { userId, requestId }) => {
    const pathname = request.nextUrl.pathname;
    const parts = pathname.split("/");
    const versionsIdx = parts.indexOf("versions");
    const promptId = versionsIdx > 0 ? parts[versionsIdx - 1] : "";

    if (!promptId) {
      return jsonResponse({ error: "promptId is required" }, { status: 400, requestId });
    }

    const prompt = await getDb().prompt.findFirst({
      where: { id: promptId, userId },
    });

    if (!prompt) {
      return jsonResponse({ error: "Prompt not found" }, { status: 404, requestId });
    }

    const versions = await getDb().version.findMany({
      where: { promptId },
      orderBy: { version: "desc" },
    });

    return jsonResponse({ data: versions }, { requestId });
  }
);

export const POST = withAuth(
  async (request: NextRequest, { userId, requestId, body }) => {
    const pathname = request.nextUrl.pathname;
    const parts = pathname.split("/");
    const versionsIdx = parts.indexOf("versions");
    const promptId = versionsIdx > 0 ? parts[versionsIdx - 1] : "";

    if (!promptId) {
      return jsonResponse({ error: "promptId is required" }, { status: 400, requestId });
    }

    const prompt = await getDb().prompt.findFirst({
      where: { id: promptId, userId },
    });

    if (!prompt) {
      return jsonResponse({ error: "Prompt not found" }, { status: 404, requestId });
    }

    const { text, score, changes } = body || {};

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

    return jsonResponse({ data: versionObj }, { status: 201, requestId });
  },
  { schema: createVersionSchema }
);
