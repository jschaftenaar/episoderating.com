import type {
  DataSourceId,
  DataSourceInfo,
  ShowDetail,
  ShowSummary,
} from "@/domain/types";

export class ApiError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, opts?: { code?: string; status?: number }) {
    super(message);
    this.name = "ApiError";
    this.code = opts?.code;
    this.status = opts?.status;
  }
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const text = await res.text();
  let body: Record<string, unknown> = {};
  try {
    body = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    throw new ApiError(
      `API returned non-JSON (${res.status}). Is the API server running?`,
      { status: res.status, code: "BAD_RESPONSE" },
    );
  }
  if (!res.ok) {
    throw new ApiError(String(body.error || res.statusText), {
      code: body.code ? String(body.code) : undefined,
      status: res.status,
    });
  }
  return body as T;
}

export function fetchSources() {
  return getJson<{ sources: DataSourceInfo[] }>("/api/sources");
}

export function fetchFavorites(source: DataSourceId) {
  return getJson<{ source: string; shows: ShowSummary[] }>(
    `/api/favorites?source=${encodeURIComponent(source)}`,
  );
}

export function fetchShows(
  source: DataSourceId,
  params: Record<string, string | number | undefined>,
) {
  const qs = new URLSearchParams({ source });
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") qs.set(k, String(v));
  }
  const path = params.query ? "/api/shows/search" : "/api/shows";
  return getJson<{ source: string; shows: ShowSummary[] }>(`${path}?${qs}`);
}

export function fetchShow(imdbId: string, source: DataSourceId) {
  return getJson<{ source: string; show: ShowDetail }>(
    `/api/show/${encodeURIComponent(imdbId)}?source=${encodeURIComponent(source)}`,
  );
}
