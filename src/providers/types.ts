import type {
  DataSourceId,
  ShowDetail,
  ShowFilters,
  ShowSummary,
} from "@/domain/types";

/**
 * Contract every data source must implement.
 * UI and API talk only to this interface — never to vendor clients.
 */
export interface DataProvider {
  readonly id: DataSourceId;
  readonly label: string;

  /** True when required secrets are present. */
  isConfigured(): boolean;

  searchShows(query: string, filters?: ShowFilters): Promise<ShowSummary[]>;

  /** Best-effort browse/catalog for the source. */
  listShows(filters?: ShowFilters): Promise<ShowSummary[]>;

  /** Load full show + seasons/episodes by IMDb id (tt…). */
  getShow(imdbId: string): Promise<ShowDetail>;

  /** Resolve curated favorite IMDb ids for this source. */
  getFavorites(imdbIds: string[]): Promise<ShowSummary[]>;
}
