import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DataSourceId, DataSourceInfo } from "@/domain/types";
import { fetchSources } from "../lib/api";
import { readStoredSource, storeSource } from "../lib/source";

interface SourceContextValue {
  source: DataSourceId;
  setSource: (id: DataSourceId) => void;
  sources: DataSourceInfo[];
  loading: boolean;
  error: string | null;
}

const SourceContext = createContext<SourceContextValue | null>(null);

export function SourceProvider({ children }: { children: ReactNode }) {
  const [source, setSourceState] = useState<DataSourceId>(readStoredSource);
  const [sources, setSources] = useState<DataSourceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSources()
      .then((data) => {
        if (cancelled) return;
        setSources(data.sources);
        setSourceState((current) => {
          const currentMeta = data.sources.find((s) => s.id === current);
          if (currentMeta?.configured) return current;
          const fallback =
            data.sources.find((s) => s.configured && s.isDefault) ||
            data.sources.find((s) => s.configured);
          return fallback?.id ?? current;
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
  }, []);

  const setSource = useCallback((id: DataSourceId) => {
    setSourceState(id);
    storeSource(id);
  }, []);

  const value = useMemo(
    () => ({ source, setSource, sources, loading, error }),
    [source, setSource, sources, loading, error],
  );

  return (
    <SourceContext.Provider value={value}>{children}</SourceContext.Provider>
  );
}

export function useSource() {
  const ctx = useContext(SourceContext);
  if (!ctx) throw new Error("useSource must be used within SourceProvider");
  return ctx;
}
