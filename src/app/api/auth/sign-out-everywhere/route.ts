import { getDb } from "@/lib/db/prisma";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";

export const POST = withAuth(async (_req, { userId, requestId }) => {
  const db = getDb();
  await db.user.update({
    where: { id: userId },
    data: { authVersion: { increment: 1 } },
  });
  // Database-backed sessions (if any were ever created) go too.
  await db.session.deleteMany({ where: { userId } }).catch(() => {});

  return jsonResponse({ data: { signedOutEverywhere: true } }, { requestId });
});
