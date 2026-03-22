// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enrichSearchResultsWithPricing } from "../_shared/tcgdex_enrich_pricing.ts";
import {
  buildTcgdexSearchUrl,
  hasAtLeastOneSearchFilter,
  isFresh,
  makeCacheKey,
  toFiltersFromUrl,
} from "../_shared/tcgdex_search_utils.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const TCGDEX_BASE_URL = Deno.env.get("TCGDEX_BASE_URL") ?? "https://api.tcgdex.net/v2/en";
const SEARCH_CACHE_TTL_SECONDS = Number(Deno.env.get("CARD_SEARCH_CACHE_TTL_SECONDS") ?? "21600");
/** Parallel GET /cards/:id when includePricing=true (default 4). */
const PRICING_FETCH_CONCURRENCY = Number(Deno.env.get("PRICING_FETCH_CONCURRENCY") ?? "4");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: corsHeaders,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed. Use GET." }, 405);
  }

  try {
    const requestUrl = new URL(req.url);
    const filters = toFiltersFromUrl(requestUrl);

    if (!hasAtLeastOneSearchFilter(filters)) {
      return jsonResponse(
        {
          error: "Provide at least one filter: name, setNumber, or setName.",
        },
        400,
      );
    }

    const cacheKey = makeCacheKey(filters);
    const nowMs = Date.now();

    const { data: cached, error: cacheReadError } = await supabase
      .from("card_search_cache")
      .select("cache_key, payload, cached_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (cacheReadError) {
      console.error("cache read error:", cacheReadError);
    } else if (cached && isFresh(cached.cached_at, SEARCH_CACHE_TTL_SECONDS, nowMs)) {
      return jsonResponse({
        source: "cache",
        filters,
        data: cached.payload,
      });
    }

    const tcgdexUrl = buildTcgdexSearchUrl(TCGDEX_BASE_URL, filters);
    const tcgdexResponse = await fetch(tcgdexUrl);

    if (!tcgdexResponse.ok) {
      const errorText = await tcgdexResponse.text();
      return jsonResponse(
        {
          error: "Failed to fetch cards from TCGdex.",
          status: tcgdexResponse.status,
          details: errorText,
        },
        502,
      );
    }

    let cards = await tcgdexResponse.json();

    if (
      filters.includePricing &&
      Array.isArray(cards) &&
      cards.length > 0 &&
      Number.isFinite(PRICING_FETCH_CONCURRENCY) &&
      PRICING_FETCH_CONCURRENCY > 0
    ) {
      cards = await enrichSearchResultsWithPricing(
        TCGDEX_BASE_URL,
        cards,
        Math.min(20, Math.max(1, Math.floor(PRICING_FETCH_CONCURRENCY))),
      );
    }

    const { error: cacheUpsertError } = await supabase.from("card_search_cache").upsert(
      {
        cache_key: cacheKey,
        query_name: filters.name ?? null,
        query_set_number: filters.setNumber ?? null,
        query_set_name: filters.setName ?? null,
        payload: cards,
        cached_at: new Date().toISOString(),
      },
      { onConflict: "cache_key" },
    );

    if (cacheUpsertError) {
      console.error("cache upsert error:", cacheUpsertError);
    }

    return jsonResponse({
      source: "tcgdex",
      filters,
      data: cards,
    });
  } catch (error) {
    console.error("search-cards error:", error);
    return jsonResponse(
      { error: "Unexpected error while searching cards." },
      500,
    );
  }
});
