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

export function checkRateLimit(
  userId: string,
  cost: number = 1
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
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
    return { allowed: true, remaining: bucket.tokens, resetMs };
  }

  return { allowed: false, remaining: 0, resetMs };
}
