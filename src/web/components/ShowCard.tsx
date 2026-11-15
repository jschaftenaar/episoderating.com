import { Link } from "react-router-dom";
import type { ShowSummary } from "@/domain/types";

export function ShowCard({ show }: { show: ShowSummary }) {
  return (
    <Link to={`/show/${show.imdbId}`} className="show-card">
      {show.posterUrl ? (
        <img src={show.posterUrl} alt="" loading="lazy" />
      ) : (
        <div className="show-card__placeholder" aria-hidden>
          {show.title.slice(0, 1)}
        </div>
      )}
      <div className="show-card__meta">
        <span className="show-card__title">{show.title}</span>
        {show.year ? <span className="show-card__year">{show.year}</span> : null}
        {show.rating != null ? (
          <span className="show-card__rating">{show.rating.toFixed(1)}</span>
        ) : null}
      </div>
    </Link>
  );
}
