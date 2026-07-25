import { NextRequest } from "next/server";
import { getDb } from "@/lib/db/prisma";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";

export const GET = withAuth(async (req: NextRequest, { requestId }) => {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return jsonResponse({ error: "Missing template ID" }, { status: 400, requestId });
  }

  const template = await getDb().template.findUnique({
    where: { id },
  });

  if (!template) {
    return jsonResponse({ error: "Template not found" }, { status: 404, requestId });
  }

  return jsonResponse({ data: template }, { requestId });
});

export const DELETE = withAuth(async (req: NextRequest, { requestId }) => {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return jsonResponse({ error: "Missing template ID" }, { status: 400, requestId });
  }

  const existing = await getDb().template.findUnique({
    where: { id },
  });

  if (!existing) {
    return jsonResponse({ error: "Template not found" }, { status: 404, requestId });
  }

  if (existing.isOfficial) {
    return jsonResponse({ error: "Cannot delete official system templates" }, { status: 403, requestId });
  }

  await getDb().template.delete({
    where: { id },
  });

  return jsonResponse(
    { message: "Template deleted successfully", id },
    { requestId }
  );
});
