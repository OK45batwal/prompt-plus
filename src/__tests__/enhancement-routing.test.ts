import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(), key: vi.fn(), llm: vi.fn(), rate: vi.fn(), stored: vi.fn(), log: vi.fn(),
}));
vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/auth/account", () => ({
  verifySessionAccount: async () => ({ ok: true, user: { id: "owner", authVersion: 0, emailVerified: null } }),
  sessionCheckMessage: () => "invalid session",
}));
vi.mock("@/lib/db/prisma", () => ({ getDb: () => ({ apiKey: { findFirst: mocks.stored }, usageLog: { create: mocks.log } }) }));
vi.mock("@/lib/llm/server-api-key", async importOriginal => ({ ...await importOriginal<object>(), resolveServerApiKey: mocks.key }));
vi.mock("@/lib/llm/providers", async importOriginal => ({ ...await importOriginal<object>(), callLLM: mocks.llm }));
vi.mock("@/lib/rate-limit", () => ({ checkIpRateLimitAsync: mocks.rate, extractClientIp: () => "test", getRateLimitHeaders: () => ({ "Retry-After": "60" }), rateLimitStatus: () => 429, rateLimitMessage: () => "Rate limited" }));
import { POST as enhance } from "@/app/api/v1/extension/enhance/route";
import { POST as optimize } from "@/app/api/v2/optimize/route";
import { POST as extensionOptimize, OPTIONS } from "@/app/api/v2/extension/optimize/route";
import { executeLoopEngineering } from "@/lib/prompt-engine";
const text = "Write a project update for the engineering team. Keep it under 150 words.";
const request = (data: unknown) => new NextRequest("http://localhost/api/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "owner" } });
  mocks.key.mockReturnValue(null);
  mocks.stored.mockResolvedValue(null);
  mocks.log.mockResolvedValue({});
  mocks.rate.mockResolvedValue({ allowed: true });
});
afterEach(() => vi.unstubAllGlobals());
describe("automatic engine routing", () => {
  it("runs the real engine without a key and never calls a provider", async () => {
    const response = await enhance(request({ text }));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(data).toMatchObject({ provider: "engine", source: "engine", enhanced: executeLoopEngineering(text).finalPrompt });
    expect(data.enhanced).not.toContain("### Task");
    expect(mocks.llm).not.toHaveBeenCalled();
  });
  it("keeps anonymous requests on the engine even if a server key exists", async () => {
    mocks.auth.mockResolvedValue(null);
    mocks.key.mockReturnValue({ apiKey: "server-key", provider: "openai" });
    expect((await (await enhance(request({ text }))).json()).provider).toBe("engine");
    expect(mocks.key).not.toHaveBeenCalled();
    expect(mocks.llm).not.toHaveBeenCalled();
  });
  it("falls back to the engine on provider failure without keyless retries", async () => {
    mocks.llm.mockRejectedValue(new Error("Provider unavailable"));
    const data = await (await enhance(request({ text, apiKey: "sk-test", provider: "openai", model: "gpt-4o-mini" }))).json();
    expect(data.provider).toBe("engine");
    expect(mocks.llm).toHaveBeenCalledTimes(1);
  });
  it("automatically uses the engine in Studio without credentials", async () => {
    const data = await (await optimize(request({ text, mode: "auto" }))).json();
    expect(data.data.source).toBe("engine");
    expect(data.data.selectedCandidate.renderedText).toBe(executeLoopEngineering(text).selectedCandidate.renderedText);
    expect(mocks.llm).not.toHaveBeenCalled();
  });
  it("keeps a fallback server key paired with its own provider model", async () => {
    mocks.key.mockReturnValue({ apiKey: "server-key", provider: "openai" });
    mocks.llm.mockResolvedValue({ content: "Write a concise update for the engineering team under 150 words.", provider: "openai", model: "gpt-4o-mini" });
    const data = await (await optimize(request({ text, mode: "auto", provider: "openrouter", targetModel: "nvidia/nemotron-3.5-super-vl:free" }))).json();
    expect(data.data.source).toBe("llm");
    expect(mocks.llm).toHaveBeenCalledWith(expect.objectContaining({ provider: "openai", model: "gpt-4o-mini", apiKey: "server-key" }));
  });
  it("honors local-only privacy even when credentials are available", async () => {
    await optimize(request({ text, mode: "auto", privacyPreference: "local_only", userApiKey: "sk-test" }));
    expect(mocks.llm).not.toHaveBeenCalled();
  });
  it("rejects missing cloud credentials before any network call", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const { callLLM } = await vi.importActual<typeof import("@/lib/llm/providers")>("@/lib/llm/providers");
    await expect(callLLM({ apiKey: " ", systemPrompt: "test", userPrompt: text })).rejects.toThrow("API key is required");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("applies the same abuse budget and CORS to the v2 compatibility endpoint", async () => {
    mocks.rate.mockResolvedValue({ allowed: false });
    for (const route of [enhance, extensionOptimize]) {
      const response = await route(request({ text }));
      expect(response.status).toBe(429);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Retry-After")).toBe("60");
    }
    expect(mocks.rate.mock.calls.every(call => call[0] === "ext:test")).toBe(true);
    expect((await OPTIONS()).headers.get("Access-Control-Allow-Methods")).toContain("POST");
  });
  it.each([null, { text: 42 }, { text: " " }, { text: "a".repeat(10001) }])("validates public v2 input %j", async body => {
    expect((await extensionOptimize(request(body))).status).toBe(400);
  });
});
