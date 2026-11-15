/** Canonical show id is always an IMDb id: tt######## */
export type ImdbId = string;

export type DataSourceId = "omdb" | "tmdb" | (string & {});

export interface DataSourceInfo {
  id: DataSourceId;
  label: string;
  configured: boolean;
  isDefault?: boolean;
}

export interface ShowFilters {
  query?: string;
  genre?: string;
  year?: number;
  decade?: number;
  sort?: "name" | "rating" | "year";
  minVotes?: number;
}

export interface ShowSummary {
  imdbId: ImdbId;
  title: string;
  year?: string;
  posterUrl?: string | null;
  plot?: string;
  genres?: string[];
  rating?: number | null;
  votes?: number | null;
  source: DataSourceId;
}

export interface Episode {
  imdbId?: ImdbId;
  season: number;
  episode: number;
  title: string;
  rating: number | null;
  votes: number | null;
  released?: string;
  plot?: string;
}

export interface Season {
  seasonNumber: number;
  episodeCount: number;
  averageRating: number | null;
  episodes: Episode[];
}

export interface ShowDetail extends ShowSummary {
  backdropUrl?: string | null;
  totalSeasons: number;
  seasons: Season[];
  bestEpisode?: Episode | null;
  worstEpisode?: Episode | null;
}

export class ProviderNotConfiguredError extends Error {
  readonly source: DataSourceId;

  constructor(source: DataSourceId) {
    super(`Data source "${source}" is not configured (missing API key).`);
    this.name = "ProviderNotConfiguredError";
    this.source = source;
  }
}

export class ProviderLookupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderLookupError";
  }
}
