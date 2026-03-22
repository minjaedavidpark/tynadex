/**
 * TCGdex embeds market data on full card GETs under `pricing` (Cardmarket, TCGplayer).
 * Search/list endpoints return brief objects — merge `pricing` from GET /cards/:id when requested.
 * @see https://tcgdex.dev/markets-prices
 */

export async function enrichSearchResultsWithPricing(
  tcgDexBaseUrl: string,
  briefs: unknown[],
  concurrency: number,
): Promise<unknown[]> {
  const base = tcgDexBaseUrl.replace(/\/$/, "");
  const out: unknown[] = [];

  for (let i = 0; i < briefs.length; i += concurrency) {
    const chunk = briefs.slice(i, i + concurrency);
    const batch = await Promise.all(
      chunk.map(async (item) => {
        if (!item || typeof item !== "object") return item;
        const rec = item as Record<string, unknown>;
        const id = rec.id;
        if (typeof id !== "string" || id.length === 0) return item;

        try {
          const res = await fetch(`${base}/cards/${encodeURIComponent(id)}`);
          if (!res.ok) return item;
          const full = await res.json();
          if (
            full &&
            typeof full === "object" &&
            "pricing" in full &&
            (full as Record<string, unknown>).pricing !== undefined
          ) {
            return {
              ...rec,
              pricing: (full as Record<string, unknown>).pricing,
            };
          }
        } catch {
          // keep brief row if detail fetch fails
        }
        return item;
      }),
    );
    out.push(...batch);
  }

  return out;
}
