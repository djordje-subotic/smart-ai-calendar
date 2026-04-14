import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getClientIp,
  rateLimit,
  rateLimitHeaders,
  RATE_LIMITS,
} from "@/src/lib/rate-limit";

describe("rateLimit — sliding window", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-12T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the first request in a new bucket", () => {
    const result = rateLimit({ key: "user-a", scope: "test-1", limit: 3, windowMs: 60_000 });
    expect(result.ok).toBe(true);
    expect(result.limit).toBe(3);
    expect(result.remaining).toBe(2);
    expect(result.retryAfter).toBe(0);
  });

  it("decrements remaining on each successive call", () => {
    const key = { key: "user-a", scope: "test-2", limit: 3, windowMs: 60_000 };
    const a = rateLimit(key);
    const b = rateLimit(key);
    const c = rateLimit(key);

    expect(a.remaining).toBe(2);
    expect(b.remaining).toBe(1);
    expect(c.remaining).toBe(0);
    expect(c.ok).toBe(true); // the 3rd request is still allowed
  });

  it("rejects the 4th request when limit is 3", () => {
    const key = { key: "user-a", scope: "test-3", limit: 3, windowMs: 60_000 };
    rateLimit(key);
    rateLimit(key);
    rateLimit(key);
    const fourth = rateLimit(key);

    expect(fourth.ok).toBe(false);
    expect(fourth.remaining).toBe(0);
    expect(fourth.retryAfter).toBeGreaterThan(0);
    expect(fourth.retryAfter).toBeLessThanOrEqual(60);
  });

  it("resets after the window elapses", () => {
    const key = { key: "user-a", scope: "test-4", limit: 2, windowMs: 60_000 };
    rateLimit(key);
    rateLimit(key);
    expect(rateLimit(key).ok).toBe(false);

    // Advance past the window
    vi.advanceTimersByTime(61_000);

    const fresh = rateLimit(key);
    expect(fresh.ok).toBe(true);
    expect(fresh.remaining).toBe(1);
  });

  it("isolates buckets by scope even with same key", () => {
    const ai = rateLimit({ key: "user-a", scope: "ai", limit: 1, windowMs: 60_000 });
    const billing = rateLimit({ key: "user-a", scope: "billing", limit: 1, windowMs: 60_000 });
    expect(ai.ok).toBe(true);
    expect(billing.ok).toBe(true); // different scope, different bucket
  });

  it("isolates buckets by key within the same scope", () => {
    const scope = "test-isolation";
    const alice = rateLimit({ key: "alice", scope, limit: 1, windowMs: 60_000 });
    const bob = rateLimit({ key: "bob", scope, limit: 1, windowMs: 60_000 });
    expect(alice.ok).toBe(true);
    expect(bob.ok).toBe(true);
  });

  it("returns a resetAt timestamp in the future for ok responses", () => {
    const result = rateLimit({ key: "x", scope: "reset-test", limit: 5, windowMs: 60_000 });
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it("shares resetAt across the same bucket", () => {
    const key = { key: "same", scope: "reset-share", limit: 5, windowMs: 60_000 };
    const a = rateLimit(key);
    const b = rateLimit(key);
    expect(a.resetAt).toBe(b.resetAt);
  });
});

describe("rateLimitHeaders", () => {
  it("sets X-RateLimit-* headers on success", () => {
    const result = {
      ok: true,
      limit: 30,
      remaining: 20,
      resetAt: 1_700_000_000_000,
      retryAfter: 0,
    };
    const headers = rateLimitHeaders(result);

    expect(headers["X-RateLimit-Limit"]).toBe("30");
    expect(headers["X-RateLimit-Remaining"]).toBe("20");
    expect(headers["X-RateLimit-Reset"]).toBe(String(Math.ceil(1_700_000_000_000 / 1000)));
    expect(headers["Retry-After"]).toBeUndefined();
  });

  it("includes Retry-After header when not ok", () => {
    const result = {
      ok: false,
      limit: 30,
      remaining: 0,
      resetAt: 1_700_000_060_000,
      retryAfter: 42,
    };
    const headers = rateLimitHeaders(result);
    expect(headers["Retry-After"]).toBe("42");
  });
});

describe("getClientIp", () => {
  function mockRequest(headers: Record<string, string>): Request {
    return { headers: new Headers(headers) } as Request;
  }

  it("returns x-forwarded-for first entry (closest client)", () => {
    const req = mockRequest({ "x-forwarded-for": "203.0.113.1, 10.0.0.1, 10.0.0.2" });
    expect(getClientIp(req)).toBe("203.0.113.1");
  });

  it("trims whitespace from forwarded header", () => {
    const req = mockRequest({ "x-forwarded-for": "  203.0.113.1  , 10.0.0.1" });
    expect(getClientIp(req)).toBe("203.0.113.1");
  });

  it("falls back to x-real-ip", () => {
    const req = mockRequest({ "x-real-ip": "198.51.100.42" });
    expect(getClientIp(req)).toBe("198.51.100.42");
  });

  it("falls back to cf-connecting-ip", () => {
    const req = mockRequest({ "cf-connecting-ip": "198.51.100.99" });
    expect(getClientIp(req)).toBe("198.51.100.99");
  });

  it("returns unknown when no identifying header is present", () => {
    const req = mockRequest({});
    expect(getClientIp(req)).toBe("unknown");
  });

  it("prefers x-forwarded-for over real-ip", () => {
    const req = mockRequest({
      "x-forwarded-for": "203.0.113.1",
      "x-real-ip": "198.51.100.1",
    });
    expect(getClientIp(req)).toBe("203.0.113.1");
  });
});

describe("RATE_LIMITS presets", () => {
  it("sets AI at 30/min", () => {
    expect(RATE_LIMITS.ai.limit).toBe(30);
    expect(RATE_LIMITS.ai.windowMs).toBe(60_000);
  });

  it("sets auth at 5/min (tight against credential stuffing)", () => {
    expect(RATE_LIMITS.auth.limit).toBe(5);
    expect(RATE_LIMITS.auth.windowMs).toBe(60_000);
  });

  it("sets billing at 10/min", () => {
    expect(RATE_LIMITS.billing.limit).toBe(10);
  });

  it("allows webhooks at 300/min (loose, but bounded)", () => {
    expect(RATE_LIMITS.webhook.limit).toBe(300);
  });
});
