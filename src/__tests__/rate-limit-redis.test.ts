import { afterAll, afterEach, beforeAll, expect, it, vi } from "vitest";
import { spawn, execFileSync, type ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkIpRateLimitAsync } from "@/lib/rate-limit";

let available = true;
try { execFileSync("redis-server", ["--version"], { stdio: "ignore" }); } catch { available = false; }
let process: ChildProcess;
let directory: string;
let socket: string;
beforeAll(async () => {
  if (!available) return;
  try {
    directory = mkdtempSync(join(tmpdir(), "pp-redis-")); socket = join(directory, "redis.sock");
    process = spawn("redis-server", ["--port", "0", "--unixsocket", socket, "--save", "", "--appendonly", "no"], { stdio: "ignore" });
    for (let i = 0; i < 100; i++) {
      try { if (execFileSync("redis-cli", ["-s", socket, "PING"], { stdio: ["ignore", "pipe", "ignore"] }).toString().trim() === "PONG") return; } catch { /* wait for startup */ }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    available = false;
  } catch {
    available = false;
  }
});
afterAll(() => { try { process?.kill(); if (directory) rmSync(directory, { recursive: true, force: true }); } catch { /* cleanup */ } });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it("shares one atomic budget between module instances and expires it", async (ctx) => {
  if (!available) {
    ctx.skip();
    return;
  }
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.test"); vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test");
  vi.stubGlobal("fetch", vi.fn(async (_url, options) => {
    const command = JSON.parse(options.body);
    const result = JSON.parse(execFileSync("redis-cli", ["-s", socket, "--json", ...command], { encoding: "utf8" }));
    return new Response(JSON.stringify({ result }));
  }));
  vi.resetModules();
  const other = await import("@/lib/rate-limit");
  const results = await Promise.all(Array.from({ length: 12 }, (_, i) => (i % 2 ? other.checkIpRateLimitAsync : checkIpRateLimitAsync)("shared", 5, 5000)));
  expect(results.filter((r) => r.allowed)).toHaveLength(5);
  expect(results.every((r) => !r.unavailable && r.resetMs >= 0)).toBe(true);
  await checkIpRateLimitAsync("expiring", 5, 150);
  await new Promise((resolve) => setTimeout(resolve, 180));
  expect((await checkIpRateLimitAsync("expiring", 5, 150)).remaining).toBe(4);
});
it("accepts the KV_REST_API_* names the Vercel Upstash integration injects", async () => {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  vi.stubEnv("KV_REST_API_URL", "https://kv.test");
  vi.stubEnv("KV_REST_API_TOKEN", "kv-token");
  const calls: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    calls.push(String(input));
    return new Response(JSON.stringify({ result: [1, 60000] }), { status: 200 });
  }));
  const result = await checkIpRateLimitAsync("kv-key", 5, 60000);
  expect(result).toMatchObject({ allowed: true, remaining: 4 });
  expect(result.unavailable).toBeUndefined();
  expect(calls[0]).toBe("https://kv.test");
});
