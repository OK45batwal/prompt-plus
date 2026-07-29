import { z } from "zod";
import { getDb } from "@/lib/db/prisma";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";

const updateProfileSchema = z.object({
  name: z.string().trim().max(100).optional(),
});

export const PATCH = withAuth(
  async (req, context) => {
    const { userId, requestId, body } = context;
    const data: Record<string, unknown> = {};
    if (body?.name !== undefined) data.name = body.name;

    const dbResult = await getDb().user.update({ where: { id: userId }, data, select: { name: true } });

    return jsonResponse({ message: "Profile updated", data: dbResult }, { requestId });
  },
  { schema: updateProfileSchema }
);
