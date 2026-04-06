import { env } from "@/lib/env";

const windowMs = 60_000;
const cache = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxPerWindow: number = env.RATE_LIMIT_PER_MINUTE) {
  const now = Date.now();
  const entry = cache.get(key);
  if (!entry || now > entry.resetAt) {
    cache.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (entry.count >= maxPerWindow) {
    return { ok: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  cache.set(key, entry);
  return { ok: true };
}
