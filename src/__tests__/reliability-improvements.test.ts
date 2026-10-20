import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkIpRateLimitAsync, extractClientIp, getRateLimitHeaders, rateLimitStatus } from "@/lib/rate-limit";
import { callLLM, clearLLMCache } from "@/lib/llm/providers";
import { evaluateOutputQuality, runRealPromptEvaluation, runRegressionTest } from "@/lib/prompt-engine/evaluation-engine";
import { calculateCostEstimates, estimateTokenCount } from "@/lib/token-calculator";
import cases from "./fixtures/prompt-evaluation-v1.json";

beforeEach(() => { clearLLMCache(); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

function redisEnvironment() {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.invalid");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
}
function reply(content = "4", model = "test-model") {
  return new Response(JSON.stringify({ model, choices: [{ message: { content } }], usage: { prompt_tokens: 4, completion_tokens: 1 } }), { status: 200 });
}
const options = { apiKey: "sk-test-12345678", tenantId: "user-a", provider: "openai" as const, model: "test-model", systemPrompt: "Answer", userPrompt: "2+2" };

describe("distributed limiter failure semantics", () => {
  it("awaits one atomic command and returns the distributed count", async () => {
    redisEnvironment();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ result: [6, 3000] })));
    vi.stubGlobal("fetch", fetchMock);
    const result = await checkIpRateLimitAsync("email:private@example.test", 5, 10000);
    expect(result.allowed).toBe(false);
    expect(rateLimitStatus(result)).toBe(429);
    expect(getRateLimitHeaders(result)["Retry-After"]).toBe("3");
    const command = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(command[0]).toBe("EVAL");
    expect(command[3]).not.toContain("private@example.test");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it.each([{ result: [1, -1] }, { result: ["1", 500] }, { error: "Redis error" }, { result: [] }])("fails closed for malformed results %j", async (data) => {
    redisEnvironment();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(data))));
    const result = await checkIpRateLimitAsync("bad", 5, 1000);
    expect(result.unavailable).toBe(true);
    expect(rateLimitStatus(result)).toBe(503);
    expect(getRateLimitHeaders(result)).toEqual({ "Retry-After": "5" });
  });
  it("does not bypass production protection without Redis or on timeout", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", ""); vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    expect((await checkIpRateLimitAsync("missing", 5, 1000)).unavailable).toBe(true);
    redisEnvironment();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("timeout", "TimeoutError")));
    expect((await checkIpRateLimitAsync("timeout", 5, 1000)).unavailable).toBe(true);
  });
  it("ignores spoofed forwarding headers unless a trusted proxy is configured", () => {
    vi.stubEnv("VERCEL", ""); vi.stubEnv("TRUSTED_PROXY_IP_HEADER", "");
    const request = new Request("https://example.test", { headers: { "x-forwarded-for": "8.8.8.8", "x-real-ip": "1.2.3.4" } });
    expect(extractClientIp(request)).toBe("unknown");
    vi.stubEnv("TRUSTED_PROXY_IP_HEADER", "x-real-ip");
    expect(extractClientIp(request)).toBe("1.2.3.4");
  });
});

describe("LLM request cache isolation", () => {
  it("caches identical requests but separates options, credentials and tenants", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(reply()));
    vi.stubGlobal("fetch", fetchMock);
    await callLLM(options); await callLLM(options);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    for (const change of [{ temperature: 0 }, { maxTokens: 10 }, { responseFormatJson: true }, { apiKey: "sk-other-12345678" }, { tenantId: "user-b" }, { userPrompt: "other" }, { systemPrompt: "other" }, { model: "other" }]) await callLLM({ ...options, ...change });
    expect(fetchMock).toHaveBeenCalledTimes(9);
  });
  it("bypasses anonymous and measured calls and expires cached results", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(reply()));
    vi.stubGlobal("fetch", fetchMock);
    await callLLM(options);
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 11 * 60000);
    await callLLM(options);
    await callLLM({ ...options, bypassCache: true });
    await callLLM({ ...options, tenantId: undefined });
    await callLLM({ ...options, tenantId: undefined });
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });
  it("does not cache failed requests", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response("{}", { status: 401 })).mockImplementation(() => Promise.resolve(reply()));
    vi.stubGlobal("fetch", fetchMock);
    await expect(callLLM(options)).rejects.toThrow();
    await callLLM(options);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("task evaluation", () => {
  it.each(cases)("grades $id against its task contract", ({ good, bad, rubric }) => {
    expect(evaluateOutputQuality(good, rubric)).toBe(100);
    expect(evaluateOutputQuality(bad, rubric)).toBe(0);
  });
  it("runs symmetric uncached comparisons and records ties", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(reply()));
    vi.stubGlobal("fetch", fetchMock);
    const result = await runRealPromptEvaluation("2+2", "Answer 2+2", "test-model", { ...options, rubric: { exact: "4" } });
    expect(result.winner).toBe("tie");
    expect(result.status).toBe("measured");
    const bodies = fetchMock.mock.calls.map((c) => JSON.parse(c[1].body));
    expect(bodies[0].messages[0]).toEqual(bodies[1].messages[0]);
    expect(bodies[0].temperature).toBe(bodies[1].temperature);
    expect(result.runs[0].tokensOut).toBe(1);
  });
  it("marks failures and model changes inconclusive, never optimized wins", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response("{}", { status: 500 })).mockResolvedValueOnce(reply());
    vi.stubGlobal("fetch", fetchMock);
    const failed = await runRealPromptEvaluation("a", "b", "test-model", { ...options, rubric: { exact: "4" } });
    expect(failed.status).toBe("failed"); expect(failed.winner).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    fetchMock.mockResolvedValueOnce(reply("4", "a")).mockResolvedValueOnce(reply("4", "b"));
    const mismatch = await runRealPromptEvaluation("a", "b", "test-model", options);
    expect(mismatch.status).toBe("inconclusive"); expect(mismatch.improvementDelta).toBeNull();
  });
  it("reports missing baseline cases", () => {
    const result = runRegressionTest([{ caseId: "missing", score: 90 }] as never, []);
    expect(result.missingCases).toEqual(["missing"]); expect(result.hasRegression).toBe(true);
  });
});

it("quotes only verified prices and handles empty/multilingual estimates", () => {
  const estimates = calculateCostEstimates("hello");
  // Verified catalog entries quote; unverified ones return null instead of a guess.
  expect(estimates.some((c) => c.pricingStatus === "verified" && c.estimatedCostUSD !== null)).toBe(true);
  expect(estimates.filter((c) => c.pricingStatus === "unverified").every((c) => c.estimatedCostUSD === null)).toBe(true);
  expect(estimates.every((c) => c.formattedCost === "Price unverified" || c.formattedCost.length > 0)).toBe(true);
  expect(estimateTokenCount(" ")).toBe(0);
  expect(estimateTokenCount("नमस्ते 世界 😀")).toBeGreaterThan(0);
});

it("auth routes return 503 for limiter failure and 429 for exhaustion before database work", async () => {
  const { POST } = await import("@/app/api/auth/resend-otp/route");
  const { NextRequest } = await import("next/server");
  redisEnvironment();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response("{}", { status: 500 })).mockResolvedValueOnce(new Response(JSON.stringify({ result: [99, 3000] }))));
  const request = () => new NextRequest("https://example.test/api/auth/resend-otp", { method: "POST", body: JSON.stringify({ email: "test@example.test" }) });
  const unavailable = await POST(request());
  expect(unavailable.status).toBe(503);
  expect(unavailable.headers.get("retry-after")).toBe("5");
  const exhausted = await POST(request());
  expect(exhausted.status).toBe(429);
  expect(exhausted.headers.get("retry-after")).toBe("3");
});
