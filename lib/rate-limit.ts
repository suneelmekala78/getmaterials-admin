import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || !url.startsWith("https://")) return null;
  redis = new Redis({ url, token });
  return redis;
}

const limiters = new Map<string, Ratelimit>();

function getLimiter(limit: number, windowMs: number): Ratelimit | null {
  const client = getRedis();
  if (!client) return null;

  const key = `${limit}:${windowMs}`;
  if (!limiters.has(key)) {
    limiters.set(
      key,
      new Ratelimit({
        redis: client,
        limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
        prefix: "ratelimit:admin",
      })
    );
  }
  return limiters.get(key)!;
}

/**
 * Redis-backed rate limiter using Upstash.
 * Returns true if the request is allowed, false if rate-limited.
 * Falls back to allowing all requests if Redis is unavailable.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const limiter = getLimiter(limit, windowMs);
  if (!limiter) return true;

  try {
    const { success } = await limiter.limit(key);
    return success;
  } catch {
    return true;
  }
}
