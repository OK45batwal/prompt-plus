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
  directory = mkdtempSync(join(tmpdir(), "pp-redis-")); socket = join(directory, "redis.sock");
  process = spawn("redis-server", ["--port", "0", "--unixsocket", socket, "--save", "", "--appendonly", "no"], { stdio: "ignore" });
  for (let i = 0; i < 100; i++) {
    try { if (execFileSync("redis-cli", ["-s", socket, "PING"], { stdio: ["ignore", "pipe", "ignore"] }).toString().trim() === "PONG") return; } catch { /* wait for startup */ }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error("Redis startup failed");
});
afterAll(() => { process?.kill(); if (directory) rmSync(directory, { recursive: true, force: true }); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it.skipIf(!available)("shares one atomic budget between module instances and expires it", async () => {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.test"); vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test");
  vi.stubGlobal("fetch", vi.fn(async (_url, options) => {
    const command = JSON.parse(options.body);
    const result = JSON.parse(execFileSync("redis-cli", ["-s", socket, "--json", ...command], { encoding: "utf8" }));
    return new Response(JSON.stringify({ result }));
  }));
  vi.resetModules();
  const other = await import("@/lib/rate-limit");
  const results = await Promise.all(Array.from({ length: 12 }, (_, i) => (i % 2 ? other.checkIpRateLimitAsync : checkIpRateLimitAsync)("shared", 5, 150)));
  expect(results.filter((r) => r.allowed)).toHaveLength(5);
  expect(results.every((r) => !r.unavailable && r.resetMs >= 0)).toBe(true);
  await new Promise((resolve) => setTimeout(resolve, 180));
  expect((await checkIpRateLimitAsync("shared", 5, 150)).remaining).toBe(4);
});
