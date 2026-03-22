import { tcgFetch } from "./client";
import type { TcgdexSet } from "./types";

export async function getSets(): Promise<TcgdexSet[]> {
  return tcgFetch<TcgdexSet[]>("/sets");
}

export async function getSet(id: string): Promise<TcgdexSet> {
  return tcgFetch<TcgdexSet>(`/sets/${encodeURIComponent(id)}`);
}
