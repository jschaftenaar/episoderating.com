import { ProviderLookupError } from "@/domain/types";
import type { ShowFilters, ShowSummary } from "@/domain/types";
import type { DataProvider } from "../types";
import { OmdbClient } from "./client";
import { mapOmdbSearchItem, mapOmdbSeason, mapOmdbShowDetail } from "./mapper";

/** Seed catalog when the user has not searched yet (OMDb has no “on the air”). */
const BROWSE_SEEDS = [
  "Breaking Bad",
  "Game of Thrones",
  "The Office",
  "Stranger Things",
  "The Mandalorian",
  "Better Call Saul",
  "The Expanse",
  "Ted Lasso",
  "Succession",
  "Dark",
  "Sherlock",
  "Friends",
];

export function createOmdbProvider(apiKey?: string): DataProvider {
  const key = apiKey?.trim() ?? "";

  return {
    id: "omdb",
    label: "OMDb (IMDb ratings)",

    isConfigured() {
      return key.length > 0;
    },

    async searchShows(query: string, filters?: ShowFilters) {
      const client = new OmdbClient(key);
      const data = await client.search(query.trim());
      if (data.Response === "False") return [];
      let results = (data.Search ?? []).map(mapOmdbSearchItem);
      results = applyFilters(results, filters);
      return results;
    },

    async listShows(filters?: ShowFilters) {
      if (filters?.query?.trim()) {
        return this.searchShows(filters.query, filters);
      }
      const client = new OmdbClient(key);
      const collected: ShowSummary[] = [];
      const seen = new Set<string>();

      for (const seed of BROWSE_SEEDS) {
        const data = await client.search(seed);
        for (const item of data.Search ?? []) {
          if (seen.has(item.imdbID)) continue;
          seen.add(item.imdbID);
          collected.push(mapOmdbSearchItem(item));
        }
      }

      return applyFilters(collected, filters);
    },

    async getShow(imdbId: string) {
      const client = new OmdbClient(key);
      const title = await client.byId(imdbId);
      if (title.Response === "False") {
        throw new ProviderLookupError(title.Error ?? `Show ${imdbId} not found`);
      }

      const totalSeasons = Number.parseInt(title.totalSeasons ?? "0", 10) || 0;
      const seasons = [];
      for (let n = 1; n <= totalSeasons; n++) {
        const raw = await client.season(imdbId, n);
        if (raw.Response === "False") continue;
        seasons.push(mapOmdbSeason(raw));
      }

      return mapOmdbShowDetail(title, seasons);
    },

    async getFavorites(imdbIds: string[]) {
      const client = new OmdbClient(key);
      const out: ShowSummary[] = [];
      for (const id of imdbIds) {
        try {
          const title = await client.byId(id, "short");
          if (title.Response === "False") continue;
          out.push({
            imdbId: title.imdbID,
            title: title.Title,
            year: title.Year,
            posterUrl:
              title.Poster && title.Poster !== "N/A" ? title.Poster : null,
            plot: title.Plot === "N/A" ? undefined : title.Plot,
            rating:
              title.imdbRating && title.imdbRating !== "N/A"
                ? Number.parseFloat(title.imdbRating)
                : null,
            source: "omdb",
          });
        } catch {
          // skip missing favorites
        }
      }
      return out;
    },
  };
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
