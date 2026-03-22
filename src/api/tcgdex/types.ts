/**
 * Shared types for TCGdex data and our Supabase Edge Function responses.
 */

export interface TcgdexImage {
  small?: string;
  high?: string;
}

export interface TcgdexSetRef {
  id: string;
  name: string;
  logo?: string;
  symbol?: string;
}

/** Market pricing from TCGdex (Cardmarket EUR, TCGplayer USD). @see https://tcgdex.dev/markets-prices */
export type TcgdexPricing = {
  cardmarket?: Record<string, unknown>;
  tcgplayer?: Record<string, unknown>;
};

/** Card list item returned by search (TCGdex CardBrief–style). */
export interface TcgdexCardSummary {
  id: string;
  localId?: string;
  name: string;
  image?: string;
  /** Present when search was called with `includePricing=true`. */
  pricing?: TcgdexPricing;
}

/** Full card document (subset of fields; API may return more). */
export interface TcgdexCard {
  id: string;
  localId?: string;
  name: string;
  image?: string;
  category?: string;
  hp?: number;
  rarity?: string;
  illustrator?: string;
  set?: TcgdexSetRef;
  /** Included on full card GET when listed on marketplaces. */
  pricing?: TcgdexPricing;
}

export interface TcgdexSet {
  id: string;
  name: string;
  logo?: string;
  symbol?: string;
  cardCount?: {
    official: number;
    total: number;
  };
}

/** Where the Edge Function got the payload (your cache vs live TCGdex). */
export type TcgdexResponseSource = "cache" | "tcgdex";

/** Applied filters echoed by `tcgdex-search-cards`. */
export interface SearchCardsFilters {
  name?: string;
  setNumber?: string;
  setName?: string;
  page: number;
  itemsPerPage: number;
  includePricing: boolean;
}

/** Success body from `GET .../tcgdex-search-cards`. */
export interface SearchCardsResponse {
  source: TcgdexResponseSource;
  filters: SearchCardsFilters;
  data: TcgdexCardSummary[];
}

/** Success body from `GET .../tcgdex-get-cards`. */
export interface GetCardResponse {
  source: TcgdexResponseSource;
  cardId: string;
  data: TcgdexCard;
}

/** Error JSON shape from Edge Functions on failure. */
export interface TcgdexFunctionErrorBody {
  error: string;
  status?: number;
  details?: string;
}
