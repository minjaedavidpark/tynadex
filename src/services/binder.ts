import { supabase } from "@/src/lib/supabase";
import type {
  Binder,
  BinderInsert,
  BinderCard,
  BinderCardInsert,
  BinderCardWithDetails,
  UserCard,
} from "@/src/types/database";
import type { TcgdexCard } from "@/src/api/tcgdex/types";

// ── Binder with aggregated card count ───────────────────────

export type BinderWithCount = Binder & { card_count: number };

// ── Binder CRUD ─────────────────────────────────────────────

export async function getUserBinders(
  userId: string
): Promise<BinderWithCount[]> {
  const { data, error } = await supabase
    .from("binders")
    .select("*, binder_cards(count)")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((b: any) => ({
    ...b,
    card_count: b.binder_cards?.[0]?.count ?? 0,
    binder_cards: undefined,
  }));
}

export async function createBinder(insert: BinderInsert): Promise<Binder> {
  const { data, error } = await supabase
    .from("binders")
    .insert(insert)
    .select()
    .single();

  if (error) throw error;
  return data as Binder;
}

export async function updateBinder(
  binderId: string,
  updates: Partial<
    Pick<
      Binder,
      "name" | "description" | "cover_image_url" | "is_public" | "sort_order"
    >
  >
): Promise<Binder> {
  const { data, error } = await supabase
    .from("binders")
    .update(updates)
    .eq("id", binderId)
    .select()
    .single();

  if (error) throw error;
  return data as Binder;
}

export async function deleteBinder(binderId: string): Promise<void> {
  const { error } = await supabase
    .from("binders")
    .delete()
    .eq("id", binderId);

  if (error) throw error;
}

export async function getBinder(binderId: string): Promise<Binder> {
  const { data, error } = await supabase
    .from("binders")
    .select("*")
    .eq("id", binderId)
    .single();

  if (error) throw error;
  return data as Binder;
}

// ── Binder-card queries ─────────────────────────────────────

export async function getBinderCards(
  binderId: string
): Promise<BinderCardWithDetails[]> {
  const { data, error } = await supabase
    .from("binder_cards")
    .select(
      `
      *,
      user_card:user_cards(
        *,
        card:cards(*)
      )
    `
    )
    .eq("binder_id", binderId)
    .order("page_number", { ascending: true })
    .order("slot_index", { ascending: true });

  if (error) throw error;
  return (data ?? []) as BinderCardWithDetails[];
}

export async function addCardToBinder(
  insert: BinderCardInsert
): Promise<BinderCard> {
  const { data, error } = await supabase
    .from("binder_cards")
    .insert(insert)
    .select()
    .single();

  if (error) throw error;
  return data as BinderCard;
}

export async function removeCardFromBinder(
  binderCardId: string
): Promise<void> {
  const { error } = await supabase
    .from("binder_cards")
    .delete()
    .eq("id", binderCardId);

  if (error) throw error;
}

// ── Slot helpers ────────────────────────────────────────────

export async function getNextAvailableSlot(
  binderId: string,
  gridColumns: number,
  gridRows: number
): Promise<{ page_number: number; slot_index: number }> {
  const slotsPerPage = gridColumns * gridRows;

  const { data: occupied, error } = await supabase
    .from("binder_cards")
    .select("page_number, slot_index")
    .eq("binder_id", binderId);

  if (error) throw error;

  const occupiedSet = new Set(
    (occupied ?? []).map((c) => `${c.page_number}:${c.slot_index}`)
  );

  const maxPage = occupied?.length
    ? Math.max(...occupied.map((c) => c.page_number))
    : 1;

  for (let page = 1; page <= maxPage + 1; page++) {
    for (let slot = 0; slot < slotsPerPage; slot++) {
      if (!occupiedSet.has(`${page}:${slot}`)) {
        return { page_number: page, slot_index: slot };
      }
    }
  }

  return { page_number: maxPage + 1, slot_index: 0 };
}

// ── Add a TCGdex card → catalog → user_cards → binder ──────

export async function addTcgdexCardToBinder(
  userId: string,
  binderId: string,
  tcgCard: TcgdexCard,
  gridColumns: number,
  gridRows: number
): Promise<void> {
  const imageHigh = tcgCard.image ? `${tcgCard.image}/high.png` : null;
  const imageLow = tcgCard.image ? `${tcgCard.image}/low.png` : null;

  // 1. Upsert into catalog via RPC
  const { data: catalogCardId, error: rpcError } = await supabase.rpc(
    "upsert_catalog_card",
    {
      p_external_id: tcgCard.id,
      p_name: tcgCard.name,
      p_card_number: tcgCard.localId ?? "unknown",
      p_set_external_id: tcgCard.set?.id ?? null,
      p_set_name: tcgCard.set?.name ?? null,
      p_set_code: tcgCard.set?.id ?? null,
      p_set_logo: tcgCard.set?.logo ?? null,
      p_set_symbol: tcgCard.set?.symbol ?? null,
      p_supertype: tcgCard.category ?? null,
      p_rarity: tcgCard.rarity ?? null,
      p_hp: tcgCard.hp?.toString() ?? null,
      p_image_url: imageLow,
      p_image_url_hires: imageHigh,
    }
  );

  if (rpcError) throw rpcError;

  // 2. Create user_card with TCGdex images as placeholders
  const frontImage =
    imageHigh ?? imageLow ?? "https://via.placeholder.com/245x342";
  const backImage =
    "https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg";

  const { data: userCard, error: ucError } = await supabase
    .from("user_cards")
    .insert({
      user_id: userId,
      card_id: catalogCardId,
      front_image_url: frontImage,
      back_image_url: backImage,
    })
    .select("id")
    .single();

  if (ucError) throw ucError;

  // 3. Place into the next available binder slot
  const slot = await getNextAvailableSlot(binderId, gridColumns, gridRows);

  await addCardToBinder({
    binder_id: binderId,
    user_card_id: (userCard as { id: string }).id,
    page_number: slot.page_number,
    slot_index: slot.slot_index,
  });
}
