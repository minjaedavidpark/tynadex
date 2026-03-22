import { describe, expect, it } from "vitest";
import {
  buildTcgdexSearchUrl,
  getCardIdFromUrl,
  hasAtLeastOneSearchFilter,
  isFresh,
  makeCacheKey,
  toFiltersFromUrl,
} from "../supabase/functions/_shared/tcgdex_search_utils";

describe("toFiltersFromUrl", () => {
  it("parses name, setNumber, setName, page, itemsPerPage", () => {
    const url = new URL(
      "https://x/functions/v1/search?name=pikachu&setNumber=25&setName=Base&page=2&itemsPerPage=50",
    );
    expect(toFiltersFromUrl(url)).toEqual({
      name: "pikachu",
      setNumber: "25",
      setName: "Base",
      page: 2,
      itemsPerPage: 50,
      includePricing: false,
    });
  });

  it("defaults page to 1 and itemsPerPage to 25", () => {
    const url = new URL("https://x/functions/v1/search?name=a");
    expect(toFiltersFromUrl(url)).toMatchObject({ page: 1, itemsPerPage: 25 });
  });

  it("clamps invalid page and caps itemsPerPage at 100", () => {
    expect(
      toFiltersFromUrl(new URL("https://x/search?name=a&page=0&itemsPerPage=999")),
    ).toMatchObject({ page: 1, itemsPerPage: 25 });
  });

  it("trims empty string filters to undefined", () => {
    const url = new URL("https://x/search?name=%20&setNumber=&setName=  ");
    const f = toFiltersFromUrl(url);
    expect(f.name).toBeUndefined();
    expect(f.setNumber).toBeUndefined();
    expect(f.setName).toBeUndefined();
  });

  it("parses includePricing from includePricing or include_pricing", () => {
    expect(
      toFiltersFromUrl(new URL("https://x/search?name=a&includePricing=true")).includePricing,
    ).toBe(true);
    expect(
      toFiltersFromUrl(new URL("https://x/search?name=a&include_pricing=1")).includePricing,
    ).toBe(true);
    expect(
      toFiltersFromUrl(new URL("https://x/search?name=a&includePricing=no")).includePricing,
    ).toBe(false);
  });
});

describe("hasAtLeastOneSearchFilter", () => {
  it("false when all missing", () => {
    expect(
      hasAtLeastOneSearchFilter({
        page: 1,
        itemsPerPage: 25,
        includePricing: false,
      }),
    ).toBe(false);
  });

  it("true when any filter present", () => {
    expect(
      hasAtLeastOneSearchFilter({
        name: "x",
        page: 1,
        itemsPerPage: 25,
        includePricing: false,
      }),
    ).toBe(true);
  });
});

describe("makeCacheKey", () => {
  it("is stable for same filters", () => {
    const a = makeCacheKey({
      name: "pika",
      page: 1,
      itemsPerPage: 25,
      includePricing: false,
    });
    const b = makeCacheKey({
      name: "pika",
      page: 1,
      itemsPerPage: 25,
      includePricing: false,
    });
    expect(a).toBe(b);
  });

  it("differs when page changes", () => {
    const a = makeCacheKey({
      name: "x",
      page: 1,
      itemsPerPage: 25,
      includePricing: false,
    });
    const b = makeCacheKey({
      name: "x",
      page: 2,
      itemsPerPage: 25,
      includePricing: false,
    });
    expect(a).not.toBe(b);
  });
});

describe("buildTcgdexSearchUrl", () => {
  it("builds TCGdex v2 cards URL with filters and pagination", () => {
    const url = buildTcgdexSearchUrl("https://api.tcgdex.net/v2/en", {
      name: "charizard",
      setNumber: "4",
      setName: "Base",
      page: 1,
      itemsPerPage: 10,
      includePricing: false,
    });
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/v2/en/cards");
    expect(parsed.searchParams.get("name")).toBe("charizard");
    expect(parsed.searchParams.get("localId")).toBe("eq:4");
    expect(parsed.searchParams.get("set.name")).toBe("Base");
    expect(parsed.searchParams.get("pagination:page")).toBe("1");
    expect(parsed.searchParams.get("pagination:itemsPerPage")).toBe("10");
  });

  it("strips trailing slash on base", () => {
    const url = buildTcgdexSearchUrl("https://api.tcgdex.net/v2/en/", {
      name: "a",
      page: 1,
      itemsPerPage: 25,
      includePricing: false,
    });
    expect(url.startsWith("https://api.tcgdex.net/v2/en/cards")).toBe(true);
  });
});

describe("getCardIdFromUrl", () => {
  it("returns cardId query param", () => {
    const url = new URL("https://x/functions/v1/get?cardId=base1-4");
    expect(getCardIdFromUrl(url)).toBe("base1-4");
  });

  it("returns undefined when missing", () => {
    expect(getCardIdFromUrl(new URL("https://x/get"))).toBeUndefined();
  });

  it("returns undefined for blank cardId", () => {
    expect(getCardIdFromUrl(new URL("https://x/get?cardId=%20"))).toBeUndefined();
  });
});

describe("isFresh", () => {
  it("true within TTL", () => {
    const now = Date.parse("2025-01-15T12:00:00.000Z");
    const cached = "2025-01-15T10:00:00.000Z";
    expect(isFresh(cached, 10_000, now)).toBe(true);
  });

  it("false after TTL", () => {
    const now = Date.parse("2025-01-15T12:00:00.000Z");
    const cached = "2025-01-15T10:00:00.000Z";
    expect(isFresh(cached, 3600, now)).toBe(false);
  });

  it("false for invalid date", () => {
    expect(isFresh("not-a-date", 100, Date.now())).toBe(false);
  });
});
