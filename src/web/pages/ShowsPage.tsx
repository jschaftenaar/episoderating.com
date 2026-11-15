import { useEffect, useMemo, useState } from "react";
import type { ShowSummary } from "@/domain/types";
import { fetchShows } from "../lib/api";
import { useSource } from "../components/SourceProvider";
import { ShowGrid } from "../components/ShowGrid";

export function ShowsPage() {
  const { source } = useSource();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [genre, setGenre] = useState("");
  const [decade, setDecade] = useState("");
  const [sort, setSort] = useState<"name" | "rating" | "year" | "">("");
  const [minVotes, setMinVotes] = useState("");
  const [shows, setShows] = useState<ShowSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 350);
    return () => window.clearTimeout(t);
  }, [query]);

  const filters = useMemo(
    () => ({
      query: debounced || undefined,
      genre: genre || undefined,
      decade: decade ? Number(decade) : undefined,
      sort: sort || undefined,
      minVotes: minVotes ? Number(minVotes) : undefined,
    }),
    [debounced, genre, decade, sort, minVotes],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchShows(source, filters)
      .then((data) => {
        if (!cancelled) setShows(data.shows);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [source, filters]);

  function clearFilters() {
    setQuery("");
    setGenre("");
    setDecade("");
    setSort("");
    setMinVotes("");
  }

  return (
    <div className="page shows-page">
      <header className="page-header">
        <h1>Shows</h1>
        <p className="muted">Search and filter by the active data source.</p>
      </header>

      <form
        className="filters"
        onSubmit={(e) => e.preventDefault()}
        aria-label="Show filters"
      >
        <label>
          Title
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles…"
          />
        </label>
        <label>
          Genre
          <input
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="e.g. Drama"
          />
        </label>
        <label>
          Decade
          <select value={decade} onChange={(e) => setDecade(e.target.value)}>
            <option value="">Any</option>
            <option value="2020">2020s</option>
            <option value="2010">2010s</option>
            <option value="2000">2000s</option>
            <option value="1990">1990s</option>
            <option value="1980">1980s</option>
          </select>
        </label>
        <label>
          Sort
          <select
            value={sort}
            onChange={(e) =>
              setSort(e.target.value as "name" | "rating" | "year" | "")
            }
          >
            <option value="">Default</option>
            <option value="name">Name</option>
            <option value="rating">Rating</option>
            <option value="year">Year</option>
          </select>
        </label>
        <label>
          Min votes
          <input
            type="number"
            min={0}
            value={minVotes}
            onChange={(e) => setMinVotes(e.target.value)}
            placeholder="0"
          />
        </label>
        <button type="button" className="btn btn--ghost" onClick={clearFilters}>
          Clear
        </button>
      </form>

      {loading ? <p className="muted">Loading…</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {!loading && !error ? <ShowGrid shows={shows} /> : null}
    </div>
  );
}
