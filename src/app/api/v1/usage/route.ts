import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getDb } from "@/lib/db/prisma";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";

export const GET = withAuth(
  async (_req, { userId, requestId }) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      monthlyCount,
      totalPrompts,
      totalEnhancements,
      promptsWithScore,
    ] = await Promise.all([
      getDb().usageLog.count({
        where: {
          userId,
          action: "enhance",
          createdAt: { gte: startOfMonth },
        },
      }),
      getDb().prompt.count({
        where: { userId },
      }),
      getDb().usageLog.count({
        where: {
          userId,
          action: "enhance",
        },
      }),
      getDb().prompt.findMany({
        where: {
          userId,
          score: { not: Prisma.JsonNull },
        },
        select: { score: true },
      }),
    ]);

    let averageScore = 72;
    if (promptsWithScore.length > 0) {
      let totalScore = 0;
      let validCount = 0;
      for (const p of promptsWithScore) {
        if (p.score && typeof p.score === "object" && "total" in (p.score as Record<string, unknown>)) {
          const val = Number((p.score as Record<string, unknown>).total);
          if (!isNaN(val)) {
            totalScore += val;
            validCount++;
          }
        }
      }
      if (validCount > 0) {
        averageScore = Math.round(totalScore / validCount);
      }
    }

    return jsonResponse({
      data: {
        limit: 100,
        used: monthlyCount,
        remaining: Math.max(0, 100 - monthlyCount),
        resetAt: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
        totalPrompts,
        totalEnhancements,
        averageScore,
      },
    }, { requestId });
  }
);

const trackActionSchema = z.object({
  action: z.string().min(1).max(50),
  promptId: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export const POST = withAuth(
  async (req, context) => {
    const { userId, requestId, body } = context;
    const { action, promptId, details } = body!;

    const event = await getDb().analytics.create({
      data: {
        userId,
        promptId: promptId || null,
        action,
        metadata: details ? JSON.parse(JSON.stringify(details)) : undefined,
      },
    });

    return jsonResponse({
      data: {
        id: event.id,
        action: event.action,
        timestamp: event.createdAt.toISOString(),
      },
    }, { status: 201, requestId });
  },
  { schema: trackActionSchema }
);
