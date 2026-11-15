import {
  averageRating,
  normalizeRating,
  pickBestWorst,
} from "@/domain/rating";
import type { Episode, Season, ShowDetail, ShowSummary } from "@/domain/types";
import {
  tmdbImage,
  type TmdbEpisode,
  type TmdbSeasonDetail,
  type TmdbTvDetail,
  type TmdbTvSummary,
} from "./client";

export function mapTmdbSummary(
  item: TmdbTvSummary,
  imdbId: string,
): ShowSummary {
  return {
    imdbId,
    title: item.name,
    year: item.first_air_date?.slice(0, 4),
    posterUrl: tmdbImage(item.poster_path, "w220_and_h330_face"),
    plot: item.overview,
    rating: normalizeRating(item.vote_average, item.vote_count),
    votes: item.vote_count ?? null,
    source: "tmdb",
  };
}

export function mapTmdbEpisode(ep: TmdbEpisode): Episode {
  return {
    imdbId: ep.external_ids?.imdb_id ?? undefined,
    season: ep.season_number,
    episode: ep.episode_number,
    title: ep.name,
    rating: normalizeRating(ep.vote_average, ep.vote_count),
    votes: ep.vote_count ?? null,
    released: ep.air_date,
    plot: ep.overview,
  };
}

export function mapTmdbSeason(raw: TmdbSeasonDetail): Season {
  const episodes = (raw.episodes ?? []).map(mapTmdbEpisode);
  return {
    seasonNumber: raw.season_number,
    episodeCount: episodes.length,
    averageRating: averageRating(episodes),
    episodes,
  };
}

export function mapTmdbShowDetail(
  detail: TmdbTvDetail,
  imdbId: string,
  seasons: Season[],
): ShowDetail {
  const { best, worst } = pickBestWorst(seasons);
  return {
    imdbId,
    title: detail.name,
    year: detail.first_air_date?.slice(0, 4),
    posterUrl: tmdbImage(detail.poster_path, "w500"),
    backdropUrl: tmdbImage(detail.backdrop_path, "original"),
    plot: detail.overview,
    genres: (detail.genres ?? []).map((g) => g.name),
    rating: normalizeRating(detail.vote_average, detail.vote_count),
    votes: detail.vote_count ?? null,
    source: "tmdb",
    totalSeasons: seasons.length,
    seasons,
    bestEpisode: best,
    worstEpisode: worst,
  };
}
