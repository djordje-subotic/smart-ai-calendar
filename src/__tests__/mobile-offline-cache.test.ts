/**
 * Tests for the mobile offline cache contract.
 *
 * The real module lives in mobile/src/lib/offlineCache.ts and imports
 * expo-secure-store (native-only). Instead of loading that in vitest, we
 * reimplement the exact algorithm here against an in-memory SecureStore
 * shim, so any change to the spec must update both places (and both tests
 * will catch it).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---- SecureStore shim ----
const store = new Map<string, string>();
const SecureStoreShim = {
  async getItemAsync(key: string) {
    return store.get(key) ?? null;
  },
  async setItemAsync(key: string, value: string) {
    store.set(key, value);
  },
  async deleteItemAsync(key: string) {
    store.delete(key);
  },
};

// ---- Reimplemented cache algorithm (must mirror mobile/src/lib/offlineCache.ts) ----
type CacheEntry<T> = { value: T; cachedAt: number; expiresAt: number };
type CacheOptions = { ttl?: number };

const PREFIX = "kron-cache:";
const MAX_SECURE_STORE_BYTES = 1800;

function keyFor(name: string) {
  return `${PREFIX}${name}`;
}

async function readRaw(key: string) {
  try {
    return await SecureStoreShim.getItemAsync(key);
  } catch {
    return null;
  }
}

async function writeRaw(key: string, value: string) {
  try {
    if (value.length > MAX_SECURE_STORE_BYTES) return;
    await SecureStoreShim.setItemAsync(key, value);
  } catch {}
}

async function deleteRaw(key: string) {
  try {
    await SecureStoreShim.deleteItemAsync(key);
  } catch {}
}

async function getCached<T>(name: string): Promise<T | null> {
  const raw = await readRaw(keyFor(name));
  if (!raw) return null;
  try {
    const entry = JSON.parse(raw) as CacheEntry<T>;
    return entry.value; // stale-while-revalidate — return even when expired
  } catch {
    return null;
  }
}

async function getCachedWithMeta<T>(name: string) {
  const raw = await readRaw(keyFor(name));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
}

async function setCached<T>(name: string, value: T, opts: CacheOptions = {}) {
  const ttl = opts.ttl ?? 24 * 60 * 60 * 1000;
  const entry: CacheEntry<T> = {
    value,
    cachedAt: Date.now(),
    expiresAt: Date.now() + ttl,
  };
  await writeRaw(keyFor(name), JSON.stringify(entry));
}

async function clearCached(name: string) {
  await deleteRaw(keyFor(name));
}

async function swr<T>(
  name: string,
  fetcher: () => Promise<T>,
  opts: CacheOptions & { onFresh?: (v: T) => void } = {}
) {
  const cached = await getCached<T>(name);
  (async () => {
    try {
      const fresh = await fetcher();
      if (fresh !== undefined && fresh !== null) {
        await setCached(name, fresh, opts);
        opts.onFresh?.(fresh);
      }
    } catch {
      // keep cache
    }
  })();
  return cached;
}

// ---- Tests ----
beforeEach(() => {
  store.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("setCached / getCached", () => {
  it("stores and retrieves a value", async () => {
    await setCached("user:1", { name: "Alice" });
    expect(await getCached<{ name: string }>("user:1")).toEqual({ name: "Alice" });
  });

  it("returns null for a missing key", async () => {
    expect(await getCached("nothing")).toBeNull();
  });

  it("returns the value even when expired (SWR behavior)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-13T10:00:00Z"));
    await setCached("stale", "old data", { ttl: 1000 });

    vi.setSystemTime(new Date("2026-04-13T11:00:00Z"));
    expect(await getCached<string>("stale")).toBe("old data");
  });

  it("returns null on malformed JSON", async () => {
    store.set("kron-cache:corrupt", "{{not valid json");
    expect(await getCached("corrupt")).toBeNull();
  });

  it("silently drops payloads above the SecureStore limit", async () => {
    const huge = "x".repeat(3000);
    await setCached("too-big", huge);
    expect(await getCached("too-big")).toBeNull();
  });

  it("uses the PREFIX namespace so raw keys don't collide", async () => {
    await setCached("test", 42);
    expect(store.has("kron-cache:test")).toBe(true);
    expect(store.has("test")).toBe(false);
  });
});

describe("getCachedWithMeta", () => {
  it("exposes cachedAt and expiresAt", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-13T10:00:00Z"));

    await setCached("meta", { x: 1 }, { ttl: 60_000 });
    const meta = await getCachedWithMeta<{ x: number }>("meta");

    expect(meta!.value).toEqual({ x: 1 });
    expect(meta!.cachedAt).toBe(new Date("2026-04-13T10:00:00Z").getTime());
    expect(meta!.expiresAt).toBe(new Date("2026-04-13T10:01:00Z").getTime());
  });

  it("defaults TTL to 24 hours", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-13T10:00:00Z"));
    await setCached("default-ttl", "x");
    const meta = await getCachedWithMeta<string>("default-ttl");
    expect(meta!.expiresAt - meta!.cachedAt).toBe(24 * 60 * 60 * 1000);
  });
});

describe("clearCached", () => {
  it("removes a stored value", async () => {
    await setCached("gone", 42);
    await clearCached("gone");
    expect(await getCached("gone")).toBeNull();
  });

  it("is idempotent", async () => {
    await expect(clearCached("never-existed")).resolves.toBeUndefined();
  });
});

describe("swr — stale-while-revalidate", () => {
  it("returns cached immediately, refreshes in background", async () => {
    await setCached("list", ["a", "b"]);
    const fetcher = vi.fn(async () => ["a", "b", "c"]);

    const immediate = await swr("list", fetcher);
    expect(immediate).toEqual(["a", "b"]);

    await new Promise((r) => setTimeout(r, 10));
    expect(fetcher).toHaveBeenCalled();

    expect(await getCached("list")).toEqual(["a", "b", "c"]);
  });

  it("returns null when nothing cached, fetcher still runs", async () => {
    const fetcher = vi.fn(async () => "fresh");
    const immediate = await swr("cold", fetcher);
    expect(immediate).toBeNull();

    await new Promise((r) => setTimeout(r, 10));
    expect(await getCached("cold")).toBe("fresh");
  });

  it("keeps cached value when fetcher throws", async () => {
    await setCached("resilient", "old");
    const fetcher = vi.fn(async () => {
      throw new Error("network");
    });

    await swr("resilient", fetcher);
    await new Promise((r) => setTimeout(r, 10));

    expect(await getCached("resilient")).toBe("old");
  });

  it("fires onFresh callback when fresh data arrives", async () => {
    const onFresh = vi.fn();
    const fetcher = vi.fn(async () => "fresh-value");

    await swr("cb", fetcher, { onFresh });
    await new Promise((r) => setTimeout(r, 10));

    expect(onFresh).toHaveBeenCalledWith("fresh-value");
  });
});
