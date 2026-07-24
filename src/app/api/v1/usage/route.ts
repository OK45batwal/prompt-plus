import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const limit = parseInt(process.env.FREE_TIER_DAILY_LIMIT || "20", 10);

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
    db.usageLog.count({
      where: {
        userId,
        action: "enhance",
        createdAt: { gte: startOfDay },
      },
    }),
    db.usageLog.count({
      where: {
        userId,
        action: "enhance",
        createdAt: { gte: startOfMonth },
      },
    }),
    db.prompt.count({
      where: { userId },
    }),
    db.usageLog.count({
      where: {
        userId,
        action: "enhance",
      },
    }),
    db.prompt.findMany({
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

  const remaining = Math.max(0, limit - dailyCount);

  return NextResponse.json({
    data: {
      daily: {
        used: dailyCount,
        limit,
        remaining,
        resetsAt: endOfDay.toISOString(),
      },
      monthly: {
        used: monthlyCount,
        limit: limit * 25,
        remaining: Math.max(0, limit * 25 - monthlyCount),
        resetsAt: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
      },
      totalPrompts,
      totalEnhancements,
      averageScore,
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  let body: { action?: string; promptId?: string; details?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action, promptId, details } = body;
  if (!action) {
    return NextResponse.json({ error: "action is required" }, { status: 400 });
  }

  const analyticsEvent = await db.analytics.create({
    data: {
      userId,
      promptId: promptId || null,
      action: String(action),
      metadata: details ? JSON.parse(JSON.stringify(details)) : undefined,
    },
  });

  return NextResponse.json({
    data: {
      id: analyticsEvent.id,
      action: analyticsEvent.action,
      timestamp: analyticsEvent.createdAt.toISOString(),
    },
  }, { status: 201 });
}
