import { createMemoryCache } from "../../src/cache/memory";
import { createApp } from "../../src/api/app";

type Env = {
  OMDB_API_KEY?: string;
  TMDB_API_KEY?: string;
};

const cache = createMemoryCache();

export async function onRequest(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const app = createApp({
    env: {
      OMDB_API_KEY: context.env.OMDB_API_KEY,
      TMDB_API_KEY: context.env.TMDB_API_KEY,
    },
    cache,
  });
  return app.fetch(context.request);
}
