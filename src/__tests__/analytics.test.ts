import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock next-auth to simulate authenticated state
vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "test-user-123" } }),
}));

// Mock database calls
vi.mock("@/lib/db/prisma", () => ({
  getDb: () => ({
    usageLog: {
      count: vi.fn().mockResolvedValue(18),
      findMany: vi.fn().mockResolvedValue([
        {
          id: "log1",
          action: "enhance",
          model: "google/gemini-2.0-flash-exp:free",
          provider: "openrouter",
          tokensIn: 120,
          tokensOut: 280,
          latencyMs: 22,
          createdAt: new Date(),
        },
      ]),
    },
    prompt: {
      count: vi.fn().mockResolvedValue(8),
      findMany: vi.fn().mockResolvedValue([
        {
          id: "p1",
          model: "google/gemini-2.0-flash-exp:free",
          category: "coding",
          score: { total: 94 },
          createdAt: new Date(),
        },
      ]),
    },
  }),
}));

import { GET as getAnalyticsStats } from "@/app/api/v1/analytics/stats/route";

describe("Analytics & Insights API", () => {
  it("should return comprehensive analytics stats and KPIs for authenticated user", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/analytics/stats?range=7d");

    const res = await getAnalyticsStats(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data).toBeDefined();
    expect(json.data.kpis).toBeDefined();
    expect(json.data.kpis.monthlyUsed).toBe(18);
    expect(json.data.kpis.averageScore).toBe(94);
    expect(json.data.dailyActivity.length).toBe(7);
    expect(json.data.modelBreakdown.length).toBeGreaterThan(0);
  });
});
