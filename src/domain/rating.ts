import type { Episode, Season } from "./types";

export type RatingBand =
  | "excellent"
  | "good"
  | "above-average"
  | "below-average"
  | "poor"
  | "terrible"
  | "none";

/**
 * APIs often send 0 for "unrated" (especially TMDB). Treat that as missing.
 */
export function normalizeRating(
  rating: number | null | undefined,
  votes?: number | null,
): number | null {
  if (rating == null || Number.isNaN(rating) || rating <= 0) return null;
  if (votes != null && votes <= 0) return null;
  return Number(rating.toFixed(1));
}

export function ratingBand(rating: number | null | undefined): RatingBand {
  const value = normalizeRating(rating);
  if (value == null) return "none";
  if (value > 9) return "excellent";
  if (value > 8) return "good";
  if (value > 7) return "above-average";
  if (value > 6) return "below-average";
  if (value > 5) return "poor";
  return "terrible";
}

export function maxEpisodeNumber(seasons: Season[]): number {
  let highest = 0;
  for (const season of seasons) {
    highest = Math.max(highest, season.episodeCount, season.episodes.length);
  }
  return highest;
}

export function averageRating(episodes: Episode[], minVotes = 0): number | null {
  const usable = episodes.filter(
    (ep) => ep.rating != null && (ep.votes ?? 0) >= minVotes,
  );
  if (!usable.length) return null;
  const sum = usable.reduce((acc, ep) => acc + (ep.rating as number), 0);
  return Number((sum / usable.length).toFixed(2));
}

export function pickBestWorst(
  seasons: Season[],
  minVotes = 0,
): { best: Episode | null; worst: Episode | null } {
  let best: Episode | null = null;
  let worst: Episode | null = null;

  for (const season of seasons) {
    for (const ep of season.episodes) {
      if (ep.rating == null) continue;
      if ((ep.votes ?? 0) < minVotes) continue;
      if (!best || ep.rating > (best.rating ?? -Infinity)) best = ep;
      if (!worst || ep.rating < (worst.rating ?? Infinity)) worst = ep;
    }
  }

  return { best, worst };
}

export function isImdbId(value: string): boolean {
  return /^tt\d+$/i.test(value.trim());
}

/**
 * Derive a confidence floor from a show's own vote distribution.
 * Episodes far below typical vote counts get de-emphasized.
 * Returns 0 when vote data is missing (e.g. OMDb seasons).
 */
export function autoMinVotes(seasons: Season[]): number {
  const votes = seasons
    .flatMap((season) => season.episodes)
    .map((ep) => ep.votes)
    .filter((v): v is number => typeof v === "number" && v > 0)
    .sort((a, b) => a - b);

  if (votes.length < 3) return 0;

  const median = votes[Math.floor(votes.length / 2)] ?? 0;
  // About a quarter of the median, with a small absolute floor.
  return Math.max(5, Math.round(median * 0.25));
}
