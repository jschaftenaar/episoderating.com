import { describe, expect, it } from "vitest";
import { createMemoryCache } from "@/cache/memory";
import { createApp } from "@/api/app";

describe("api", () => {
  it("ping works", async () => {
    const app = createApp({
      env: {},
      cache: createMemoryCache(),
    });
    const res = await app.request("/api/ping");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
  });

  it("sources lists providers", async () => {
    const app = createApp({
      env: { OMDB_API_KEY: "test" },
      cache: createMemoryCache(),
    });
    const res = await app.request("/api/sources");
    const body = await res.json();
    expect(body.sources[0].id).toBe("omdb");
    expect(body.sources[0].configured).toBe(true);
  });

  it("returns 503 when source not configured", async () => {
    const app = createApp({
      env: {},
      cache: createMemoryCache(),
    });
    const res = await app.request("/api/favorites?source=omdb");
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.code).toBe("SOURCE_NOT_CONFIGURED");
  });

  it("rejects non-imdb show ids", async () => {
    const app = createApp({
      env: { OMDB_API_KEY: "test" },
      cache: createMemoryCache(),
    });
    const res = await app.request("/api/show/1396?source=omdb");
    expect(res.status).toBe(400);
  });
});
