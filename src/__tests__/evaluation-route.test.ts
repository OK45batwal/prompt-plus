import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ evaluate: vi.fn(), budget: vi.fn(), db: {
  prompt: { findFirst: vi.fn() }, usageLog: { create: vi.fn() }, analytics: { create: vi.fn() },
} }));
vi.mock("@/lib/auth/config", () => ({ auth: async () => ({ user: { id: "owner" } }) }));
vi.mock("@/lib/db/prisma", () => ({ getDb: () => mocks.db }));
vi.mock("@/lib/prompt-engine", () => ({ runRealPromptEvaluation: mocks.evaluate }));
vi.mock("@/lib/rate-limit", () => ({ checkIpRateLimitAsync: mocks.budget, getRateLimitHeaders: () => ({ "Retry-After": "60" }), rateLimitMessage: () => "Rate limited", rateLimitStatus: () => 429 }));
vi.mock("@/lib/llm/server-api-key", () => ({ resolveServerApiKey: () => ({ apiKey: "", provider: "openrouter" }) }));
import { POST } from "@/app/api/v2/evaluate/route";
const body = { promptId: "p", originalPrompt: "2+2", candidateText: "Return 2+2", confirmLiveEvaluation: true, rubric: { exact: "4" } };
const request = (data: object) => new NextRequest("http://localhost/api/v2/evaluate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.budget.mockResolvedValue({ allowed: true });
  mocks.db.prompt.findFirst.mockResolvedValue({ id: "p" });
  mocks.db.usageLog.create.mockResolvedValue({});
  mocks.db.analytics.create.mockResolvedValue({});
});
it.each(["measured", "inconclusive", "unevaluated", "failed"])("persists the actual %s evaluation and both request records", async status => {
  const measured = status === "measured";
  const evaluation = { status, winner: measured ? "tie" : null, improvementDelta: measured ? 0 : null, baselineScore: measured ? 100 : null, optimizedScore: measured ? 100 : null, runs: [0, 1].map(() => ({ model: "fixture", provider: "fixture", tokensIn: 4, tokensOut: 1, latencyMs: 0, error: status === "failed" ? "execution_failed" : null })) };
  mocks.evaluate.mockResolvedValue(evaluation);
  const response = await POST(request(body));
  expect(response.status).toBe(200);
  expect((await response.json()).data).toEqual(evaluation);
  expect(mocks.db.usageLog.create).toHaveBeenCalledTimes(2);
  expect(mocks.db.analytics.create.mock.calls[0][0]).toMatchObject({ data: { userId: "owner", promptId: "p", metadata: { status, rubric: { exact: "4" }, improvementDelta: measured ? 0 : null } } });
});
it("requires explicit live confirmation before executing or logging", async () => {
  expect((await POST(request({ ...body, confirmLiveEvaluation: false }))).status).toBe(400);
  expect(mocks.evaluate).not.toHaveBeenCalled();
  expect(mocks.db.usageLog.create).not.toHaveBeenCalled();
});
it("rejects another user's or changed prompt before spending a request", async () => {
  mocks.db.prompt.findFirst.mockResolvedValue(null);
  expect((await POST(request(body))).status).toBe(409);
  expect(mocks.evaluate).not.toHaveBeenCalled();
  expect(mocks.db.prompt.findFirst.mock.calls[0][0].where).toMatchObject({ userId: "owner", originalText: "2+2", enhancedText: "Return 2+2" });
});
it("enforces the account evaluation budget", async () => {
  mocks.budget.mockResolvedValue({ allowed: false });
  const response = await POST(request(body));
  expect(response.status).toBe(429);
  expect(response.headers.get("Retry-After")).toBe("60");
  expect(mocks.evaluate).not.toHaveBeenCalled();
});
