import type { DataSourceId, DataSourceInfo } from "@/domain/types";
import {
  ProviderLookupError,
  ProviderNotConfiguredError,
} from "@/domain/types";
import type { DataProvider } from "./types";
import { createOmdbProvider } from "./omdb";
import { createTmdbProvider } from "./tmdb";

const DEFAULT_SOURCE: DataSourceId = "omdb";

export interface ProviderEnv {
  OMDB_API_KEY?: string;
  TMDB_API_KEY?: string;
}

export function createProviders(env: ProviderEnv): Map<DataSourceId, DataProvider> {
  const providers: DataProvider[] = [
    createOmdbProvider(env.OMDB_API_KEY),
    createTmdbProvider(env.TMDB_API_KEY),
  ];
  return new Map(providers.map((p) => [p.id, p]));
}

export function listSources(
  providers: Map<DataSourceId, DataProvider>,
): DataSourceInfo[] {
  return [...providers.values()].map((p) => ({
    id: p.id,
    label: p.label,
    configured: p.isConfigured(),
    isDefault: p.id === DEFAULT_SOURCE,
  }));
}

export function resolveSourceId(
  requested: string | undefined | null,
): DataSourceId {
  if (!requested || requested.trim() === "") return DEFAULT_SOURCE;
  return requested.trim().toLowerCase();
}

export function getProvider(
  providers: Map<DataSourceId, DataProvider>,
  sourceId: string | undefined | null,
): DataProvider {
  const id = resolveSourceId(sourceId);
  const provider = providers.get(id);
  if (!provider) {
    throw new ProviderLookupError(`Unknown data source "${id}".`);
  }
  if (!provider.isConfigured()) {
    throw new ProviderNotConfiguredError(id);
  }
  return provider;
}

export { DEFAULT_SOURCE };
