# AGENT.md — EpisodeRating.com

Guidance for agents working in this repo. Keep changes scoped; do not expand into unrelated modernization unless asked.

## What this is

[episoderating.com](https://episoderating.com) shows TV-show episode ratings as a season×episode heatmap (color-coded by score). Hobby project; data from The Movie Database (TMDB).

## Architecture

| Layer | Tech |
| --- | --- |
| Frontend | Create React App (React 16), React Router 5, Bootstrap 4 (CDN), Sass |
| Backend | Express (`server.js`) serves `build/` and JSON under `/data/*` |
| Data | TMDB API v3 (`tmdb.js`); filesystem JSON cache (`cache.js` → `./cache/`) |
| Images | TMDB CDN (`image.tmdb.org`) |

**Providers**

- **TMDB** — only live provider. Env: `TMDB_API_KEY`, plus `TMDB_USERNAME` / `TMDB_PASSWORD` for the account favorites endpoint.
- **OMDB / IMDb** — not wired up. `imdb-api` is in `package.json` but unused; About page lists IMDb as a future idea.

**App shape**

- Routes: `/` (favorites), `/shows` (on-air + search), `/show/:id` (heatmap), `/about`
- Client API helpers: `src/data.js` → Express `/data/...` → `tmdb.js`
- Heatmap UI: `src/Show.js` + rating buckets in `src/helper.js`

**Deploy / run paths**

1. **Local npm** — CRA dev server (`npm run react`, port 3000) proxies API to Express on `8080` (`"proxy"` in `package.json`). Production-style: `npm run build` then `npm start` (Express on `PORT` or `8080`).
2. **Docker Compose** — `docker-compose.yml` runs Node 14, mounts the repo, runs `startup.sh` (npm ci → build → start). Host port **580** → container **8080**. Passes TMDB env vars through.
3. **Dokku (production Node)** — CI (`.github/workflows/nodejs.yml`) on `release/v1` runs `dokkudeploy.sh` and force-pushes to Dokku. Live site responds as Express.
4. **Cloudflare** — DNS/proxy in front of production today (`server: cloudflare`). There is **no** Cloudflare Pages / Workers / Functions config in this repo. Root `.cfignore` is a leftover from an older **IBM Cloud Foundry** deploy (`cfdeploy.sh` was removed in favor of Dokku), not Pages.

## Basics for agents

### Run locally

```bash
# API (needs TMDB env vars)
export TMDB_API_KEY=...
export TMDB_USERNAME=...   # favorites only
export TMDB_PASSWORD=...
npm ci
node server.js             # or: npm start (expects build/ for static)

# UI (separate terminal)
npm run react              # CRA on :3000, proxies /data to :8080
```

Or: `TMDB_API_KEY=... docker-compose up` (after `npm run build` or let `startup.sh` build).

### Env vars

| Var | Required | Used for |
| --- | --- | --- |
| `TMDB_API_KEY` | yes | All TMDB calls |
| `TMDB_USERNAME` | for favorites | TMDB login for `/data/favorite/shows` |
| `TMDB_PASSWORD` | for favorites | same |
| `PORT` | no | Express listen port (default `8080`) |
| `NODE_ENV` | no | Set to `production` in Compose |

Do not commit `.env` (gitignored). CI Dokku secrets: `ID_RSA` / `ID_RSA_PUB`.

### Important paths

| Path | Role |
| --- | --- |
| `server.js` | Express app + `/data` routes |
| `tmdb.js` | TMDB client + auth for favorites |
| `cache.js` / `cache/` | On-disk response cache (gitignored) |
| `src/` | React UI (class components) |
| `public/` | CRA static shell |
| `docker-compose.yml`, `startup.sh` | Container run path |
| `dokkudeploy.sh`, `.github/workflows/nodejs.yml` | Dokku deploy |
| `manifest.yml`, `.cfignore` | Legacy Cloud Foundry; ignore unless reviving CF |

### Conventions

- Prefer small, focused PRs; match existing JS style (CommonJS on server, CRA on client).
- CRA `proxy` only applies in `npm run react` — production uses same-origin Express.
- Cache writes under `./cache/`; safe to delete to force TMDB refetch.
- Default branch: `master`. CI builds on `master` / `release/v1` and PRs to `master`.
- License: GPL-3.0 (`LICENSE.txt`).
