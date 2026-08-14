/**
 * Lightweight localStorage cache with TTL + stale-while-revalidate.
 * Used to make pages open instantly from cache while fresh data loads
 * in the background, and to refresh the cache periodically.
 */

const PREFIX = "nova:cache:";
const VERSION = "v1";

type Entry<T> = { v: string; t: number; d: T };

const now = () => Date.now();

export function readCache<T>(key: string, maxAgeMs = 5 * 60 * 1000): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry<T>;
    if (entry.v !== VERSION) return null;
    if (now() - entry.t > maxAgeMs) return null;
    return entry.d;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ v: VERSION, t: now(), d: data } as Entry<T>));
  } catch {
    // quota exceeded -> drop the oldest entries and retry once
    pruneCache(0.5);
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify({ v: VERSION, t: now(), d: data } as Entry<T>));
    } catch {
      /* ignore */
    }
  }
}

export function clearCache(prefix = "") {
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(PREFIX + prefix)) localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}

/** Remove a fraction of the oldest cache entries. */
export function pruneCache(fraction = 0.3) {
  try {
    const items: { k: string; t: number }[] = [];
    for (const k of Object.keys(localStorage)) {
      if (!k.startsWith(PREFIX)) continue;
      try {
        items.push({ k, t: (JSON.parse(localStorage.getItem(k) as string) as Entry<unknown>).t ?? 0 });
      } catch {
        localStorage.removeItem(k);
      }
    }
    items.sort((a, b) => a.t - b.t);
    for (const it of items.slice(0, Math.ceil(items.length * fraction))) localStorage.removeItem(it.k);
  } catch {
    /* ignore */
  }
}

/**
 * Stale-while-revalidate fetcher: returns cached data immediately (if any)
 * through `onData`, then refreshes from the network and updates the cache.
 */
export async function swr<T>(
  key: string,
  fetcher: () => Promise<T>,
  onData: (data: T, fromCache: boolean) => void,
  maxAgeMs = 5 * 60 * 1000,
): Promise<void> {
  const cached = readCache<T>(key, maxAgeMs);
  if (cached !== null) onData(cached, true);
  try {
    const fresh = await fetcher();
    writeCache(key, fresh);
    onData(fresh, false);
  } catch {
    /* keep cached value */
  }
}
