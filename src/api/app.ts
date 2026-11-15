import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  ProviderLookupError,
  ProviderNotConfiguredError,
} from "@/domain/types";
import { isImdbId } from "@/domain/rating";
import type { CacheStore } from "@/cache";
import { cacheKey } from "@/cache";
import {
  createProviders,
  getProvider,
  listSources,
  resolveSourceId,
  type ProviderEnv,
} from "@/providers/registry";
import { getFavoriteImdbIds } from "./favorites";

export interface AppOptions {
  env: ProviderEnv;
  cache: CacheStore;
}

/** Episode ratings barely move day-to-day; prefer long TTLs over re-hitting upstream. */
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // 1 week

export function createApp({ env, cache }: AppOptions) {
  const providers = createProviders(env);
  const app = new Hono();

  app.use("/api/*", cors());

  app.get("/api/ping", (c) => c.json({ ok: true, pong: true }));

  app.get("/api/sources", (c) => c.json({ sources: listSources(providers) }));

  app.get("/api/shows", async (c) => {
    const source = resolveSourceId(c.req.query("source"));
    const provider = getProvider(providers, source);
    const filters = parseFilters(c.req.query());
    const key = cacheKey(source, "listShows", {
      q: filters.query,
      genre: filters.genre,
      year: filters.year,
      decade: filters.decade,
      sort: filters.sort,
      minVotes: filters.minVotes,
    });
    const cached = await cache.get(key);
    if (cached) return c.json(cached);

    const shows = await provider.listShows(filters);
    const body = { source, shows };
    // Only cache non-empty lists — empty often means upstream failure, not "no data".
    if (shows.length > 0) await cache.set(key, body, CACHE_TTL_SECONDS);
    return c.json(body);
  });

  app.get("/api/shows/search", async (c) => {
    const source = resolveSourceId(c.req.query("source"));
    const provider = getProvider(providers, source);
    const query = c.req.query("query")?.trim() ?? "";
    if (!query) return c.json({ source, shows: [] });

    const filters = parseFilters(c.req.query());
    const key = cacheKey(source, "searchShows", {
      q: query,
      genre: filters.genre,
      year: filters.year,
      decade: filters.decade,
      sort: filters.sort,
      minVotes: filters.minVotes,
    });
    const cached = await cache.get(key);
    if (cached) return c.json(cached);

    const shows = await provider.searchShows(query, filters);
    const body = { source, shows };
    if (shows.length > 0) await cache.set(key, body, CACHE_TTL_SECONDS);
    return c.json(body);
  });

  app.get("/api/show/:imdbId", async (c) => {
    const imdbId = c.req.param("imdbId");
    if (!isImdbId(imdbId)) {
      return c.json({ error: "Expected an IMDb id like tt0903747" }, 400);
    }
    const source = resolveSourceId(c.req.query("source"));
    const provider = getProvider(providers, source);
    const key = cacheKey(source, "getShow", { id: imdbId });
    const cached = await cache.get(key);
    if (cached) return c.json(cached);

    const show = await provider.getShow(imdbId);
    const body = { source, show };
    await cache.set(key, body, CACHE_TTL_SECONDS);
    return c.json(body);
  });

  app.get("/api/favorites", async (c) => {
    const source = resolveSourceId(c.req.query("source"));
    const provider = getProvider(providers, source);
    const ids = getFavoriteImdbIds();
    const key = cacheKey(source, "favorites", { ids: ids.join(",") });
    const cached = await cache.get(key);
    if (cached) return c.json(cached);

    const shows = await provider.getFavorites(ids);
    const body = { source, shows };
    // Don't cache empty favorites — often means a bad/unactivated key or transient failures.
    if (shows.length > 0) {
      await cache.set(key, body, CACHE_TTL_SECONDS);
    }
    return c.json(body);
  });

  app.onError((err, c) => {
    if (err instanceof ProviderNotConfiguredError) {
      return c.json(
        {
          error: err.message,
          source: err.source,
          code: "SOURCE_NOT_CONFIGURED",
        },
        503,
      );
    }
    if (err instanceof ProviderLookupError) {
      return c.json({ error: err.message, code: "LOOKUP_FAILED" }, 404);
    }
    console.error(err);
    return c.json({ error: err.message || "Internal error" }, 500);
  });

  return app;
}

function parseFilters(query: Record<string, string | undefined>) {
  return {
    query: query.query,
    genre: query.genre,
    year: query.year ? Number(query.year) : undefined,
    decade: query.decade ? Number(query.decade) : undefined,
    sort: (query.sort as "name" | "rating" | "year" | undefined) ?? undefined,
    minVotes: query.minVotes ? Number(query.minVotes) : undefined,
  };
}
