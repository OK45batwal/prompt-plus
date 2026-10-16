import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { NextRequest } from "next/server";

interface RateLimitBucket { count: number; resetAt: number }
const ipBuckets = new Map<string, RateLimitBucket>();
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
  limit: number;
  unavailable?: boolean;
}

// Only trust a proxy that the deployment explicitly identifies and configures
// to overwrite this header. Never accept arbitrary forwarded headers by default.
export function extractClientIp(req: NextRequest | Request): string {
  const header = process.env.VERCEL === "1" ? "x-vercel-forwarded-for" : process.env.TRUSTED_PROXY_IP_HEADER;
  const value = header ? req.headers.get(header)?.split(",")[0].trim() : undefined;
  return value && isIP(value) ? value : "unknown";
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  if (result.unavailable) return { "Retry-After": "5" };
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil((Date.now() + result.resetMs) / 1000)),
    ...(!result.allowed ? { "Retry-After": String(Math.max(1, Math.ceil(result.resetMs / 1000))) } : {}),
  };
}
export function rateLimitStatus(result: RateLimitResult): number { return result.unavailable ? 503 : 429; }
export function rateLimitMessage(result: RateLimitResult): string {
  return result.unavailable ? "Request protection is temporarily unavailable. Please retry shortly." : "Too many requests. Please retry later.";
}
function unavailable(limit: number): RateLimitResult {
  return { allowed: false, remaining: 0, resetMs: 5000, limit, unavailable: true };
}

/** Bounded development-only fixed-window limiter. Production must use Redis. */
export function checkIpRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  if (process.env.NODE_ENV === "production") return unavailable(limit);
  const now = Date.now();
  for (const [k, b] of ipBuckets) if (now >= b.resetAt) ipBuckets.delete(k);
  let bucket = ipBuckets.get(key);
  if (!bucket) {
    if (ipBuckets.size >= 5000) return unavailable(limit);
    bucket = { count: 0, resetAt: now + windowMs };
    ipBuckets.set(key, bucket);
  }
  bucket.count++;
  return { allowed: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count), resetMs: bucket.resetAt - now, limit };
}

// Atomic increment + expiry, including repair of a legacy key lacking a TTL.
export const RATE_LIMIT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {count, ttl}
`;

export async function checkIpRateLimitAsync(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  if (!Number.isSafeInteger(limit) || limit < 1 || !Number.isSafeInteger(windowMs) || windowMs < 1) throw new Error("Invalid rate limit budget");
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url && !token) return checkIpRateLimit(key, limit, windowMs);
  if (!url || !token) return unavailable(limit);
  try {
    const digest = createHash("sha256").update(key).digest("hex");
    const res = await fetch(url.replace(/\/$/, ""), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(["EVAL", RATE_LIMIT_SCRIPT, "1", `rate:v2:${digest}`, String(windowMs)]),
      signal: AbortSignal.timeout(1500),
      cache: "no-store",
    });
    if (!res.ok) return unavailable(limit);
    const data = await res.json();
    if (data.error || !Array.isArray(data.result) || data.result.length !== 2) return unavailable(limit);
    const [count, ttl] = data.result;
    if (!Number.isSafeInteger(count) || count < 1 || !Number.isSafeInteger(ttl) || ttl < 0 || ttl > windowMs) return unavailable(limit);
    return { allowed: count <= limit, remaining: Math.max(0, limit - count), resetMs: ttl, limit };
  } catch {
    return unavailable(limit);
  }
}
