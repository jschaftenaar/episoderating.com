const OMDB_BASE = "https://www.omdbapi.com/";

export interface OmdbSearchItem {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

export interface OmdbSearchResponse {
  Search?: OmdbSearchItem[];
  totalResults?: string;
  Response: string;
  Error?: string;
}

export interface OmdbTitleResponse {
  Title: string;
  Year: string;
  Rated?: string;
  Released?: string;
  Runtime?: string;
  Genre?: string;
  Plot?: string;
  Poster?: string;
  imdbRating?: string;
  imdbVotes?: string;
  imdbID: string;
  Type?: string;
  totalSeasons?: string;
  Response: string;
  Error?: string;
}

export interface OmdbSeasonEpisode {
  Title: string;
  Released?: string;
  Episode: string;
  imdbRating?: string;
  imdbID?: string;
}

export interface OmdbSeasonResponse {
  Title: string;
  Season: string;
  totalSeasons?: string;
  Episodes?: OmdbSeasonEpisode[];
  Response: string;
  Error?: string;
}

export class OmdbClient {
  constructor(private readonly apiKey: string) {}

  async search(query: string, page = 1): Promise<OmdbSearchResponse> {
    return this.get<OmdbSearchResponse>({
      s: query,
      type: "series",
      page: String(page),
    });
  }

  async byId(imdbId: string, plot: "short" | "full" = "full"): Promise<OmdbTitleResponse> {
    return this.get<OmdbTitleResponse>({ i: imdbId, plot });
  }

  async season(imdbId: string, season: number): Promise<OmdbSeasonResponse> {
    return this.get<OmdbSeasonResponse>({
      i: imdbId,
      Season: String(season),
    });
  }

  private async get<T>(params: Record<string, string>): Promise<T> {
    const url = new URL(OMDB_BASE);
    url.searchParams.set("apikey", this.apiKey);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`OMDb HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  }
}
