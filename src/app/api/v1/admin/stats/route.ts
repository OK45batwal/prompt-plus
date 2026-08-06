import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";
import { getDb } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export const GET = withAuth(
  async (_req, { session, requestId }) => {
    if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
      return jsonResponse({ error: "Forbidden" }, { status: 403, requestId });
    }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthAgo = new Date(now.getTime() - 30 * 86400000);

  const [
    totalUsers,
    verifiedUsers,
    deletedUsers,
    unverifiedUsers,
    totalPrompts,
    enhancedPrompts,
    totalApiKeys,
    apiKeysByProvider,
    dailyUsage,
    weeklyUsage,
    monthlyUsage,
    usageByAction,
    usageByProvider,
    totalTokensIn,
    totalTokensOut,
    userSignups7d,
    recentLogs,
    totalCollections,
    totalTemplates,
    scoreStats,
  ] = await Promise.all([
    getDb().user.count(),
    getDb().user.count({ where: { emailVerified: { not: null }, deletedAt: null } }),
    getDb().user.count({ where: { deletedAt: { not: null } } }),
    getDb().user.count({ where: { emailVerified: null, deletedAt: null } }),
    getDb().prompt.count({ where: { deletedAt: null } }),
    getDb().prompt.count({ where: { enhancedText: { not: null }, deletedAt: null } }),
    getDb().apiKey.count(),
    getDb().apiKey.groupBy({ by: ["provider"], _count: true }),
    getDb().usageLog.count({ where: { createdAt: { gte: today } } }),
    getDb().usageLog.count({ where: { createdAt: { gte: weekAgo } } }),
    getDb().usageLog.count({ where: { createdAt: { gte: monthAgo } } }),
    getDb().usageLog.groupBy({ by: ["action"], _count: true, where: { createdAt: { gte: weekAgo } } }),
    getDb().usageLog.groupBy({ by: ["provider"], _count: true, where: { createdAt: { gte: weekAgo } } }),
    getDb().usageLog.aggregate({ _sum: { tokensIn: true }, where: { success: true } }),
    getDb().usageLog.aggregate({ _sum: { tokensOut: true }, where: { success: true } }),
    getDb().user.count({ where: { createdAt: { gte: weekAgo } } }),
    getDb().usageLog.findMany({ orderBy: { createdAt: "desc" }, take: 20, select: { id: true, userId: true, action: true, provider: true, model: true, success: true, tokensIn: true, tokensOut: true, createdAt: true } }),
    getDb().collection.count(),
    getDb().template.count(),
    getDb().prompt.findMany({
      where: { score: { not: Prisma.JsonNull }, deletedAt: null },
      select: { score: true },
    }),
  ]);

  const avgScore = scoreStats.length > 0
    ? Math.round(scoreStats.reduce((sum, p) => {
        const s = p.score as Record<string, unknown> | null;
        return sum + (s && typeof s.total === 'number' ? s.total : 0);
      }, 0) / scoreStats.length)
    : 0;

    return jsonResponse(
      {
        data: {
          users: {
            total: totalUsers,
            verified: verifiedUsers,
            unverified: unverifiedUsers,
            deleted: deletedUsers,
            signups7d: userSignups7d,
          },
          prompts: {
            total: totalPrompts,
            enhanced: enhancedPrompts,
            avgScore,
          },
          usage: {
            daily: dailyUsage,
            weekly: weeklyUsage,
            monthly: monthlyUsage,
            tokensIn: totalTokensIn._sum.tokensIn || 0,
            tokensOut: totalTokensOut._sum.tokensOut || 0,
            byAction: usageByAction,
            byProvider: usageByProvider,
          },
          apiKeys: {
            total: totalApiKeys,
            byProvider: apiKeysByProvider,
          },
          content: {
            collections: totalCollections,
            templates: totalTemplates,
          },
          recentLogs,
        },
      },
      { requestId }
    );
  }
);
