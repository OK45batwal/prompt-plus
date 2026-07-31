import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db/prisma";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const [
    dailyCount,
    monthlyCount,
    totalPrompts,
    totalEnhancements,
    promptsWithScore,
  ] = await Promise.all([
    getDb().usageLog.count({
      where: {
        userId,
        action: "enhance",
        createdAt: { gte: startOfDay },
      },
    }),
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

  return NextResponse.json({
    data: {
      daily: {
        used: dailyCount,
        resetsAt: endOfDay.toISOString(),
      },
      monthly: {
        used: monthlyCount,
        resetsAt: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
      },
      totalPrompts,
      totalEnhancements,
      averageScore,
    },
  });
}

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
