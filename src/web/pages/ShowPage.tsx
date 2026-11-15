import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type { Episode, ShowDetail } from "@/domain/types";
import { fetchShow } from "../lib/api";
import { pushRecent } from "../lib/recent";
import { useSource } from "../components/SourceProvider";
import { Heatmap } from "../components/Heatmap";

export function ShowPage() {
  const { imdbId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const { source, setSource } = useSource();

  const [show, setShow] = useState<ShowDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Episode | null>(null);
  const [colorblind, setColorblind] = useState(false);

  // Optional ?source= on shared links only — switcher owns the source after that.
  useEffect(() => {
    const fromUrl = searchParams.get("source");
    if (fromUrl) setSource(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imdbId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setShow(null);
    setSelected(null);

    fetchShow(imdbId, source)
      .then((data) => {
        if (cancelled) return;
        setShow(data.show);
        pushRecent({
          imdbId: data.show.imdbId,
          title: data.show.title,
          posterUrl: data.show.posterUrl,
        });
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
  }, [imdbId, source]);

  const heroSrc = show?.backdropUrl || show?.posterUrl || null;
  const heroIsBackdrop = Boolean(show?.backdropUrl);

  return (
    <div className="page show-page">
      {loading ? <p className="muted show-page__status">Loading show…</p> : null}
      {error ? <p className="error show-page__status">{error}</p> : null}

      {show ? (
        <>
          <section
            className={`show-hero ${heroIsBackdrop ? "show-hero--backdrop" : "show-hero--poster"}`}
          >
            {heroSrc ? (
              <img
                className="show-hero__img"
                src={heroSrc}
                alt=""
                decoding="async"
              />
            ) : (
              <div className="show-hero__fallback" aria-hidden />
            )}
            <div className="show-hero__veil" />
            <div className="show-hero__content">
              <p className="eyebrow">
                {show.imdbId} · via {show.source}
              </p>
              <h1>{show.title}</h1>
              <p className="show-hero__meta">
                {[
                  show.year,
                  show.rating != null ? show.rating.toFixed(1) : null,
                  show.votes != null
                    ? `${show.votes.toLocaleString()} votes`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {show.plot ? <p className="show-plot">{show.plot}</p> : null}
              <div className="show-hero__actions">
                <Link
                  className="btn btn--ghost"
                  to={`/compare?a=${show.imdbId}`}
                >
                  Compare
                </Link>
              </div>
            </div>
          </section>

          <div className="show-body">
            <div className="show-callouts show-callouts--inline">
              {show.bestEpisode ? (
                <div>
                  <h3>Best episode</h3>
                  <p>
                    S{show.bestEpisode.season}E{show.bestEpisode.episode}:{" "}
                    {show.bestEpisode.title} (
                    {show.bestEpisode.rating?.toFixed(1)})
                  </p>
                </div>
              ) : null}
              {show.worstEpisode ? (
                <div>
                  <h3>Lowest episode</h3>
                  <p>
                    S{show.worstEpisode.season}E{show.worstEpisode.episode}:{" "}
                    {show.worstEpisode.title} (
                    {show.worstEpisode.rating?.toFixed(1)})
                  </p>
                </div>
              ) : null}
            </div>

            <Heatmap
              show={show}
              colorblind={colorblind}
              onSelect={setSelected}
              onToggleColorblind={() => setColorblind((v) => !v)}
            />

            {selected ? (
              <aside className="episode-panel" aria-live="polite">
                <h2>
                  S{selected.season}E{selected.episode}: {selected.title}
                </h2>
                <p>
                  Rating:{" "}
                  <strong>
                    {selected.rating != null
                      ? selected.rating.toFixed(1)
                      : "n/a"}
                  </strong>
                  {selected.votes != null
                    ? ` · ${selected.votes.toLocaleString()} votes`
                    : ""}
                </p>
                {selected.released ? <p>Released: {selected.released}</p> : null}
                {selected.plot ? <p>{selected.plot}</p> : null}
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setSelected(null)}
                >
                  Close
                </button>
              </aside>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
