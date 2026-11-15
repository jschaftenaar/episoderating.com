import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createFsCache } from "./src/cache/fs";
import { createApp } from "./src/api/app";

/** Load `.env` into process.env without an extra dependency. */
function loadEnvFile(filePath = ".env") {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(
      `[EpisodeRating] Missing required ${name}. Copy .env.example to .env and set it, then restart.`,
    );
    process.exit(1);
  }
  return value;
}

loadEnvFile();

if (!existsSync(".env") && !process.env.OMDB_API_KEY) {
  console.error(
    "[EpisodeRating] No .env file found and OMDB_API_KEY is not set. Copy .env.example to .env.",
  );
  process.exit(1);
}

const omdbKey = requireEnv("OMDB_API_KEY");
const tmdbKey = process.env.TMDB_API_KEY?.trim();
if (!tmdbKey) {
  console.warn(
    "[EpisodeRating] TMDB_API_KEY not set — TMDB source will be unavailable.",
  );
} else {
  console.log("[EpisodeRating] OMDb + TMDB keys loaded.");
}

// 8090 locally avoids common clashes with other apps on 8080; Docker still uses 8080.
const port = Number(process.env.PORT || 8090);

const app = createApp({
  env: {
    OMDB_API_KEY: omdbKey,
    TMDB_API_KEY: tmdbKey,
  },
  cache: createFsCache(process.env.CACHE_DIR || "./cache"),
});

app.use("/assets/*", serveStatic({ root: "./dist" }));
app.use("/favicon.ico", serveStatic({ path: "./dist/favicon.ico" }));

app.get("*", async (c) => {
  if (c.req.path.startsWith("/api")) {
    return c.json({ error: "Not found" }, 404);
  }
  try {
    const html = await readFile("./dist/index.html", "utf8");
    return c.html(html);
  } catch {
    return c.text(
      "Web UI not built yet. Run npm run build, or use vite via npm run dev:web.",
      503,
    );
  }
});

console.log(`EpisodeRating listening on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
