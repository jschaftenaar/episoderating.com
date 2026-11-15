const KEY = "episoderating:recent";
const LIMIT = 12;

export interface RecentShow {
  imdbId: string;
  title: string;
  posterUrl?: string | null;
}

export function readRecent(): RecentShow[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentShow[];
  } catch {
    return [];
  }
}

export function pushRecent(show: RecentShow) {
  const next = [
    show,
    ...readRecent().filter((s) => s.imdbId !== show.imdbId),
  ].slice(0, LIMIT);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}
