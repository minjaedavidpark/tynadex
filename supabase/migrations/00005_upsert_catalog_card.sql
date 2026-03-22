-- ============================================================
-- RPC: upsert_catalog_card
-- Allows authenticated clients to upsert a card (and its set)
-- into the read-only catalog tables via SECURITY DEFINER,
-- bypassing RLS. Returns the catalog card's UUID.
-- ============================================================

create or replace function public.upsert_catalog_card(
  p_external_id     text,
  p_name            text,
  p_card_number     text,
  p_set_external_id text    default null,
  p_set_name        text    default null,
  p_set_code        text    default null,
  p_set_logo        text    default null,
  p_set_symbol      text    default null,
  p_supertype       text    default null,
  p_rarity          text    default null,
  p_hp              text    default null,
  p_image_url       text    default null,
  p_image_url_hires text    default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card_id uuid;
  v_set_id  uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Upsert set when provided
  if p_set_external_id is not null then
    select id into v_set_id
      from card_sets
     where external_id = p_set_external_id;

    if v_set_id is null then
      insert into card_sets (external_id, name, code, logo_url, symbol_url)
      values (
        p_set_external_id,
        coalesce(p_set_name, p_set_external_id),
        coalesce(p_set_code, p_set_external_id),
        p_set_logo,
        p_set_symbol
      )
      returning id into v_set_id;
    end if;
  end if;

  -- Upsert card
  select id into v_card_id
    from cards
   where external_id = p_external_id;

  if v_card_id is null then
    insert into cards (
      external_id, set_id, name, card_number,
      supertype, rarity, hp,
      image_url, image_url_hires
    )
    values (
      p_external_id, v_set_id, p_name, p_card_number,
      p_supertype, p_rarity, p_hp,
      p_image_url, p_image_url_hires
    )
    returning id into v_card_id;
  end if;

  return v_card_id;
end;
$$;
