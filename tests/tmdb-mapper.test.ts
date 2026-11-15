import { describe, expect, it } from "vitest";
import { mapTmdbSeason, mapTmdbSummary } from "@/providers/tmdb/mapper";

describe("tmdb mapper", () => {
  it("maps summaries with imdb id", () => {
    const show = mapTmdbSummary(
      {
        id: 1396,
        name: "Breaking Bad",
        first_air_date: "2008-01-20",
        poster_path: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
        vote_average: 8.9,
        vote_count: 10000,
      },
      "tt0903747",
    );
    expect(show.imdbId).toBe("tt0903747");
    expect(show.source).toBe("tmdb");
    expect(show.posterUrl).toContain("/ggFHVNu6YYI5L9pCfOacjizRGt.jpg");
  });

  it("maps season episodes", () => {
    const season = mapTmdbSeason({
      season_number: 1,
      episodes: [
        {
          id: 1,
          name: "Pilot",
          season_number: 1,
          episode_number: 1,
          vote_average: 8.9,
          vote_count: 200,
        },
      ],
    });
    expect(season.episodes[0].rating).toBe(8.9);
    expect(season.averageRating).toBe(8.9);
  });
});
