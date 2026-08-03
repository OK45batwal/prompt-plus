import { getDb } from "@/lib/db/prisma";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";
import { checkIpRateLimit } from "@/lib/rate-limit";

export const DELETE = withAuth(
  async (req, { userId, requestId }) => {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const rl = checkIpRateLimit(`del:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.allowed) {
      return jsonResponse({ error: "Too many attempts. Try again later." }, { status: 429, rateLimit: rl, requestId });
    }

    await getDb().$transaction([
      getDb().usageLog.deleteMany({ where: { userId } }),
      getDb().analytics.deleteMany({ where: { userId } }),
      getDb().user.delete({ where: { id: userId } }),
    ]);

    return jsonResponse({ message: "Account deleted. All associated data has been permanently removed." }, { requestId });
  }
);
