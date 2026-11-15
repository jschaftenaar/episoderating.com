import favorites from "../../config/favorites.json";

export function getFavoriteImdbIds(): string[] {
  return favorites.imdbIds ?? [];
}
