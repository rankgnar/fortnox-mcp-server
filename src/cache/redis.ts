import Redis from "ioredis";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    redis = new Redis(url);
    redis.on("error", () => {
      redis = null;
    });
    return redis;
  } catch {
    return null;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const data = await client.get(`fnx:${key}`);
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.set(`fnx:${key}`, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // Silent fail - cache is optional
  }
}

export async function cacheInvalidate(pattern: string): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    const keys = await client.keys(`fnx:${pattern}`);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch {
    // Silent fail
  }
}
