import { NextRequest } from "next/server";
import { getDb } from "@/lib/db/prisma";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";

export const GET = withAuth(async (req: NextRequest, { userId, requestId }) => {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return jsonResponse({ error: "Missing prompt ID" }, { status: 400, requestId });
  }

  const prompt = await getDb().prompt.findFirst({
    where: { id, userId, deletedAt: null },
    include: { versions: { orderBy: { version: "desc" } } },
  });

  if (!prompt) {
    return jsonResponse({ error: "Prompt not found" }, { status: 404, requestId });
  }

  return jsonResponse({ data: prompt }, { requestId });
});

export const DELETE = withAuth(async (req: NextRequest, { userId, requestId }) => {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return jsonResponse({ error: "Missing prompt ID" }, { status: 400, requestId });
  }

  const existing = await getDb().prompt.findFirst({
    where: { id, userId, deletedAt: null },
  });

  if (!existing) {
    return jsonResponse({ error: "Prompt not found" }, { status: 404, requestId });
  }

  // Soft-delete: set deletedAt timestamp instead of cascading hard delete
  await getDb().prompt.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return jsonResponse(
    { message: "Prompt soft-deleted successfully", id },
    { requestId }
  );
});
