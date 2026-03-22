/**
 * Pure helpers for tcgdex-search-cards (no Deno / Supabase imports).
 * Used by the Edge Function and by Vitest unit tests.
 */

export type CardSearchFilters = {
  name?: string;
  setNumber?: string;
  setName?: string;
  page: number;
  itemsPerPage: number;
  /** When true, fetches full card for each result to attach `pricing` (extra TCGdex calls). */
  includePricing: boolean;
};

export function normalize(value: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Query: includePricing=true | 1 | yes */
export function parseTruthyQuery(value: string | null): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function toFiltersFromUrl(url: URL): CardSearchFilters {
  const page = Number(url.searchParams.get("page") ?? "1");
  const itemsPerPage = Number(url.searchParams.get("itemsPerPage") ?? "25");
  const includePricing =
    parseTruthyQuery(url.searchParams.get("includePricing")) ||
    parseTruthyQuery(url.searchParams.get("include_pricing"));
  return {
    name: normalize(url.searchParams.get("name")),
    setNumber: normalize(url.searchParams.get("setNumber")),
    setName: normalize(url.searchParams.get("setName")),
    page: Number.isFinite(page) && page > 0 ? page : 1,
    itemsPerPage:
      Number.isFinite(itemsPerPage) && itemsPerPage > 0 && itemsPerPage <= 100
        ? itemsPerPage
        : 25,
    includePricing,
  };
}

export function makeCacheKey(filters: CardSearchFilters): string {
  return JSON.stringify({
    name: filters.name ?? null,
    setNumber: filters.setNumber ?? null,
    setName: filters.setName ?? null,
    page: filters.page,
    itemsPerPage: filters.itemsPerPage,
    includePricing: filters.includePricing,
  });
}

export function isFresh(
  cachedAt: string,
  ttlSeconds: number,
  nowMs: number,
): boolean {
  const cachedAtMs = new Date(cachedAt).getTime();
  if (Number.isNaN(cachedAtMs)) return false;
  const ageInSeconds = (nowMs - cachedAtMs) / 1000;
  return ageInSeconds <= ttlSeconds;
}

export function buildTcgdexSearchUrl(
  tcgDexBaseUrl: string,
  filters: CardSearchFilters,
): string {
  const base = tcgDexBaseUrl.replace(/\/$/, "");
  const url = new URL(`${base}/cards`);
  if (filters.name) url.searchParams.set("name", filters.name);
  if (filters.setNumber) url.searchParams.set("localId", `eq:${filters.setNumber}`);
  if (filters.setName) url.searchParams.set("set.name", filters.setName);
  url.searchParams.set("pagination:page", String(filters.page));
  url.searchParams.set("pagination:itemsPerPage", String(filters.itemsPerPage));
  return url.toString();
}

export function hasAtLeastOneSearchFilter(filters: CardSearchFilters): boolean {
  return Boolean(filters.name || filters.setName || filters.setNumber);
}

/** Query param for tcgdex-get-cards */
export function getCardIdFromUrl(url: URL): string | undefined {
  return normalize(url.searchParams.get("cardId"));
}
