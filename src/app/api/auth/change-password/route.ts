import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db/prisma";
import { changePasswordSchema } from "@/lib/validations/auth";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";
import { checkIpRateLimitAsync, extractClientIp, getRateLimitHeaders, rateLimitStatus, rateLimitMessage } from "@/lib/rate-limit";

export const POST = withAuth(
  async (req, context) => {
    const { userId, requestId, body } = context;
    const ip = extractClientIp(req);
    const rl = await checkIpRateLimitAsync(`pwd:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.allowed) {
      return jsonResponse({ error: rateLimitMessage(rl) }, { status: rateLimitStatus(rl), headers: getRateLimitHeaders(rl), rateLimit: rl, requestId });
    }

    const { currentPassword, newPassword } = body!;

    const user = await getDb().user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      return jsonResponse({ error: "Cannot change password for OAuth-only accounts" }, { status: 400, requestId });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return jsonResponse({ error: "Current password is incorrect" }, { status: 403, requestId });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await getDb().user.update({
      where: { id: user.id },
      data: { passwordHash, authVersion: { increment: 1 } },
    });

    return jsonResponse({ message: "Password updated. Other sessions have been signed out." }, { requestId });
  },
  { schema: changePasswordSchema }
);
