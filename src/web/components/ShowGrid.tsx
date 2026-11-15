import type { ShowSummary } from "@/domain/types";
import { ShowCard } from "./ShowCard";

export function ShowGrid({ shows }: { shows: ShowSummary[] }) {
  if (!shows.length) {
    return <p className="muted">No shows to display.</p>;
  }
  return (
    <div className="show-grid">
      {shows.map((show) => (
        <ShowCard key={show.imdbId} show={show} />
      ))}
    </div>
  );
}
