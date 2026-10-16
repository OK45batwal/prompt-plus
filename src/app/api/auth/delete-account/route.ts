import { getDb } from "@/lib/db/prisma";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";
import { checkIpRateLimitAsync, extractClientIp, getRateLimitHeaders, rateLimitStatus, rateLimitMessage } from "@/lib/rate-limit";

export const DELETE = withAuth(
  async (req, { userId, requestId }) => {
    const ip = extractClientIp(req);
    const rl = await checkIpRateLimitAsync(`del:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.allowed) {
      return jsonResponse({ error: rateLimitMessage(rl) }, { status: rateLimitStatus(rl), headers: getRateLimitHeaders(rl), rateLimit: rl, requestId });
    }

    await getDb().usageLog.deleteMany({ where: { userId } });
    await getDb().analytics.deleteMany({ where: { userId } });
    await getDb().user.delete({ where: { id: userId } });

    return jsonResponse({ message: "Account deleted. All associated data has been permanently removed." }, { requestId });
  }
);
