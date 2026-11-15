import { describe, expect, it } from "vitest";
import {
  autoMinVotes,
  averageRating,
  isImdbId,
  maxEpisodeNumber,
  normalizeRating,
  pickBestWorst,
  ratingBand,
} from "@/domain/rating";
import type { Season } from "@/domain/types";

const seasons: Season[] = [
  {
    seasonNumber: 1,
    episodeCount: 2,
    averageRating: 8.5,
    episodes: [
      {
        season: 1,
        episode: 1,
        title: "Pilot",
        rating: 8.0,
        votes: 100,
      },
      {
        season: 1,
        episode: 2,
        title: "Better",
        rating: 9.2,
        votes: 200,
      },
    ],
  },
];

describe("rating helpers", () => {
  it("maps rating bands", () => {
    expect(ratingBand(9.5)).toBe("excellent");
    expect(ratingBand(8.5)).toBe("good");
    expect(ratingBand(7.5)).toBe("above-average");
    expect(ratingBand(6.5)).toBe("below-average");
    expect(ratingBand(5.5)).toBe("poor");
    expect(ratingBand(4)).toBe("terrible");
    expect(ratingBand(null)).toBe("none");
    expect(ratingBand(0)).toBe("none");
  });

  it("treats zero / unvoted scores as missing", () => {
    expect(normalizeRating(0)).toBeNull();
    expect(normalizeRating(7.8, 0)).toBeNull();
    expect(normalizeRating(7.84, 12)).toBe(7.8);
  });

  it("computes max episode number", () => {
    expect(maxEpisodeNumber(seasons)).toBe(2);
  });

  it("averages ratings with min votes", () => {
    expect(averageRating(seasons[0].episodes)).toBe(8.6);
    expect(averageRating(seasons[0].episodes, 150)).toBe(9.2);
  });

  it("picks best and worst", () => {
    const { best, worst } = pickBestWorst(seasons);
    expect(best?.title).toBe("Better");
    expect(worst?.title).toBe("Pilot");
  });

  it("validates imdb ids", () => {
    expect(isImdbId("tt0903747")).toBe(true);
    expect(isImdbId("1396")).toBe(false);
  });

  it("derives an automatic vote floor from the show", () => {
    const rich: Season[] = [
      {
        seasonNumber: 1,
        episodeCount: 4,
        averageRating: 8,
        episodes: [
          { season: 1, episode: 1, title: "a", rating: 8, votes: 100 },
          { season: 1, episode: 2, title: "b", rating: 8, votes: 200 },
          { season: 1, episode: 3, title: "c", rating: 8, votes: 400 },
          { season: 1, episode: 4, title: "d", rating: 8, votes: 40 },
        ],
      },
    ];
    expect(autoMinVotes(rich)).toBe(50); // median 200 → 25%
    expect(autoMinVotes(seasons)).toBe(0); // too few vote samples
  });
});
