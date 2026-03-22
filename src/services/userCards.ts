import { supabase } from "@/src/lib/supabase";

/**
 * Total cards shown in Profile: sum of `user_cards.quantity` for rows that are
 * still placed in at least one of the user's binder slots (`binder_cards`).
 *
 * This matches what you see under Binder — removing a card from a binder only
 * deletes `binder_cards`, not `user_cards`, so counting plain `user_cards`
 * would over-count after removal.
 */
export async function getTotalCardQuantity(userId: string): Promise<number> {
  const { data: binders, error: bindersError } = await supabase
    .from("binders")
    .select("id")
    .eq("user_id", userId);

  if (bindersError) throw bindersError;
  const binderIds = (binders ?? []).map((b) => b.id);
  if (binderIds.length === 0) return 0;

  const { data: placements, error: bcError } = await supabase
    .from("binder_cards")
    .select("user_card_id")
    .in("binder_id", binderIds);

  if (bcError) throw bcError;
  const uniqueIds = [
    ...new Set((placements ?? []).map((p) => p.user_card_id)),
  ];
  if (uniqueIds.length === 0) return 0;

  const { data: rows, error: ucError } = await supabase
    .from("user_cards")
    .select("quantity")
    .in("id", uniqueIds)
    .eq("user_id", userId);

  if (ucError) throw ucError;
  return (rows ?? []).reduce((sum, row) => sum + (row.quantity ?? 0), 0);
}
