import type { DataSourceId } from "@/domain/types";
import { DEFAULT_SOURCE } from "@/providers/registry";

const STORAGE_KEY = "episoderating:source";

export function readStoredSource(): DataSourceId {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value) return value;
  } catch {
    // ignore
  }
  return DEFAULT_SOURCE;
}

export function storeSource(source: DataSourceId) {
  try {
    localStorage.setItem(STORAGE_KEY, source);
  } catch {
    // ignore
  }
}
