import { summarizeMeasuredScores } from "@/lib/score-summary";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";
import { getDb } from "@/lib/db/prisma";

export const GET = withAuth(
  async (req, { userId, requestId }) => {
    const url = new URL(req.url);
    const range = url.searchParams.get("range") || "7d"; // "7d" | "30d" | "all"

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let daysToLookBack = 7;
    if (range === "30d") daysToLookBack = 30;
    else if (range === "all") daysToLookBack = 90;

    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - (daysToLookBack - 1));
    startDate.setUTCHours(0, 0, 0, 0);

    const [
      monthlyCount,
      totalPrompts,
      totalEnhancements,
      prompts,
      usageLogs,
    ] = await Promise.all([
      getDb().usageLog.count({
        where: {
          userId,
          action: "enhance",
          createdAt: { gte: startOfMonth },
        },
      }),
      getDb().prompt.count({
        where: { userId, deletedAt: null },
      }),
      getDb().usageLog.count({
        where: { userId, action: "enhance" },
      }),
      getDb().prompt.findMany({
        where: {
          userId,
          deletedAt: null,
          createdAt: { gte: startDate },
        },
        select: {
          id: true,
          model: true,
          category: true,
          score: true,
          createdAt: true,
        },
      }),
      getDb().usageLog.findMany({
        where: {
          userId,
          createdAt: { gte: startDate },
        },
        select: {
          id: true,
          action: true,
          model: true,
          provider: true,
          tokensIn: true,
          tokensOut: true,
          latencyMs: true,
          success: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },

      }),
    ]);

    // 1. Build Daily Activity Map
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dailyMap = new Map<string, { date: string; day: string; prompts: number; enhancements: number; total: number }>();

    for (let i = 0; i < daysToLookBack; i++) {
      const d = new Date(startDate);
      d.setUTCDate(d.getUTCDate() + i);
      const dateKey = d.toISOString().split("T")[0];
      const dayLabel = dayNames[d.getUTCDay()];
      dailyMap.set(dateKey, {
        date: dateKey,
        day: dayLabel,
        prompts: 0,
        enhancements: 0,
        total: 0,
      });
    }

    for (const p of prompts) {
      const dateKey = p.createdAt.toISOString().split("T")[0];
      if (dailyMap.has(dateKey)) {
        const item = dailyMap.get(dateKey)!;
        item.prompts += 1;
        item.total += 1;
      }
    }

    for (const u of usageLogs) {
      const dateKey = u.createdAt.toISOString().split("T")[0];
      if (dailyMap.has(dateKey)) {
        const item = dailyMap.get(dateKey)!;
        if (u.action !== "enhance") continue;
        item.enhancements += 1;
        item.total += 1;
      }
    }

    const dailyActivity = Array.from(dailyMap.values());
    const maxDayCount = Math.max(1, ...dailyActivity.map((d) => d.total));
    const formattedDaily = dailyActivity.map((d) => ({
      ...d,
      height: `${Math.round((d.total / maxDayCount) * 100)}%`,
    }));

    // 2. Model Breakdown
    const modelCounts: Record<string, number> = {};
    for (const u of usageLogs) {
      if (u.model) {
        modelCounts[u.model] = (modelCounts[u.model] || 0) + 1;
      }
    }

    const modelColorMap: Record<string, string> = {
      "nvidia/nemotron-3.5-super-vl:free": "bg-emerald-500",
      "xingchen-agi/xing4.0-29b-a4b:free": "bg-indigo-400",
      "anthropic/claude-3.5-sonnet": "bg-amber-500",
      "openai/gpt-4o-mini": "bg-teal-400",
      "openai/gpt-4o": "bg-indigo-600",
      "Default (Auto-Routing)": "bg-teal-600",
    };

    const totalModelInteractions = Object.values(modelCounts).reduce((a, b) => a + b, 0) || 1;
    const modelBreakdown = Object.entries(modelCounts).map(([name, count]) => {
      const cleanName = name.replace(":free", "").replace(/^(google|deepseek|anthropic|openai|meta-llama)\//, "");
      return {
        name: cleanName.toUpperCase(),
        count,
        pct: Math.round((count / totalModelInteractions) * 100),
        color: modelColorMap[name] || "bg-indigo-500",
      };
    });

    // 3. Category Breakdown
    const categoryCounts: Record<string, number> = {};
    for (const p of prompts) {
      const cat = p.category || "General";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
    const categoryBreakdown = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / (prompts.length || 1)) * 100),
    }));

    // 4. Quality & Score Analytics
    const { averageScore, scoresMeasured, scoreLift, pairedScores } = summarizeMeasuredScores(prompts);

    // 5. Latency & Token Efficiency
    const validLatencies = usageLogs.map((u) => u.latencyMs).filter((l): l is number => typeof l === "number" && Number.isFinite(l) && l >= 0);
    const avgLatencyMs = validLatencies.length > 0 ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length) : null;

    const totalTokensIn = usageLogs.reduce((acc, u) => acc + (u.tokensIn || 0), 0);
    const totalTokensOut = usageLogs.reduce((acc, u) => acc + (u.tokensOut || 0), 0);
    const totalTokens = totalTokensIn + totalTokensOut;

    return jsonResponse(
      {
        data: {
          range,
          kpis: {
            monthlyUsed: monthlyCount,
            monthlyLimit: 100,
            remaining: Math.max(0, 100 - monthlyCount),
            totalPrompts,
            totalEnhancements,
            averageScore,
            scoresMeasured,
            scoreLift,
            pairedScores,
            avgLatencyMs,
            totalTokens,
          },
          dailyActivity: formattedDaily,
          modelBreakdown,
          categoryBreakdown,
          recentLogs: usageLogs.slice(0, 8),
        },
      },
      { requestId }
    );
  }
);
