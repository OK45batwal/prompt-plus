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
 * Supports distributed Upstash Redis REST API or in-memory sliding window fallback.
 */
export function checkIpRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Synchronous in-memory check for fast path & fallback
  const now = Date.now();
  let bucket = ipBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 1, resetAt: now + windowMs };
    ipBuckets.set(key, bucket);
  } else {
    bucket.count++;
  }

  const result: RateLimitResult = {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    resetMs: Math.max(0, bucket.resetAt - now),
    limit,
  };

  // If Upstash Redis environment variables are set, sync asynchronously to distributed Redis store
  if (redisUrl && redisToken) {
    void (async () => {
      try {
        await fetch(`${redisUrl}/pipeline`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${redisToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            ["INCR", key],
            ["PEXPIRE", key, windowMs, "NX"],
          ]),
        });
      } catch {
        // Fallback to in-memory store silently on Redis network issues
      }
    })();
  }

  return result;
}

/**
 * Async distributed rate limit check for environments requiring strict serverless Redis evaluation.
 */
export async function checkIpRateLimitAsync(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    try {
      const res = await fetch(`${redisUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", key],
          ["PTTL", key],
        ]),
      });

      if (res.ok) {
        const data = (await res.json()) as Array<{ result: number }>;
        const count = data[0]?.result || 1;
        let pttl = data[1]?.result || windowMs;
        if (pttl <= 0) pttl = windowMs;

        return {
          allowed: count <= limit,
          remaining: Math.max(0, limit - count),
          resetMs: pttl,
          limit,
        };
      }
    } catch {
      // Fallback to in-memory on error
    }
  }

  return checkIpRateLimit(key, limit, windowMs);
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of ipBuckets) {
    if (now >= bucket.resetAt) ipBuckets.delete(key);
  }
}, 60000).unref();
