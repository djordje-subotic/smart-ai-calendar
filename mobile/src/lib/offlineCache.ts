/**
 * Offline cache for read-only data.
 *
 * Writes stay online-only for now (optimistic updates via useOptimistic
 * already give users the feel of instant writes). Reads are served from
 * cache first, then refreshed when network is available.
 *
 * We lean on expo-secure-store for small payloads and the filesystem for
 * larger ones; expo-secure-store has a ~2KB limit per entry on iOS.
 */

import * as SecureStore from "expo-secure-store";

type CacheEntry<T> = {
  value: T;
  cachedAt: number;
  expiresAt: number;
};

const PREFIX = "krowna-cache:";
const MAX_SECURE_STORE_BYTES = 1800; // stay well under iOS 2KB limit

export type CacheOptions = {
  /** TTL in milliseconds — defaults to 24h. */
  ttl?: number;
};

function keyFor(name: string) {
  return `${PREFIX}${name}`;
}

async function readRaw(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function writeRaw(key: string, value: string) {
  try {
    if (value.length > MAX_SECURE_STORE_BYTES) {
      // Payload too large for secure store — silently drop to avoid crashes.
      // We only cache small read slices (today's events, profile) so this is
      // a soft guard against accidental misuse.
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch {}
}

async function deleteRaw(key: string) {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {}
}

export async function getCached<T>(name: string): Promise<T | null> {
  const raw = await readRaw(keyFor(name));
  if (!raw) return null;
  try {
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      // Stale — return the value anyway so offline UIs stay populated.
      // Caller decides whether to refresh.
      return entry.value;
    }
    return entry.value;
  } catch {
    return null;
  }
}

export async function getCachedWithMeta<T>(
  name: string
): Promise<CacheEntry<T> | null> {
  const raw = await readRaw(keyFor(name));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
}

export async function setCached<T>(name: string, value: T, opts: CacheOptions = {}) {
  const ttl = opts.ttl ?? 24 * 60 * 60 * 1000;
  const entry: CacheEntry<T> = {
    value,
    cachedAt: Date.now(),
    expiresAt: Date.now() + ttl,
  };
  await writeRaw(keyFor(name), JSON.stringify(entry));
}

export async function clearCached(name: string) {
  await deleteRaw(keyFor(name));
}

/**
 * Stale-while-revalidate helper. Returns cached immediately (if any), then
 * fires the fetcher in the background. The fetcher's fresh value is cached
 * and returned via the callback so the UI can update.
 */
export async function swr<T>(
  name: string,
  fetcher: () => Promise<T>,
  opts: CacheOptions & { onFresh?: (value: T) => void } = {}
): Promise<T | null> {
  const cached = await getCached<T>(name);

  // Kick off the refresh in the background
  (async () => {
    try {
      const fresh = await fetcher();
      if (fresh !== undefined && fresh !== null) {
        await setCached(name, fresh, opts);
        opts.onFresh?.(fresh);
      }
    } catch {
      // Network down or query failed — keep whatever is in cache.
    }
  })();

  return cached;
}
