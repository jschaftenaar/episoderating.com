# EpisodeRating — agent notes

## Purpose

[episoderating.com](https://episoderating.com/) shows TV episode rating heatmaps keyed by **IMDb ids** (`tt…`). Viewers pick a show, see seasons/episodes colored by rating, compare shows, and switch between OMDb (default) and TMDB when configured.

## Architecture

Dual-deploy app: one React SPA + one Hono API surface that runs on Node (Docker / self-host) or Cloudflare Pages Functions.

| Layer | Role |
|---|---|
| `src/web/` | Vite + React 19 UI (React Router). Talks only to `/api/*`. |
| `src/api/` | Hono routes: search, show detail, favorites, health. |
| `src/domain/` | Source-agnostic types and rating helpers (`normalizeRating`, vote floor). |
| `src/providers/` | `DataProvider` interface + registry; `omdb/`, `tmdb/`. |
| `src/cache/` | Filesystem cache on Node (`CACHE_DIR`); in-memory on Workers. |
| `server.ts` | Node entry: loads env, serves API + `dist` static assets. |
| `functions/` | Cloudflare Pages Functions adapter for `/api/*`. |
| `config/` | Curated favorites list (IMDb ids). |

Shows are identified by IMDb id everywhere. Providers map OMDb/TMDB payloads into domain types. Empty search/favorite lists are not cached; successful API payloads use a ~1 week TTL.

**Default source:** OMDb. UI source switcher enables TMDB only when that key is present server-side. The Node server fails fast if `OMDB_API_KEY` is missing.

## Environment (placeholders only)

Copy `.env.example` → `.env` locally. Never commit real keys.

| Name | Required | Notes |
|---|---|---|
| `OMDB_API_KEY` | Yes (default source) | OMDb API key |
| `TMDB_API_KEY` | No | Enables TMDB in the source switcher |
| `PORT` | No | Local Node default `8090` (see `.env.example`); Docker uses `8080` |
| `CACHE_DIR` | No | Node filesystem cache path (default `./cache`) |

Cloudflare: set the same secret names in the Pages project / `wrangler pages secret`. Do not put values in `wrangler.toml`.

## How to run

```bash
cp .env.example .env   # fill OMDB_API_KEY (and optional TMDB_API_KEY)
npm install
npm run dev            # API (tsx) + Vite UI; UI proxies /api
# or separately:
npm run dev:server
npm run dev:web
```

```bash
npm test
npm run build
npm start              # production Node: API + static dist
```

### Docker Compose

```bash
# .env in repo root with OMDB_API_KEY=…
docker compose up --build
# http://localhost:580  → container :8080
```

### Cloudflare Pages

1. Build: `npm run build`
2. Output directory: `dist`
3. Functions directory: `functions`
4. Bind secrets: `OMDB_API_KEY`, optional `TMDB_API_KEY`
5. Optional local/deploy: `npx wrangler pages deploy dist`

## Key paths

```
AGENT.md              This file
README.md             Human-oriented overview
.env.example          Env placeholders (committed)
server.ts             Node server entry
index.html            Vite HTML shell
vite.config.ts        Dev proxy / build
wrangler.toml         Pages project name + output dir (no secrets)
Dockerfile            Multi-stage Node 22 image
docker-compose.yml    Host :580 → app :8080 + cache volume
config/               Favorites IMDb ids
functions/api/        CF Pages catch-all API
src/api/              Hono app + favorites helper
src/domain/           Types + rating normalization
src/providers/        Registry + OMDb/TMDB clients
src/web/              Pages, heatmap canvas, compare, source switcher
tests/                Vitest (api, registry, domain)
```

## Agent constraints

- Do not commit `.env`, `.dev.vars`, cache contents, or real API keys/tokens.
- Prefer extending `DataProvider` + registry over calling OMDb/TMDB from the UI.
- Keep IMDb `tt…` ids as the public identifier in routes and favorites.
