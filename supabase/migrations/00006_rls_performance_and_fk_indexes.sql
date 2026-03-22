-- ============================================================
-- Performance advisor fixes (Supabase linter):
-- 1) auth_rls_initplan: use (select auth.uid()) so JWT uid is not re-evaluated per row
-- 2) multiple_permissive_policies: single SELECT policy on user_cards (own OR tradeable)
-- 3) unindexed_foreign_keys: indexes on FK columns used in joins/deletes
-- ============================================================

-- ---- Profiles ----
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

create policy "Users can update own profile"
  on public.profiles for update
  using ((select auth.uid()) = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- ---- Binders ----
drop policy if exists "Public binders are viewable by everyone" on public.binders;
drop policy if exists "Users can create own binders" on public.binders;
drop policy if exists "Users can update own binders" on public.binders;
drop policy if exists "Users can delete own binders" on public.binders;

create policy "Public binders are viewable by everyone"
  on public.binders for select
  using (is_public or (select auth.uid()) = user_id);

create policy "Users can create own binders"
  on public.binders for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update own binders"
  on public.binders for update
  using ((select auth.uid()) = user_id);

create policy "Users can delete own binders"
  on public.binders for delete
  using ((select auth.uid()) = user_id);

-- ---- User cards (merge two permissive SELECT policies into one) ----
drop policy if exists "Users can view own cards" on public.user_cards;
drop policy if exists "Tradeable cards are viewable by everyone" on public.user_cards;
drop policy if exists "Users can insert own cards" on public.user_cards;
drop policy if exists "Users can update own cards" on public.user_cards;
drop policy if exists "Users can delete own cards" on public.user_cards;

create policy "Users can view own or tradeable cards"
  on public.user_cards for select
  using (
    (select auth.uid()) = user_id
    or trade_status <> 'none'::public.trade_status
  );

create policy "Users can insert own cards"
  on public.user_cards for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update own cards"
  on public.user_cards for update
  using ((select auth.uid()) = user_id);

create policy "Users can delete own cards"
  on public.user_cards for delete
  using ((select auth.uid()) = user_id);

-- ---- Binder cards ----
drop policy if exists "Binder cards follow binder visibility" on public.binder_cards;
drop policy if exists "Users can manage own binder cards (insert)" on public.binder_cards;
drop policy if exists "Users can manage own binder cards (update)" on public.binder_cards;
drop policy if exists "Users can manage own binder cards (delete)" on public.binder_cards;

create policy "Binder cards follow binder visibility"
  on public.binder_cards for select using (
    exists (
      select 1 from public.binders b
      where b.id = binder_cards.binder_id
        and (b.is_public or b.user_id = (select auth.uid()))
    )
  );

create policy "Users can manage own binder cards (insert)"
  on public.binder_cards for insert with check (
    exists (
      select 1 from public.binders b
      where b.id = binder_cards.binder_id
        and b.user_id = (select auth.uid())
    )
  );

create policy "Users can manage own binder cards (update)"
  on public.binder_cards for update using (
    exists (
      select 1 from public.binders b
      where b.id = binder_cards.binder_id
        and b.user_id = (select auth.uid())
    )
  );

create policy "Users can manage own binder cards (delete)"
  on public.binder_cards for delete using (
    exists (
      select 1 from public.binders b
      where b.id = binder_cards.binder_id
        and b.user_id = (select auth.uid())
    )
  );

-- ---- Wishlists ----
drop policy if exists "Users can view own wishlist" on public.wishlists;
drop policy if exists "Wishlists are viewable by everyone" on public.wishlists;
drop policy if exists "Users can insert into own wishlist" on public.wishlists;
drop policy if exists "Users can update own wishlist" on public.wishlists;
drop policy if exists "Users can delete from own wishlist" on public.wishlists;

-- Anyone can read wishlists (e.g. view another trainer's wishlist).
create policy "Wishlists are viewable by everyone"
  on public.wishlists for select
  using (true);

create policy "Users can insert into own wishlist"
  on public.wishlists for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update own wishlist"
  on public.wishlists for update
  using ((select auth.uid()) = user_id);

create policy "Users can delete from own wishlist"
  on public.wishlists for delete
  using ((select auth.uid()) = user_id);

-- ---- Conversations ----
drop policy if exists "Participants can view conversations" on public.conversations;
drop policy if exists "Authenticated users can create conversations" on public.conversations;

create policy "Participants can view conversations"
  on public.conversations for select using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversations.id
        and cp.user_id = (select auth.uid())
    )
  );

create policy "Authenticated users can create conversations"
  on public.conversations for insert
  with check ((select auth.uid()) is not null);

-- ---- Conversation participants ----
drop policy if exists "Participants can view other participants" on public.conversation_participants;
drop policy if exists "Users can add themselves to conversations" on public.conversation_participants;

create policy "Participants can view other participants"
  on public.conversation_participants for select using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_participants.conversation_id
        and cp.user_id = (select auth.uid())
    )
  );

create policy "Users can add themselves to conversations"
  on public.conversation_participants for insert
  with check ((select auth.uid()) = user_id);

-- ---- Messages ----
drop policy if exists "Participants can view messages" on public.messages;
drop policy if exists "Participants can send messages" on public.messages;

create policy "Participants can view messages"
  on public.messages for select using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id
        and cp.user_id = (select auth.uid())
    )
  );

create policy "Participants can send messages"
  on public.messages for insert with check (
    (select auth.uid()) = sender_id
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id
        and cp.user_id = (select auth.uid())
    )
  );

-- ---- Trade offers ----
drop policy if exists "Trade participants can view offers" on public.trade_offers;
drop policy if exists "Users can create trade offers" on public.trade_offers;
drop policy if exists "Trade participants can update offers" on public.trade_offers;

create policy "Trade participants can view offers"
  on public.trade_offers for select
  using ((select auth.uid()) in (initiator_id, receiver_id));

create policy "Users can create trade offers"
  on public.trade_offers for insert
  with check ((select auth.uid()) = initiator_id);

create policy "Trade participants can update offers"
  on public.trade_offers for update
  using ((select auth.uid()) in (initiator_id, receiver_id));

-- ---- Trade offer items ----
drop policy if exists "Trade participants can view items" on public.trade_offer_items;
drop policy if exists "Users can add own items to trade" on public.trade_offer_items;

create policy "Trade participants can view items"
  on public.trade_offer_items for select using (
    exists (
      select 1 from public.trade_offers t
      where t.id = trade_offer_items.trade_offer_id
        and (select auth.uid()) in (t.initiator_id, t.receiver_id)
    )
  );

create policy "Users can add own items to trade"
  on public.trade_offer_items for insert
  with check ((select auth.uid()) = offered_by);

-- ---- Reviews ----
drop policy if exists "Users can create reviews" on public.reviews;

create policy "Users can create reviews"
  on public.reviews for insert
  with check ((select auth.uid()) = reviewer_id);

-- ---- Storage: avatars (same initplan pattern) ----
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;

create policy "avatars_insert_own"
  on storage.objects
  for insert
  with check (
    bucket_id = 'avatars'
    and (select auth.uid()) is not null
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

create policy "avatars_update_own"
  on storage.objects
  for update
  using (
    bucket_id = 'avatars'
    and (select auth.uid()) is not null
    and split_part(name, '/', 1) = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (select auth.uid()) is not null
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

create policy "avatars_delete_own"
  on storage.objects
  for delete
  using (
    bucket_id = 'avatars'
    and (select auth.uid()) is not null
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

-- ---- Foreign key covering indexes (linter: unindexed_foreign_keys) ----
create index if not exists idx_binder_cards_user_card_id
  on public.binder_cards (user_card_id);

create index if not exists idx_conversation_participants_user_id
  on public.conversation_participants (user_id);

create index if not exists idx_messages_sender_id
  on public.messages (sender_id);

create index if not exists idx_reviews_reviewer_id
  on public.reviews (reviewer_id);

create index if not exists idx_reviews_trade_offer_id
  on public.reviews (trade_offer_id);

create index if not exists idx_trade_offer_items_offered_by
  on public.trade_offer_items (offered_by);

create index if not exists idx_trade_offer_items_user_card_id
  on public.trade_offer_items (user_card_id);

create index if not exists idx_trade_offers_conversation_id
  on public.trade_offers (conversation_id);

create index if not exists idx_trade_offers_message_id
  on public.trade_offers (message_id);
