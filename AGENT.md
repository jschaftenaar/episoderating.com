# EpisodeRating — agent notes

## Purpose

[episoderating.com](https://episoderating.com/) shows TV episode rating heatmaps keyed by **IMDb ids** (`tt…`). Viewers pick a show, see seasons/episodes colored by rating, compare shows, and switch between OMDb (default) and TMDB when configured.

## Architecture

Dual-deploy: Vite + React 19 SPA and a Hono API on Node (Docker / self-host) or Cloudflare Pages Functions. Node **≥26**.

| Layer | Role |
|---|---|
| `src/web/` | Vite + React 19 UI (React Router). Talks only to `/api/*`. |
| `src/api/` | Hono routes: search, show detail, favorites, sources, ping. |
| `src/domain/` | Source-agnostic types + rating helpers (`normalizeRating`, vote floor). |
| `src/providers/` | `DataProvider` registry; `omdb/`, `tmdb/` (server-side API keys only). |
| `src/cache/` | Filesystem TTL cache on Node (`CACHE_DIR`); in-memory on Workers. |
| `server.ts` | Node entry: loads `.env`, serves API + `dist` static assets. |
| `functions/` | Cloudflare Pages Functions adapter for `/api/*`. |
| `config/` | Curated favorites (IMDb ids). |

Shows use IMDb ids everywhere. Empty search/favorite lists are not cached; successful payloads use a ~1 week TTL.

**Default source:** OMDb. UI switcher enables TMDB only when that key is present **server-side**. Node fails fast if `OMDB_API_KEY` is missing.

## Environment (placeholders only)

Copy `.env.example` → `.env`. Never commit real keys. Keys are **server-side only** — not `VITE_*`, not returned from `/api` (sources expose `configured: boolean` only).

| Name | Required | Notes |
|---|---|---|
| `OMDB_API_KEY` | Yes (default source) | OMDb API key |
| `TMDB_API_KEY` | No | Enables TMDB in the source switcher |
| `PORT` | No | Local Node default `8090`; container uses `8080` |
| `CACHE_DIR` | No | Node filesystem cache (default `./cache`; Docker `/app/cache`) |
| `HOST_PORT` | No | Compose host publish port → container `8080` (default `8080`) |

Cloudflare Pages: set `OMDB_API_KEY` / optional `TMDB_API_KEY` as project secrets. Do not put values in `wrangler.toml`.

`.gitignore` / `.dockerignore` exclude `.env` and `.env.*` (keep `.env.example`). Inject Compose keys at **runtime** via `environment:`; do not bake `.env` into image layers.

## How to run

Requires Node ≥26.

```bash
cp .env.example .env   # fill OMDB_API_KEY (optional TMDB_API_KEY, HOST_PORT)
npm install
npm run dev            # API (tsx) + Vite; UI proxies /api → :8090
npm test
npm run build && npm start
```

### Docker Compose (v1.25+ file format `3.7`)

```bash
# .env: OMDB_API_KEY=…  optional HOST_PORT=8080
docker-compose up --build
# http://localhost:${HOST_PORT:-8080}  → container :8080
```

Image: multi-stage `node:26-bookworm-slim` — single `npm ci` in build, prune, copy `node_modules`/`dist` into runtime (no second install).

### Cloudflare Pages

1. Build: `npm run build`
2. Output: `dist`
3. Functions: `functions`
4. Secrets: `OMDB_API_KEY`, optional `TMDB_API_KEY`
5. Optional: `npx wrangler pages deploy dist`

## Key paths

```
AGENT.md              This file
README.md             Human overview
.env.example          Env placeholders (committed)
.dockerignore         Excludes .env from build context
server.ts             Node server entry
Dockerfile            node:26-bookworm-slim multi-stage
docker-compose.yml    HOST_PORT → :8080 + rating-cache volume
wrangler.toml         Pages name + output dir (no secrets)
config/               Favorites IMDb ids
functions/api/        CF Pages catch-all API
src/api/              Hono app
src/cache/            fs + memory TTL caches
src/domain/           Types + rating normalization
src/providers/        Registry + OMDb/TMDB clients
src/web/              Pages, heatmap, compare, source switcher
tests/                Vitest
```

## Agent constraints

- Never commit or embed real `OMDB_API_KEY` / `TMDB_API_KEY` (or other secrets).
- Keys stay on the server (Node / Compose env / CF secrets). Never ship them in client JS or HTTP responses.
- Prefer extending `DataProvider` + registry over calling OMDb/TMDB from the UI.
- Keep IMDb `tt…` ids as the public identifier in routes and favorites.
- Root `/cache/` is runtime data (gitignored); `src/cache/` is source code.
