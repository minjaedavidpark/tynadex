/**
 * Integration tests: hit real Edge Functions (local or production).
 *
 * Setup:
 *   1. supabase start && supabase db reset
 *   2. supabase functions serve --env-file supabase/.env
 *   3. PowerShell:
 *      $env:SUPABASE_FUNCTIONS_TEST_BASE="http://127.0.0.1:54321/functions/v1"
 *      $env:SUPABASE_FUNCTIONS_TEST_ANON_KEY="<Publishable key from supabase status>"
 *      npm run test:integration
 *
 * Or run all tests: unit tests always run; this file skips when env is unset.
 */
import { describe, expect, it } from "vitest";

const base = process.env.SUPABASE_FUNCTIONS_TEST_BASE?.replace(/\/$/, "");
const anonKey = process.env.SUPABASE_FUNCTIONS_TEST_ANON_KEY;

const integration = base && anonKey ? describe : describe.skip;

function headers(): HeadersInit {
  return {
    apikey: anonKey!,
    Authorization: `Bearer ${anonKey!}`,
  };
}

integration("tcgdex-search-cards (integration)", () => {
  it("returns 400 when no search filters", async () => {
    const res = await fetch(`${base}/tcgdex-search-cards`, {
      headers: headers(),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/at least one filter/i);
  });

  it("returns 405 for POST", async () => {
    const res = await fetch(`${base}/tcgdex-search-cards`, {
      method: "POST",
      headers: headers(),
    });
    expect(res.status).toBe(405);
  });

  it("returns 200 and tcgdex/cache payload for name search", async () => {
    const res = await fetch(`${base}/tcgdex-search-cards?name=pikachu&itemsPerPage=5`, {
      headers: headers(),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("source");
    expect(["cache", "tcgdex"]).toContain(body.source);
    expect(body).toHaveProperty("filters");
    expect(body).toHaveProperty("data");
    expect(Array.isArray(body.data)).toBe(true);
  });
});

integration("tcgdex-get-cards (integration)", () => {
  it("returns 400 when cardId missing", async () => {
    const res = await fetch(`${base}/tcgdex-get-cards`, {
      headers: headers(),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/cardId/i);
  });

  it("returns 200 for a known card id", async () => {
    const res = await fetch(`${base}/tcgdex-get-cards?cardId=base1-4`, {
      headers: headers(),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("source");
    expect(body.cardId).toBe("base1-4");
    expect(body).toHaveProperty("data");
    expect(body.data).toHaveProperty("id");
  });
});
