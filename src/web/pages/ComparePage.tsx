import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { ShowDetail, ShowSummary } from "@/domain/types";
import { ratingBand } from "@/domain/rating";
import { fetchFavorites, fetchShow } from "../lib/api";
import { readRecent } from "../lib/recent";
import { useSource } from "../components/SourceProvider";
import { ShowPicker } from "../components/ShowPicker";

export function ComparePage() {
  const { source } = useSource();
  const [params, setParams] = useSearchParams();
  const [pickA, setPickA] = useState<ShowSummary | null>(null);
  const [pickB, setPickB] = useState<ShowSummary | null>(null);
  const [a, setA] = useState<ShowDetail | null>(null);
  const [b, setB] = useState<ShowDetail | null>(null);
  const [favorites, setFavorites] = useState<ShowSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const suggestions = useMemo(() => {
    const recent = readRecent().map((r) => ({
      imdbId: r.imdbId,
      title: r.title,
      posterUrl: r.posterUrl,
      source,
    }));
    return [...favorites, ...recent];
  }, [favorites, source]);

  useEffect(() => {
    let cancelled = false;
    fetchFavorites(source)
      .then((data) => {
        if (!cancelled) setFavorites(data.shows);
      })
      .catch(() => {
        if (!cancelled) setFavorites([]);
      });
    return () => {
      cancelled = true;
    };
  }, [source]);

  // Hydrate picks from URL (?a=&b=)
  useEffect(() => {
    const aId = params.get("a");
    const bId = params.get("b");
    let cancelled = false;

    async function hydrate() {
      if (!aId && !bId) return;
      setLoading(true);
      setError(null);
      try {
        const [left, right] = await Promise.all([
          aId ? fetchShow(aId, source) : Promise.resolve(null),
          bId ? fetchShow(bId, source) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        if (left) {
          setPickA(toSummary(left.show));
          setA(left.show);
        }
        if (right) {
          setPickB(toSummary(right.show));
          setB(right.show);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load shows");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
    // only on mount / source change for URL ids
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  useEffect(() => {
    if (!pickA?.imdbId) {
      setA(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchShow(pickA.imdbId, source)
      .then((data) => {
        if (!cancelled) setA(data.show);
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
  }, [pickA?.imdbId, source]);

  useEffect(() => {
    if (!pickB?.imdbId) {
      setB(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchShow(pickB.imdbId, source)
      .then((data) => {
        if (!cancelled) setB(data.show);
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
  }, [pickB?.imdbId, source]);

  useEffect(() => {
    const next: Record<string, string> = {};
    if (pickA?.imdbId) next.a = pickA.imdbId;
    if (pickB?.imdbId) next.b = pickB.imdbId;
    setParams(next, { replace: true });
  }, [pickA?.imdbId, pickB?.imdbId, setParams]);

  const maxSeasons = Math.max(a?.totalSeasons ?? 0, b?.totalSeasons ?? 0);

  return (
    <div className="page compare-page">
      <header className="page-header">
        <h1>Compare shows</h1>
        <p className="muted">
          Pick two series and compare season averages side by side.
        </p>
      </header>

      <div className="compare-pickers">
        <ShowPicker
          label="Show A"
          selected={pickA}
          onSelect={setPickA}
          suggestions={suggestions}
        />
        <ShowPicker
          label="Show B"
          selected={pickB}
          onSelect={setPickB}
          suggestions={suggestions.filter((s) => s.imdbId !== pickA?.imdbId)}
        />
      </div>

      {loading ? <p className="muted">Loading…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {a && b ? (
        <>
          <div className="compare-grid">
            <CompareColumn show={a} />
            <CompareColumn show={b} />
          </div>

          {maxSeasons > 0 ? (
            <section className="compare-seasons section">
              <h2>Season averages</h2>
              <div className="compare-season-table-wrap">
                <table className="compare-season-table">
                  <thead>
                    <tr>
                      <th>Season</th>
                      <th>{a.title}</th>
                      <th>{b.title}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: maxSeasons }, (_, i) => {
                      const n = i + 1;
                      const left = a.seasons.find((s) => s.seasonNumber === n);
                      const right = b.seasons.find((s) => s.seasonNumber === n);
                      return (
                        <tr key={n}>
                          <th scope="row">{n}</th>
                          <td>
                            <SeasonCell rating={left?.averageRating ?? null} />
                          </td>
                          <td>
                            <SeasonCell rating={right?.averageRating ?? null} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <p className="muted">
          Search or use a quick pick for both sides to compare.
        </p>
      )}
    </div>
  );
}

function toSummary(show: ShowDetail): ShowSummary {
  return {
    imdbId: show.imdbId,
    title: show.title,
    year: show.year,
    posterUrl: show.posterUrl,
    rating: show.rating,
    source: show.source,
  };
}

function CompareColumn({ show }: { show: ShowDetail }) {
  return (
    <section className="compare-col">
      <div className="compare-col__head">
        {show.posterUrl ? (
          <img src={show.posterUrl} alt="" className="compare-col__poster" />
        ) : null}
        <div>
          <h2>{show.title}</h2>
          <p className="muted">
            {show.year}
            {show.rating != null ? ` · ${show.rating.toFixed(1)}` : ""} ·{" "}
            {show.totalSeasons} seasons
          </p>
          <Link className="btn btn--ghost" to={`/show/${show.imdbId}`}>
            Open heatmap
          </Link>
        </div>
      </div>
      {show.bestEpisode ? (
        <p>
          Best: S{show.bestEpisode.season}E{show.bestEpisode.episode}{" "}
          {show.bestEpisode.title} ({show.bestEpisode.rating?.toFixed(1)})
        </p>
      ) : null}
      {show.worstEpisode ? (
        <p>
          Lowest: S{show.worstEpisode.season}E{show.worstEpisode.episode}{" "}
          {show.worstEpisode.title} ({show.worstEpisode.rating?.toFixed(1)})
        </p>
      ) : null}
    </section>
  );
}

function SeasonCell({ rating }: { rating: number | null }) {
  if (rating == null) return <span className="muted">—</span>;
  const band = ratingBand(rating);
  return (
    <span className={`season-pill rating-${band}`}>{rating.toFixed(2)}</span>
  );
}
