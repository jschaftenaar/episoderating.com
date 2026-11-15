const TMDB_BASE = "https://api.themoviedb.org/3";

export interface TmdbFindResult {
  tv_results?: TmdbTvSummary[];
}

export interface TmdbTvSummary {
  id: number;
  name: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
  origin_country?: string[];
}

export interface TmdbTvDetail extends TmdbTvSummary {
  number_of_seasons?: number;
  genres?: { id: number; name: string }[];
  external_ids?: { imdb_id?: string | null };
  seasons?: {
    season_number: number;
    episode_count: number;
    name?: string;
  }[];
}

export interface TmdbEpisode {
  id: number;
  name: string;
  overview?: string;
  season_number: number;
  episode_number: number;
  air_date?: string;
  vote_average?: number;
  vote_count?: number;
  still_path?: string | null;
  external_ids?: { imdb_id?: string | null };
}

export interface TmdbSeasonDetail {
  season_number: number;
  episodes?: TmdbEpisode[];
}

export interface TmdbSearchResponse {
  results: TmdbTvSummary[];
}

export class TmdbClient {
  constructor(private readonly apiKey: string) {}

  findByImdb(imdbId: string) {
    return this.get<TmdbFindResult>(`/find/${imdbId}`, {
      external_source: "imdb_id",
    });
  }

  searchTv(query: string) {
    return this.get<TmdbSearchResponse>("/search/tv", { query });
  }

  onTheAir() {
    return this.get<TmdbSearchResponse>("/tv/on_the_air");
  }

  tvDetail(tmdbId: number) {
    return this.get<TmdbTvDetail>(`/tv/${tmdbId}`, {
      append_to_response: "external_ids",
    });
  }

  season(tmdbId: number, seasonNumber: number) {
    return this.get<TmdbSeasonDetail>(`/tv/${tmdbId}/season/${seasonNumber}`, {
      append_to_response: "external_ids",
    });
  }

  private async get<T>(
    path: string,
    params: Record<string, string> = {},
  ): Promise<T> {
    const url = new URL(`${TMDB_BASE}${path}`);
    url.searchParams.set("api_key", this.apiKey);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`TMDB HTTP ${res.status} for ${path}`);
    }
    return (await res.json()) as T;
  }
}

export function tmdbImage(
  path: string | null | undefined,
  size: "w220_and_h330_face" | "w500" | "original" = "w500",
): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
