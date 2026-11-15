import { describe, expect, it } from "vitest";
import { mapOmdbSearchItem, mapOmdbSeason } from "@/providers/omdb/mapper";

describe("omdb mapper", () => {
  it("maps search hits", () => {
    const show = mapOmdbSearchItem({
      Title: "Breaking Bad",
      Year: "2008–2013",
      imdbID: "tt0903747",
      Type: "series",
      Poster: "https://example.com/poster.jpg",
    });
    expect(show.imdbId).toBe("tt0903747");
    expect(show.source).toBe("omdb");
    expect(show.posterUrl).toContain("poster.jpg");
  });

  it("maps seasons and averages", () => {
    const season = mapOmdbSeason({
      Title: "Breaking Bad",
      Season: "1",
      Response: "True",
      Episodes: [
        {
          Title: "Pilot",
          Episode: "1",
          imdbRating: "8.9",
          imdbID: "tt0959621",
        },
        {
          Title: "Cat's in the Bag...",
          Episode: "2",
          imdbRating: "8.7",
          imdbID: "tt1054724",
        },
      ],
    });
    expect(season.seasonNumber).toBe(1);
    expect(season.episodes).toHaveLength(2);
    expect(season.averageRating).toBe(8.8);
  });
});
