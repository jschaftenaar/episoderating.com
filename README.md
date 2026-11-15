# EpisodeRating

Modern rewrite of [episoderating.com](https://episoderating.com/) — TV episode rating heatmaps, keyed by **IMDb ids** (`tt…`).

## Architecture

```
src/domain/       Source-agnostic types + rating helpers
src/providers/    DataProvider interface, registry, omdb/, tmdb/
src/cache/        Filesystem (Node) / memory (Workers)
src/api/          Hono routes (/api/*)
src/web/          React UI
server.ts         Node entry (Docker / self-host)
functions/        Cloudflare Pages Functions
config/           Curated favorites (IMDb ids)
```

UI never talks to OMDb/TMDB directly. Add a source by implementing `DataProvider`, registering it in `src/providers/registry.ts`, and documenting the env var.

**Default source:** OMDb. Users can switch to TMDB in the header when `TMDB_API_KEY` is set.

## Setup

```bash
cp .env.example .env
# OMDB_API_KEY is required — the server refuses to start without it
# TMDB_API_KEY is optional (console warning if missing)
npm install
```

### Local development

```bash
npm run dev:server   # API on :8080
npm run dev:web      # Vite on :5173 (proxies /api → :8080)
```

Or `npm run dev` to start both.

### Production (Node / Docker)

```bash
npm run build
npm start
```

```bash
docker compose up --build
# http://localhost:580
```

### Cloudflare Pages

1. Build command: `npm run build`
2. Output directory: `dist`
3. Functions from `/functions`
4. Set secrets: `OMDB_API_KEY`, optional `TMDB_API_KEY`

```bash
npx wrangler pages deploy dist
```

## Scripts

| Script | Purpose |
|---|---|
| `dev` / `dev:web` / `dev:server` | Local development |
| `build` | Typecheck + Vite production build |
| `start` | Serve API + static `dist` |
| `test` | Vitest |

## Attribution

- [OMDb](https://www.omdbapi.com/)
- This product uses the TMDB API but is not endorsed or certified by TMDB.
