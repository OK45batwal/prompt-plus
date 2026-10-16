import { beforeEach, describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { summarizeMeasuredScores } from "@/lib/score-summary";

const db = vi.hoisted(() => ({
  usageLog: { count: vi.fn(), findMany: vi.fn() },
  prompt: { count: vi.fn(), findMany: vi.fn() },
}));
vi.mock("@/lib/auth/config", () => ({ auth: vi.fn().mockResolvedValue({ user: { id: "test-user-123" } }) }));
vi.mock("@/lib/db/prisma", () => ({ getDb: () => db }));
import { GET as analytics } from "@/app/api/v1/analytics/stats/route";
import { GET as usage } from "@/app/api/v1/usage/route";

beforeEach(() => {
  vi.clearAllMocks();
  db.usageLog.count.mockResolvedValue(0);
  db.usageLog.findMany.mockResolvedValue([]);
  db.prompt.count.mockResolvedValue(0);
  db.prompt.findMany.mockResolvedValue([]);
});

describe("honest analytics", () => {
  it("returns null measurements and empty models for a fresh account", async () => {
    const res = await analytics(new NextRequest("http://localhost/api/v1/analytics/stats?range=7d"));
    expect(res.status).toBe(200);
    const { data } = await res.json();
    expect(data.kpis).toMatchObject({ averageScore: null, scoreLift: null, avgLatencyMs: null, scoresMeasured: 0, pairedScores: 0 });
    expect(data.modelBreakdown).toEqual([]);
    expect(data.categoryBreakdown).toEqual([]);
    expect(data.dailyActivity).toHaveLength(7);
    expect(data.dailyActivity.every((day: { height: string }) => day.height === "0%")).toBe(true);
  });
  it("returns stored model assessments and actual paired change", async () => {
    db.prompt.findMany.mockResolvedValue([{ score: { total: 94, measuredBy: "llm", originalTotal: 96, enhancedTotal: 94 }, createdAt: new Date(), category: "coding" }]);
    db.usageLog.findMany.mockResolvedValue([{ id: "a", model: "test-model", action: "score", latencyMs: 0, createdAt: new Date() }]);
    const { data } = await (await analytics(new NextRequest("http://localhost/api/v1/analytics/stats"))).json();
    expect(data.kpis).toMatchObject({ averageScore: 94, scoreLift: -2, avgLatencyMs: 0, scoresMeasured: 1 });
    expect(data.modelBreakdown).toHaveLength(1);
    expect(data.modelBreakdown[0].count).toBe(1);
    expect(data.dailyActivity.reduce((n: number, day: { enhancements: number }) => n + day.enhancements, 0)).toBe(0);
    expect(db.usageLog.findMany.mock.calls[0][0]).not.toHaveProperty("take");
  });
  it("usage does not invent a score or count deleted prompts", async () => {
    const { data } = await (await usage(new NextRequest("http://localhost/api/v1/usage"))).json();
    expect(data.averageScore).toBeNull();
    expect(data.scoresMeasured).toBe(0);
    expect(db.prompt.findMany.mock.calls[0][0].where.deletedAt).toBeNull();
  });
  it("ignores heuristics, legacy scores, malformed numbers; preserves measured zero", () => {
    const invalid = [null, {}, { total: 92 }, { measuredBy: "structural", total: 99 }, ...[null, "94", NaN, Infinity, -1, 101].map(total => ({ total, measuredBy: "llm" }))];
    expect(summarizeMeasuredScores(invalid.map(score => ({ score })))).toEqual({ averageScore: null, scoreLift: null, scoresMeasured: 0, pairedScores: 0 });
    expect(summarizeMeasuredScores([{ score: { total: 0, measuredBy: "llm", originalTotal: 0, enhancedTotal: 0 } }])).toEqual({ averageScore: 0, scoreLift: 0, scoresMeasured: 1, pairedScores: 1 });
  });
});
