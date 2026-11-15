import { useEffect, useId, useState } from "react";
import type { ShowSummary } from "@/domain/types";
import { isImdbId } from "@/domain/rating";
import { fetchShow, fetchShows } from "../lib/api";
import { useSource } from "./SourceProvider";

interface ShowPickerProps {
  label: string;
  selected: ShowSummary | null;
  onSelect: (show: ShowSummary | null) => void;
  suggestions?: ShowSummary[];
}

export function ShowPicker({
  label,
  selected,
  onSelect,
  suggestions = [],
}: ShowPickerProps) {
  const { source } = useSource();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<ShowSummary[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debounced || selected) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    fetchShows(source, { query: debounced })
      .then((data) => {
        if (!cancelled) setResults(data.shows.slice(0, 8));
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, source, selected]);

  function pick(show: ShowSummary) {
    onSelect(show);
    setQuery("");
    setResults([]);
  }

  async function tryImdbId() {
    const q = query.trim();
    if (!isImdbId(q)) return;
    setSearching(true);
    try {
      const data = await fetchShow(q, source);
      pick({
        imdbId: data.show.imdbId,
        title: data.show.title,
        year: data.show.year,
        posterUrl: data.show.posterUrl,
        rating: data.show.rating,
        source: data.show.source,
      });
    } catch {
      // leave search results empty
    } finally {
      setSearching(false);
    }
  }

  if (selected) {
    return (
      <div className="show-picker">
        <span className="show-picker__label">{label}</span>
        <div className="show-picker__selected">
          {selected.posterUrl ? (
            <img src={selected.posterUrl} alt="" />
          ) : (
            <div className="show-picker__ph" aria-hidden>
              {selected.title.slice(0, 1)}
            </div>
          )}
          <div>
            <strong>{selected.title}</strong>
            <p className="muted">
              {selected.year ?? "—"}
              {selected.rating != null ? ` · ${selected.rating.toFixed(1)}` : ""}
            </p>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => onSelect(null)}
            >
              Change
            </button>
          </div>
        </div>
      </div>
    );
  }

  const quick = suggestions.filter(
    (s, i, arr) => arr.findIndex((x) => x.imdbId === s.imdbId) === i,
  ).slice(0, 10);

  return (
    <div className="show-picker">
      <label className="show-picker__label" htmlFor={listId}>
        {label}
      </label>
      <div className="show-picker__search">
        <input
          id={listId}
          type="search"
          value={query}
          placeholder="Search by title…"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void tryImdbId();
            }
          }}
        />
        {searching ? <span className="muted">Searching…</span> : null}
      </div>

      {results.length > 0 ? (
        <ul className="show-picker__results">
          {results.map((show) => (
            <li key={show.imdbId}>
              <button type="button" onClick={() => pick(show)}>
                {show.posterUrl ? (
                  <img src={show.posterUrl} alt="" />
                ) : (
                  <span className="show-picker__ph" aria-hidden>
                    {show.title.slice(0, 1)}
                  </span>
                )}
                <span>
                  <strong>{show.title}</strong>
                  <em>{show.year}</em>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {!results.length && quick.length > 0 ? (
        <div className="show-picker__quick">
          <p className="muted">Quick picks</p>
          <div className="show-picker__quick-row">
            {quick.map((show) => (
              <button
                key={show.imdbId}
                type="button"
                className="show-picker__chip"
                onClick={() => pick(show)}
                title={show.title}
              >
                {show.posterUrl ? (
                  <img src={show.posterUrl} alt={show.title} />
                ) : (
                  <span>{show.title}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
