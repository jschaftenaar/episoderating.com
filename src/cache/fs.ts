import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CacheStore } from "./types";

interface DiskEntry {
  expiresAt: number;
  value: unknown;
}

/** Filesystem cache for Docker / Node self-host. */
export function createFsCache(dir = "./cache"): CacheStore {
  const ready = mkdir(dir, { recursive: true });

  function fileFor(key: string) {
    const hash = createHash("md5").update(key).digest("hex");
    return path.join(dir, `${hash}.json`);
  }

  return {
    async get<T>(key: string) {
      await ready;
      try {
        const raw = await readFile(fileFor(key), "utf8");
        const entry = JSON.parse(raw) as DiskEntry;
        if (Date.now() > entry.expiresAt) return null;
        return entry.value as T;
      } catch {
        return null;
      }
    },
    async set<T>(key: string, value: T, ttlSeconds = 3600) {
      await ready;
      const entry: DiskEntry = {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
      };
      await writeFile(fileFor(key), JSON.stringify(entry), "utf8");
    },
  };
}
