import { useSource } from "../components/SourceProvider";

export function AboutPage() {
  const { source } = useSource();

  return (
    <div className="page about-page">
      <header className="page-header">
        <h1>About EpisodeRating</h1>
        <p className="lead">
          A hobby project for exploring TV episode ratings as heatmaps. Buy me a
          coffee at{" "}
          <a href="https://www.buymeacoffee.com/jschaftenaar">
            buymeacoffee.com/jschaftenaar
          </a>{" "}
          or{" "}
          <a href="http://paypal.me/jschaftenaar/1000000">paypal.me/jschaftenaar</a>
          .
        </p>
      </header>

      <section className="section">
        <h2>Data sources</h2>
        <p>
          Shows are identified by <strong>IMDb ids</strong> (<code>tt…</code>).
          Active source: <strong>{source}</strong>.
        </p>
        <p>
          Data via{" "}
          <a href="https://www.omdbapi.com/" target="_blank" rel="noreferrer">
            OMDb
          </a>{" "}
          and{" "}
          <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">
            TMDB
          </a>
          . This product uses the TMDB API but is not endorsed or certified by
          TMDB.
        </p>
        <p>
          Source code:{" "}
          <a href="https://github.com/jschaftenaar/episoderating.com">GitHub</a>
        </p>
      </section>
    </div>
  );
}
