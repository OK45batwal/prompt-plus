/**
 * Per-User In-Memory Token Bucket Rate Limiter
 *
 * NOTE FOR MULTI-INSTANCE DEPLOYMENTS:
 * This in-memory Map implementation works for single-server setups.
 * For scaled or serverless multi-instance deployments, this store MUST be
 * migrated to a distributed cache like Redis (e.g., via Upstash Redis or ioredis)
 * to maintain consistent rate limits across nodes.
 */

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const userBuckets = new Map<string, TokenBucket>();

const DAILY_LIMIT = parseInt(process.env.FREE_TIER_DAILY_LIMIT || "20", 10);
const DAY_MS = 24 * 60 * 60 * 1000;

// Periodic cleanup of stale in-memory buckets (older than 24h) to avoid memory leaks
function cleanupStaleBuckets(now: number) {
  if (userBuckets.size > 1000) {
    for (const [key, bucket] of userBuckets.entries()) {
      if (now - bucket.lastRefill > DAY_MS) {
        userBuckets.delete(key);
      }
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
  limit: number;
}

export async function checkRateLimitAsync(
  userId: string,
  cost: number = 1
): Promise<RateLimitResult> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    try {
      const key = `rate-limit:${userId}`;
      const res = await fetch(`${redisUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCRBY", key, cost],
          ["TTL", key],
        ]),
      });

      if (res.ok) {
        const data = await res.json();
        const currentUsage = data[0]?.result ?? cost;
        let ttl = data[1]?.result ?? -1;

        if (ttl === -1) {
          // Set 24h expiration on key if first increment
          await fetch(`${redisUrl}/expire/${key}/86400`, {
            headers: { Authorization: `Bearer ${redisToken}` },
          });
          ttl = 86400;
        }

        const remaining = Math.max(0, DAILY_LIMIT - currentUsage);
        const allowed = currentUsage <= DAILY_LIMIT;
        return { allowed, remaining, resetMs: ttl * 1000, limit: DAILY_LIMIT };
      }
    } catch {
      // Fallback to in-memory on Redis connection failure
    }
  }

  return checkRateLimit(userId, cost);
}

export function checkRateLimit(
  userId: string,
  cost: number = 1
): RateLimitResult {
  const now = Date.now();
  cleanupStaleBuckets(now);

  let bucket = userBuckets.get(userId);

  if (!bucket) {
    bucket = { tokens: DAILY_LIMIT, lastRefill: now };
    userBuckets.set(userId, bucket);
  }

  // Check if 24 hours have elapsed since last reset
  const elapsed = now - bucket.lastRefill;
  if (elapsed >= DAY_MS) {
    bucket.tokens = DAILY_LIMIT;
    bucket.lastRefill = now;
  }

  const resetMs = Math.max(0, DAY_MS - (now - bucket.lastRefill));

  if (bucket.tokens >= cost) {
    bucket.tokens -= cost;
    return { allowed: true, remaining: bucket.tokens, resetMs, limit: DAILY_LIMIT };
  }

  return { allowed: false, remaining: 0, resetMs, limit: DAILY_LIMIT };
}

export function resetRateLimit(userId: string) {
  userBuckets.delete(userId);
}

