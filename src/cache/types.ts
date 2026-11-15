export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
}

export function cacheKey(
  source: string,
  operation: string,
  parts: Record<string, string | number | undefined | null> = {},
): string {
  const flat = Object.entries(parts)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("&");
  return `${source}:${operation}:${flat}`;
}
