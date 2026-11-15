import { describe, expect, it } from "vitest";
import {
  createProviders,
  getProvider,
  listSources,
  resolveSourceId,
  DEFAULT_SOURCE,
} from "@/providers/registry";
import { ProviderNotConfiguredError } from "@/domain/types";

describe("provider registry", () => {
  it("defaults to omdb", () => {
    expect(resolveSourceId(undefined)).toBe("omdb");
    expect(DEFAULT_SOURCE).toBe("omdb");
  });

  it("lists sources and configuration state", () => {
    const providers = createProviders({ OMDB_API_KEY: "x" });
    const sources = listSources(providers);
    expect(sources.map((s) => s.id)).toEqual(["omdb", "tmdb"]);
    expect(sources.find((s) => s.id === "omdb")?.configured).toBe(true);
    expect(sources.find((s) => s.id === "tmdb")?.configured).toBe(false);
  });

  it("throws when source key missing", () => {
    const providers = createProviders({});
    expect(() => getProvider(providers, "omdb")).toThrow(
      ProviderNotConfiguredError,
    );
  });
});
