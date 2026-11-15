import { ProviderLookupError } from "@/domain/types";
import type { ShowFilters, ShowSummary } from "@/domain/types";
import type { DataProvider } from "../types";
import { TmdbClient } from "./client";
import {
  mapTmdbSeason,
  mapTmdbShowDetail,
  mapTmdbSummary,
} from "./mapper";

export function createTmdbProvider(apiKey?: string): DataProvider {
  const key = apiKey?.trim() ?? "";

  return {
    id: "tmdb",
    label: "TMDB",

    isConfigured() {
      return key.length > 0;
    },

    async searchShows(query: string, filters?: ShowFilters) {
      const client = new TmdbClient(key);
      const data = await client.searchTv(query.trim());
      const mapped = await mapSummariesWithImdb(client, data.results ?? []);
      return applyFilters(mapped, filters);
    },

    async listShows(filters?: ShowFilters) {
      if (filters?.query?.trim()) {
        return this.searchShows(filters.query, filters);
      }
      const client = new TmdbClient(key);
      const data = await client.onTheAir();
      const mapped = await mapSummariesWithImdb(client, data.results ?? []);
      return applyFilters(mapped, filters);
    },

    async getShow(imdbId: string) {
      const client = new TmdbClient(key);
      const found = await client.findByImdb(imdbId);
      const tv = found.tv_results?.[0];
      if (!tv) {
        throw new ProviderLookupError(`No TMDB series for IMDb id ${imdbId}`);
      }

      const detail = await client.tvDetail(tv.id);
      const seasonMetas = (detail.seasons ?? []).filter(
        (s) => s.season_number > 0,
      );
      const seasons = [];
      for (const meta of seasonMetas) {
        const raw = await client.season(tv.id, meta.season_number);
        seasons.push(mapTmdbSeason(raw));
      }

      const resolvedImdb = detail.external_ids?.imdb_id || imdbId;
      return mapTmdbShowDetail(detail, resolvedImdb, seasons);
    },

    async getFavorites(imdbIds: string[]) {
      const client = new TmdbClient(key);
      const out: ShowSummary[] = [];
      for (const id of imdbIds) {
        try {
          const found = await client.findByImdb(id);
          const tv = found.tv_results?.[0];
          if (!tv) continue;
          out.push(mapTmdbSummary(tv, id));
        } catch {
          // skip
        }
      }
      return out;
    },
  };
}

async function mapSummariesWithImdb(
  client: TmdbClient,
  results: import("./client").TmdbTvSummary[],
): Promise<ShowSummary[]> {
  const out: ShowSummary[] = [];
  // Limit parallel external_id lookups to keep list snappy
  const slice = results.slice(0, 20);
  await Promise.all(
    slice.map(async (item) => {
      try {
        const detail = await client.tvDetail(item.id);
        const imdb = detail.external_ids?.imdb_id;
        if (!imdb) return;
        out.push(mapTmdbSummary({ ...item, ...detail }, imdb));
      } catch {
        // skip titles without IMDb id
      }
    }),
  );
  return out;
}

function applyFilters(
  items: ShowSummary[],
  filters?: ShowFilters,
): ShowSummary[] {
  if (!filters) return items;
  let next = items;

  if (filters.year) {
    next = next.filter((s) => s.year?.startsWith(String(filters.year)));
  }
  if (filters.decade) {
    const start = filters.decade;
    const end = start + 9;
    next = next.filter((s) => {
      const y = Number.parseInt(s.year ?? "", 10);
      return Number.isFinite(y) && y >= start && y <= end;
    });
  }
  if (filters.genre) {
    const g = filters.genre.toLowerCase();
    next = next.filter((s) =>
      (s.genres ?? []).some((x) => x.toLowerCase() === g),
    );
  }
  if (filters.minVotes != null) {
    next = next.filter((s) => (s.votes ?? 0) >= (filters.minVotes ?? 0));
  }

  switch (filters.sort) {
    case "name":
      next = [...next].sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "rating":
      next = [...next].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
    case "year":
      next = [...next].sort(
        (a, b) =>
          Number.parseInt(b.year ?? "0", 10) - Number.parseInt(a.year ?? "0", 10),
      );
      break;
    default:
      break;
  }

  return next;
}
