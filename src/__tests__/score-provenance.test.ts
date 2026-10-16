import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({
  call: vi.fn(), key: vi.fn(),
  db: { apiKey: { findFirst: vi.fn() }, prompt: { findFirst: vi.fn(), updateMany: vi.fn() }, usageLog: { create: vi.fn() } },
}));
vi.mock("@/lib/auth/config", () => ({ auth: vi.fn().mockResolvedValue({ user: { id: "owner" } }) }));
vi.mock("@/lib/db/prisma", () => ({ getDb: () => mocks.db }));
vi.mock("@/lib/llm/providers", () => ({ callLLM: mocks.call }));
vi.mock("@/lib/llm/server-api-key", () => ({ resolveServerApiKey: mocks.key }));
import { auth } from "@/lib/auth/config";
import { POST } from "@/app/api/v1/prompts/score/route";
const request = (body: object) => new NextRequest("http://localhost/api/v1/prompts/score", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const score = (total: number) => ({ content: JSON.stringify({ total, dimensions: { clarity: total, specificity: total, structure: total, context: total, length: total, actionability: total } }), model: "fixture", provider: "openai", tokensIn: 3, tokensOut: 9 });
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(auth).mockResolvedValue({ user: { id: "owner" } } as never);
  mocks.key.mockReturnValue({ apiKey: "", provider: "openrouter" });
  mocks.db.apiKey.findFirst.mockResolvedValue(null);
  mocks.db.prompt.findFirst.mockResolvedValue(null);
  mocks.db.prompt.updateMany.mockResolvedValue({ count: 1 });
  mocks.db.usageLog.create.mockResolvedValue({});
});
describe("score provenance", () => {
  it("never presents the no-model path as measured", async () => {
    const { data } = await (await POST(request({ text: "Write a short reply" }))).json();
    expect(data).toMatchObject({ source: "heuristic", kind: "structural", measuredBy: "structural", measuredTotal: null, originalTotal: null, enhancedTotal: null });
    expect(mocks.call).not.toHaveBeenCalled();
  });
  it("persists both actual scores including zero and uses the resolved provider", async () => {
    mocks.key.mockReturnValue({ apiKey: "test", provider: "nvidia" });
    mocks.db.prompt.findFirst.mockResolvedValue({ id: "p", originalText: "original", enhancedText: "enhanced" });
    mocks.call.mockResolvedValueOnce(score(94)).mockResolvedValueOnce(score(0));
    const response = await POST(request({ text: "enhanced", promptId: "p" }));
    expect(response.status).toBe(200);
    expect((await response.json()).data).toMatchObject({ source: "llm", measuredTotal: 94, originalTotal: 0, enhancedTotal: 94 });
    expect(mocks.call.mock.calls[0][0].provider).toBe("nvidia");
    expect(mocks.db.prompt.updateMany.mock.calls[0][0]).toMatchObject({ where: { id: "p", userId: "owner", originalText: "original", enhancedText: "enhanced" }, data: { score: { measuredBy: "llm", total: 94, originalTotal: 0 } } });
  });
  it("checks ownership before spending model requests", async () => {
    expect((await POST(request({ text: "enhanced", promptId: "someone-elses" }))).status).toBe(404);
    expect(mocks.call).not.toHaveBeenCalled();
  });
  it("rejects scoring text different from the saved enhancement", async () => {
    mocks.db.prompt.findFirst.mockResolvedValue({ id: "p", enhancedText: "saved" });
    expect((await POST(request({ text: "other", promptId: "p" }))).status).toBe(409);
  });
  it("does not save a fabricated score after a malformed model response", async () => {
    mocks.key.mockReturnValue({ apiKey: "test", provider: "openai" });
    mocks.call.mockResolvedValue({ content: "not json" });
    const { data } = await (await POST(request({ text: "A task" }))).json();
    expect(data.measuredTotal).toBeNull();
    expect(data.source).toBe("heuristic");
    expect(mocks.db.prompt.updateMany).not.toHaveBeenCalled();
  });
});
