import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ShowSummary } from "@/domain/types";
import { fetchFavorites } from "../lib/api";
import { readRecent } from "../lib/recent";
import { useSource } from "../components/SourceProvider";
import { ShowGrid } from "../components/ShowGrid";

export function HomePage() {
  const { source } = useSource();
  const [favorites, setFavorites] = useState<ShowSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const recent = readRecent();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchFavorites(source)
      .then((data) => {
        if (!cancelled) setFavorites(data.shows);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [source]);

  return (
    <div className="page home-page">
      <section className="hero">
        <p className="hero__brand">EpisodeRating</p>
        <h1>See every episode&apos;s score at a glance.</h1>
        <p className="hero__lead">
          Heatmaps for TV series using IMDb ids. Switch between OMDb and TMDB
          anytime — same links, your choice of source.
        </p>
        <div className="hero__actions">
          <Link className="btn btn--primary" to="/shows">
            Browse shows
          </Link>
          <Link className="btn btn--ghost" to="/about">
            About
          </Link>
        </div>
      </section>

      <section className="section">
        <h2>Favorites</h2>
        {loading ? <p className="muted">Loading favorites…</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {!loading && !error ? <ShowGrid shows={favorites} /> : null}
      </section>

      {recent.length ? (
        <section className="section">
          <h2>Recently viewed</h2>
          <ul className="recent-list">
            {recent.map((item) => (
              <li key={item.imdbId}>
                <Link to={`/show/${item.imdbId}`}>{item.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
