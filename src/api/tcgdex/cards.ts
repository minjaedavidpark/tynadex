import { tcgFetch } from "./client";
import type { TcgdexCard, TcgdexCardSummary } from "./types";

export async function searchCards(
  query: string
): Promise<TcgdexCardSummary[]> {
  if (!query.trim()) return [];
  const encoded = encodeURIComponent(query.trim());
  try {
    return await tcgFetch<TcgdexCardSummary[]>(
      `/cards?name=like:${encoded}`
    );
  } catch {
    return [];
  }
}

export async function getCard(id: string): Promise<TcgdexCard> {
  return tcgFetch<TcgdexCard>(`/cards/${encodeURIComponent(id)}`);
}
