// @ts-nocheck
/**
 * Full card JSON from TCGdex includes `pricing` when listed on marketplaces
 * (Cardmarket EUR, TCGplayer USD). See https://tcgdex.dev/markets-prices
 * No extra query param required — response is passed through as-is.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCardIdFromUrl, isFresh } from "../_shared/tcgdex_search_utils.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const TCGDEX_BASE_URL = Deno.env.get("TCGDEX_BASE_URL") ?? "https://api.tcgdex.net/v2/en";
const CARD_DETAILS_CACHE_TTL_SECONDS = Number(Deno.env.get("CARD_DETAILS_CACHE_TTL_SECONDS") ?? "86400");

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
    const cardId = getCardIdFromUrl(requestUrl);

    if (!cardId) {
      return jsonResponse({ error: "Missing required query param: cardId" }, 400);
    }

    const nowMs = Date.now();

    const { data: cached, error: cacheReadError } = await supabase
      .from("card_details_cache")
      .select("card_id, payload, cached_at")
      .eq("card_id", cardId)
      .maybeSingle();

    if (cacheReadError) {
      console.error("details cache read error:", cacheReadError);
    } else if (cached && isFresh(cached.cached_at, CARD_DETAILS_CACHE_TTL_SECONDS, nowMs)) {
      return jsonResponse({
        source: "cache",
        cardId,
        data: cached.payload,
      });
    }

    const base = TCGDEX_BASE_URL.replace(/\/$/, "");
    const tcgdexResponse = await fetch(`${base}/cards/${encodeURIComponent(cardId)}`);

    if (!tcgdexResponse.ok) {
      const errorText = await tcgdexResponse.text();
      return jsonResponse(
        {
          error: "Failed to fetch card details from TCGdex.",
          status: tcgdexResponse.status,
          details: errorText,
        },
        502,
      );
    }

    const card = await tcgdexResponse.json();

    const { error: cacheUpsertError } = await supabase.from("card_details_cache").upsert(
      {
        card_id: cardId,
        payload: card,
        cached_at: new Date().toISOString(),
      },
      { onConflict: "card_id" },
    );

    if (cacheUpsertError) {
      console.error("details cache upsert error:", cacheUpsertError);
    }

    return jsonResponse({
      source: "tcgdex",
      cardId,
      data: card,
    });
  } catch (error) {
    console.error("get-cards error:", error);
    return jsonResponse({ error: "Unexpected error while getting card." }, 500);
  }
});
