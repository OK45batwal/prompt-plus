import { NextRequest } from "next/server";
import { getDb } from "@/lib/db/prisma";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";

export const GET = withAuth(async (req: NextRequest, { userId, requestId }) => {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return jsonResponse({ error: "Missing collection ID" }, { status: 400, requestId });
  }

  const collection = await getDb().collection.findFirst({
    where: { id, userId },
    include: { prompts: { where: { deletedAt: null } } },
  });

  if (!collection) {
    return jsonResponse({ error: "Collection not found" }, { status: 404, requestId });
  }

  return jsonResponse({ data: collection }, { requestId });
});

export const DELETE = withAuth(async (req: NextRequest, { userId, requestId }) => {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return jsonResponse({ error: "Missing collection ID" }, { status: 400, requestId });
  }

  const existing = await getDb().collection.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return jsonResponse({ error: "Collection not found" }, { status: 404, requestId });
  }

  // Delete collection and unlink related prompts
  await getDb().prompt.updateMany({
    where: { collectionId: id },
    data: { collectionId: null },
  });
  await getDb().collection.delete({
    where: { id },
  });

  return jsonResponse(
    { message: "Collection deleted successfully", id },
    { requestId }
  );
});

export const PATCH = withAuth(async (req: NextRequest, { userId, requestId }) => {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return jsonResponse({ error: "Missing collection ID" }, { status: 400, requestId });
  }

  let body: { name?: string; description?: string; color?: string; icon?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, { status: 400, requestId });
  }

  const existing = await getDb().collection.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return jsonResponse({ error: "Collection not found" }, { status: 404, requestId });
  }

  const updated = await getDb().collection.update({
    where: { id },
    data: {
      ...(body.name && { name: body.name.trim() }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.color && { color: body.color }),
      ...(body.icon && { icon: body.icon }),
    },
  });

  return jsonResponse({ data: updated, message: "Collection updated" }, { requestId });
});
