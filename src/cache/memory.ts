import type { CacheStore } from "./types";

interface Entry {
  expiresAt: number;
  value: unknown;
}

/** Simple in-memory TTL cache (Workers / fallback). */
export function createMemoryCache(): CacheStore {
  const store = new Map<string, Entry>();

  return {
    async get<T>(key: string) {
      const hit = store.get(key);
      if (!hit) return null;
      if (Date.now() > hit.expiresAt) {
        store.delete(key);
        return null;
      }
      return hit.value as T;
    },
    async set<T>(key: string, value: T, ttlSeconds = 3600) {
      store.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
    },
  };
}
