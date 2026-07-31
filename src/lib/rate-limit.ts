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
 * Per-IP sliding-window rate limit for abuse protection.
 * Not a daily quota — used to prevent spam on public/unauthenticated routes.
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
    resetMs: bucket.resetAt - now,
    limit,
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of ipBuckets) {
    if (now >= bucket.resetAt) ipBuckets.delete(key);
  }
}, 60000).unref();
