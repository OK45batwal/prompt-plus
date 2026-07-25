interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const userBuckets = new Map<string, TokenBucket>();

const DAILY_LIMIT = parseInt(process.env.FREE_TIER_DAILY_LIMIT || "20", 10);
const DAY_MS = 24 * 60 * 60 * 1000;

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

