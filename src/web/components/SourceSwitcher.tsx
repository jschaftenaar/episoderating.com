import { useSource } from "./SourceProvider";

export function SourceSwitcher() {
  const { source, setSource, sources, loading } = useSource();
  const available = sources.filter((s) => s.configured);
  const value =
    available.some((s) => s.id === source) ? source : (available[0]?.id ?? "");

  return (
    <label className="source-switcher">
      <span className="source-switcher__label">Source</span>
      <select
        value={value}
        disabled={loading && available.length === 0}
        onChange={(e) => setSource(e.target.value)}
        aria-label="Data source"
      >
        {available.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );
}
