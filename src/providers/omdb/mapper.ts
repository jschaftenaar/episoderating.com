import {
  averageRating,
  normalizeRating,
  pickBestWorst,
} from "@/domain/rating";
import type { Episode, Season, ShowDetail, ShowSummary } from "@/domain/types";
import type {
  OmdbSearchItem,
  OmdbSeasonEpisode,
  OmdbSeasonResponse,
  OmdbTitleResponse,
} from "./client";

function parseRating(value?: string): number | null {
  if (!value || value === "N/A") return null;
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return null;
  return normalizeRating(n);
}

function parseVotes(value?: string): number | null {
  if (!value || value === "N/A") return null;
  const n = Number.parseInt(value.replace(/,/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

function poster(url?: string): string | null {
  if (!url || url === "N/A") return null;
  return url;
}

export function mapOmdbSearchItem(item: OmdbSearchItem): ShowSummary {
  return {
    imdbId: item.imdbID,
    title: item.Title,
    year: item.Year,
    posterUrl: poster(item.Poster),
    source: "omdb",
  };
}

export function mapOmdbEpisode(
  seasonNumber: number,
  ep: OmdbSeasonEpisode,
): Episode {
  return {
    imdbId: ep.imdbID,
    season: seasonNumber,
    episode: Number.parseInt(ep.Episode, 10) || 0,
    title: ep.Title,
    rating: parseRating(ep.imdbRating),
    votes: null,
    released: ep.Released === "N/A" ? undefined : ep.Released,
  };
}

export function mapOmdbSeason(raw: OmdbSeasonResponse): Season {
  const seasonNumber = Number.parseInt(raw.Season, 10) || 0;
  const episodes = (raw.Episodes ?? []).map((ep) =>
    mapOmdbEpisode(seasonNumber, ep),
  );
  return {
    seasonNumber,
    episodeCount: episodes.length,
    averageRating: averageRating(episodes),
    episodes,
  };
}

export function mapOmdbShowDetail(
  title: OmdbTitleResponse,
  seasons: Season[],
): ShowDetail {
  const { best, worst } = pickBestWorst(seasons);
  return {
    imdbId: title.imdbID,
    title: title.Title,
    year: title.Year,
    posterUrl: poster(title.Poster),
    // OMDb has no wide backdrop — leave null so the UI can treat poster as a poster-hero.
    backdropUrl: null,
    plot: title.Plot === "N/A" ? undefined : title.Plot,
    genres: title.Genre && title.Genre !== "N/A"
      ? title.Genre.split(",").map((g) => g.trim())
      : [],
    rating: parseRating(title.imdbRating),
    votes: parseVotes(title.imdbVotes),
    source: "omdb",
    totalSeasons: seasons.length,
    seasons,
    bestEpisode: best,
    worstEpisode: worst,
  };
}
