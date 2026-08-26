import { NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/prisma";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";

export const GET = withAuth(async (_req: NextRequest, { userId, requestId }) => {
  const user = await getDb().user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      createdAt: true,
    },
  });

  if (!user) {
    return jsonResponse({ error: "User not found" }, { status: 404, requestId });
  }

  return jsonResponse({ data: user }, { requestId });
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  avatar: z.string().trim().max(1000000).optional().nullable(), // supports URLs and Base64 data URIs
});

export const PATCH = withAuth(
  async (req: NextRequest, { userId, requestId }) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, { status: 400, requestId });
    }

    const parseResult = updateProfileSchema.safeParse(body);
    if (!parseResult.success) {
      return jsonResponse(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400, requestId }
      );
    }

    const { name, avatar } = parseResult.data;

    const updatedUser = await getDb().user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(avatar !== undefined ? { avatar } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        updatedAt: true,
      },
    });

    return jsonResponse({ data: updatedUser }, { requestId });
  }
);
