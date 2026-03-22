import { invokeTcgdexGet } from "./client";
import type { GetCardResponse, SearchCardsResponse } from "./types";

/** Must match the deployed Edge Function folder name. */
export const TCGDEX_SEARCH_CARDS_FUNCTION = "tcgdex-search-cards" as const;
export const TCGDEX_GET_CARD_FUNCTION = "tcgdex-get-cards" as const;

export type SearchCardsParams = {
  name?: string;
  setNumber?: string;
  setName?: string;
  page?: number;
  itemsPerPage?: number;
  /** Fetches full card per row to attach `pricing` (more TCGdex traffic). */
  includePricing?: boolean;
};

function trimOrUndefined(s: string | undefined): string | undefined {
  if (s === undefined) return undefined;
  const t = s.trim();
  return t.length > 0 ? t : undefined;
}

/**
 * Search cards via Supabase Edge Function (cached on server).
 * Requires at least one of: name, setNumber, setName.
 */
export async function searchCards(
  params: SearchCardsParams,
): Promise<SearchCardsResponse> {
  const name = trimOrUndefined(params.name);
  const setNumber = trimOrUndefined(params.setNumber);
  const setName = trimOrUndefined(params.setName);

  if (!name && !setNumber && !setName) {
    throw new Error(
      "searchCards: provide at least one of name, setNumber, or setName.",
    );
  }

  const json = await invokeTcgdexGet(TCGDEX_SEARCH_CARDS_FUNCTION, {
    name,
    setNumber,
    setName,
    page: params.page,
    itemsPerPage: params.itemsPerPage,
    includePricing: params.includePricing === true ? true : undefined,
  });

  return json as SearchCardsResponse;
}

/**
 * Full card by TCGdex id (e.g. `base1-4`) via Supabase Edge Function (cached on server).
 */
export async function getCardById(cardId: string): Promise<GetCardResponse> {
  const id = trimOrUndefined(cardId);
  if (!id) {
    throw new Error("getCardById: cardId is required.");
  }

  const json = await invokeTcgdexGet(TCGDEX_GET_CARD_FUNCTION, {
    cardId: id,
  });

  return json as GetCardResponse;
}

export { TcgdexApiError } from "./client";
