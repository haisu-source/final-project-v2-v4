// Lightweight in-memory token bucket. Per-instance only — fine for low traffic
// and as a first line of defense against accidental loops or single bots.
// For production-grade limits, swap for Upstash Redis or Vercel KV.

type Bucket = { tokens: number; updatedAt: number };

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetMs: number;
}

export function rateLimit(
  key: string,
  { capacity, refillPerSec }: { capacity: number; refillPerSec: number }
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);
  let tokens = existing?.tokens ?? capacity;
  const updatedAt = existing?.updatedAt ?? now;

  const elapsedSec = (now - updatedAt) / 1000;
  tokens = Math.min(capacity, tokens + elapsedSec * refillPerSec);

  if (tokens < 1) {
    buckets.set(key, { tokens, updatedAt: now });
    const resetMs = Math.ceil(((1 - tokens) / refillPerSec) * 1000);
    return { ok: false, remaining: 0, resetMs };
  }

  tokens -= 1;
  buckets.set(key, { tokens, updatedAt: now });
  return { ok: true, remaining: Math.floor(tokens), resetMs: 0 };
}

export function clientKey(req: Request, userId?: string | null): string {
  if (userId) return `u:${userId}`;
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anon";
  return `ip:${ip}`;
}
