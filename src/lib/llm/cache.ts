/**
 * In-Memory LRU Cache with TTL for LLM Prompt Enhancement Responses
 * Prevents redundant API calls and provider costs for duplicate prompts.
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class LruCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxEntries: number;
  private readonly defaultTtlMs: number;

  constructor(maxEntries = 500, defaultTtlMs = 10 * 60 * 1000) {
    this.maxEntries = maxEntries;
    this.defaultTtlMs = defaultTtlMs;
  }

  public get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Refresh LRU order (delete & re-insert)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  public set(key: string, value: T, ttlMs = this.defaultTtlMs): void {
    if (this.cache.size >= this.maxEntries) {
      // Evict oldest entry (first item in Map iterator)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }
}

// Global singleton instance for prompt enhancements (10-minute TTL)
export const enhancementCache = new LruCache<{
  enhancedText: string;
  score?: number;
  model: string;
  tokensIn?: number;
  tokensOut?: number;
}>(500, 10 * 60 * 1000);
