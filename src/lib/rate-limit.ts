/**
 * In-memory sliding-window rate limiter.
 *
 * Good enough for single-instance deployments and as a first line of defense
 * against abuse. For multi-region deployments, swap the backing store for
 * Redis/Upstash — the API stays the same.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Bucket>();

// Opportunistic cleanup so the map doesn't grow unbounded
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter: number; // seconds
};

export type RateLimitOptions = {
  /** Unique identifier for the caller (user id, ip, etc.) */
  key: string;
  /** Bucket name — keeps separate limits isolated (e.g. "ai", "auth"). */
  scope: string;
  /** Max requests allowed within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

export function rateLimit(opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const storeKey = `${opts.scope}:${opts.key}`;
  const existing = store.get(storeKey);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + opts.windowMs;
    store.set(storeKey, { count: 1, resetAt });
    return {
      ok: true,
      limit: opts.limit,
      remaining: opts.limit - 1,
      resetAt,
      retryAfter: 0,
    };
  }

  if (existing.count >= opts.limit) {
    return {
      ok: false,
      limit: opts.limit,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfter: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return {
    ok: true,
    limit: opts.limit,
    remaining: opts.limit - existing.count,
    resetAt: existing.resetAt,
    retryAfter: 0,
  };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
  if (!result.ok) headers["Retry-After"] = String(result.retryAfter);
  return headers;
}

/**
 * Resolve a client IP from common proxy headers. Falls back to "unknown" —
 * callers should combine this with the user id whenever possible.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

/** Common preset buckets. */
export const RATE_LIMITS = {
  /** AI endpoints (chat, voice, planning). */
  ai: { limit: 30, windowMs: 60_000 },
  /** Auth endpoints (login, signup, reset). */
  auth: { limit: 5, windowMs: 60_000 },
  /** Checkout + billing endpoints. */
  billing: { limit: 10, windowMs: 60_000 },
  /** General CRUD endpoints. */
  general: { limit: 120, windowMs: 60_000 },
  /** Webhook endpoints — looser but still bounded. */
  webhook: { limit: 300, windowMs: 60_000 },
} as const;
