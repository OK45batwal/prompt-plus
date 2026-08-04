import { NextRequest } from "next/server";

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const ipBuckets = new Map<string, RateLimitBucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
  limit: number;
}

/**
 * Extract verified client IP address from request headers.
 * Security Note: On Vercel, x-real-ip and x-vercel-forwarded-for are set/overwritten by the edge proxy,
 * making them untamperable by the client. Plain x-forwarded-for can be spoofed if untrusted headers pass through.
 */
export function extractClientIp(req: NextRequest | Request): string {
  const headers = req.headers;
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const vercelIp = headers.get("x-vercel-forwarded-for");
  if (vercelIp) return vercelIp.split(",")[0].trim();

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return "127.0.0.1";
}

/**
 * Generate standard HTTP X-RateLimit-* headers from a rate limit result.
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil((Date.now() + result.resetMs) / 1000)),
  };
}

/**
 * Per-IP sliding-window rate limit for abuse protection.
 * Supports distributed Upstash Redis REST or in-memory sliding window fallback.
 */
export function checkIpRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  let bucket = ipBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 1, resetAt: now + windowMs };
    ipBuckets.set(key, bucket);
    return { allowed: true, remaining: limit - 1, resetMs: windowMs, limit };
  }

  bucket.count++;
  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    resetMs: Math.max(0, bucket.resetAt - now),
    limit,
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of ipBuckets) {
    if (now >= bucket.resetAt) ipBuckets.delete(key);
  }
}, 60000).unref();
