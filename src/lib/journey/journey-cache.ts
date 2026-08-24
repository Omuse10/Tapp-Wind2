// Per-journey offline cache. Structured journey data lives in IndexedDB
// (via the shared kv wrapper) so a tourist can reopen their itinerary
// with no network after loading it once online.
import { idbGet, idbSet } from "./idb";

export type CachedJourneyPayload<T> = {
  slug: string;
  cachedAt: string;
  data: T;
};

const cacheKey = (slug: string) => `journey:${slug}`;

export async function readJourneyCache<T>(slug: string): Promise<CachedJourneyPayload<T> | null> {
  const found = await idbGet<CachedJourneyPayload<T>>(cacheKey(slug));
  return found && found.slug === slug ? found : null;
}

export async function writeJourneyCache<T>(slug: string, data: T): Promise<void> {
  await idbSet(cacheKey(slug), { slug, cachedAt: new Date().toISOString(), data });
}

/** Warm the browser/service-worker cache for assets the itinerary references. */
export function prefetchJourneyAssets(urls: string[]) {
  if (typeof window === "undefined") return;
  const unique = Array.from(new Set(urls.filter((u) => /^https?:\/\//.test(u) || u.startsWith("/"))));
  for (const url of unique.slice(0, 40)) {
    void fetch(url, { mode: "no-cors", cache: "force-cache" }).catch(() => {});
  }
}
