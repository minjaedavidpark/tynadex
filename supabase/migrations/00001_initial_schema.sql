-- ============================================================
-- Tynadex: Initial Database Schema
-- Pokemon TCG Binder & Trading Platform
-- ============================================================

-- Extensions
create extension if not exists "postgis";
create extension if not exists "pg_trgm";

-- ============================================================
-- 1. PROFILES
-- Extends Supabase Auth. One row per signed-up user.
-- ============================================================
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  display_name  text,
  avatar_url    text,
  bio           text,
  location      geography(point, 4326),  -- approximate lat/lng
  location_updated_at timestamptz,
  max_binders   int not null default 1,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- 2. CARD SETS
-- Pokemon TCG expansion sets (e.g. "Scarlet & Violet 151").
-- Populated from Scrydex / Pokemon TCG API.
-- ============================================================
create table public.card_sets (
  id            uuid primary key default gen_random_uuid(),
  external_id   text unique,
  name          text not null,
  code          text unique not null,
  series        text,
  total_cards   int,
  release_date  date,
  logo_url      text,
  symbol_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- 3. CARDS
-- Master catalog of every Pokemon TCG card.
-- Synced from Scrydex; rows are read-only for normal users.
-- ============================================================
create table public.cards (
  id              uuid primary key default gen_random_uuid(),
  external_id     text unique,
  set_id          uuid references public.card_sets(id),
  name            text not null,
  card_number     text not null,
  supertype       text,                   -- Pokemon | Trainer | Energy
  subtypes        text[],                 -- e.g. {Stage 1, V}
  types           text[],                 -- e.g. {Fire, Water}
  rarity          text,
  hp              text,
  image_url       text,
  image_url_hires text,
  market_price_usd  numeric(10,2),
  market_price_cad  numeric(10,2),
  price_updated_at  timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- 4. CARD PRICE HISTORY
-- Periodic snapshots of market prices from eBay / TCGPlayer.
-- ============================================================
create table public.card_price_history (
  id          uuid primary key default gen_random_uuid(),
  card_id     uuid not null references public.cards(id) on delete cascade,
  source      text not null,
  price_usd   numeric(10,2),
  price_cad   numeric(10,2),
  fetched_at  timestamptz not null default now()
);

-- ============================================================
-- 5. BINDERS
-- Each user starts with 1 free binder; can unlock more.
-- ============================================================
create table public.binders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  name            text not null default 'My Binder',
  description     text,
  cover_image_url text,
  grid_columns    int not null default 3,
  grid_rows       int not null default 3,
  is_public       boolean not null default true,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- 6. USER CARDS
-- A specific physical card owned by a user.
-- Users must upload front + back images before adding.
-- ============================================================
create type public.card_condition as enum (
  'mint', 'near_mint', 'lightly_played',
  'moderately_played', 'heavily_played', 'damaged'
);

create type public.trade_status as enum (
  'none', 'for_trade', 'for_sale', 'pending'
);

create table public.user_cards (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  card_id           uuid not null references public.cards(id),
  front_image_url   text not null,
  back_image_url    text not null,
  condition         public.card_condition,
  quantity          int not null default 1 check (quantity > 0),
  trade_status      public.trade_status not null default 'none',
  asking_price_cad  numeric(10,2),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- 7. BINDER CARDS
-- Places a user_card into a specific binder page + slot.
-- ============================================================
create table public.binder_cards (
  id            uuid primary key default gen_random_uuid(),
  binder_id     uuid not null references public.binders(id) on delete cascade,
  user_card_id  uuid not null references public.user_cards(id) on delete cascade,
  page_number   int not null check (page_number >= 1),
  slot_index    int not null check (slot_index >= 0),
  created_at    timestamptz not null default now(),

  unique (binder_id, page_number, slot_index)
);

-- ============================================================
-- 8. WISHLISTS
-- Cards a user wants to acquire.
-- ============================================================
create table public.wishlists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  card_id     uuid not null references public.cards(id),
  priority    int not null default 0,
  notes       text,
  created_at  timestamptz not null default now(),

  unique (user_id, card_id)
);

-- ============================================================
-- 9. CONVERSATIONS
-- A thread between two (or more) users.
-- ============================================================
create table public.conversations (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  joined_at       timestamptz not null default now(),
  last_read_at    timestamptz,

  primary key (conversation_id, user_id)
);

-- ============================================================
-- 10. MESSAGES
-- Individual messages within a conversation.
-- ============================================================
create type public.message_type as enum (
  'text', 'image', 'trade_offer', 'system'
);

create table public.messages (
  id                uuid primary key default gen_random_uuid(),
  conversation_id   uuid not null references public.conversations(id) on delete cascade,
  sender_id         uuid not null references public.profiles(id),
  body              text,
  message_type      public.message_type not null default 'text',
  created_at        timestamptz not null default now()
);

-- ============================================================
-- 11. TRADE OFFERS
-- A structured trade proposal between two users.
-- ============================================================
create type public.trade_offer_status as enum (
  'pending', 'accepted', 'declined', 'cancelled', 'completed'
);

create table public.trade_offers (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id),
  initiator_id    uuid not null references public.profiles(id),
  receiver_id     uuid not null references public.profiles(id),
  message_id      uuid references public.messages(id),
  status          public.trade_offer_status not null default 'pending',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  check (initiator_id != receiver_id)
);

create table public.trade_offer_items (
  id              uuid primary key default gen_random_uuid(),
  trade_offer_id  uuid not null references public.trade_offers(id) on delete cascade,
  user_card_id    uuid not null references public.user_cards(id),
  offered_by      uuid not null references public.profiles(id),

  unique (trade_offer_id, user_card_id)
);

-- ============================================================
-- 12. REVIEWS
-- Post-trade trust ratings between users.
-- ============================================================
create table public.reviews (
  id                uuid primary key default gen_random_uuid(),
  reviewer_id       uuid not null references public.profiles(id),
  reviewed_user_id  uuid not null references public.profiles(id),
  trade_offer_id    uuid references public.trade_offers(id),
  rating            smallint not null check (rating between 1 and 5),
  comment           text,
  created_at        timestamptz not null default now(),

  check (reviewer_id != reviewed_user_id)
);


-- ============================================================
-- INDEXES
-- ============================================================

-- Spatial: find nearby traders
create index idx_profiles_location
  on public.profiles using gist (location);

-- Full-text + trigram: card search
create index idx_cards_name_trgm
  on public.cards using gin (name gin_trgm_ops);
create index idx_cards_name_fts
  on public.cards using gin (to_tsvector('english', name));
create index idx_cards_set_id
  on public.cards (set_id);

-- User cards
create index idx_user_cards_user_id   on public.user_cards (user_id);
create index idx_user_cards_card_id   on public.user_cards (card_id);
create index idx_user_cards_tradeable on public.user_cards (trade_status)
  where trade_status != 'none';

-- Binders
create index idx_binders_user_id on public.binders (user_id);

-- Binder cards
create index idx_binder_cards_binder_id on public.binder_cards (binder_id);

-- Wishlists
create index idx_wishlists_user_id on public.wishlists (user_id);
create index idx_wishlists_card_id on public.wishlists (card_id);

-- Messages
create index idx_messages_conversation on public.messages (conversation_id, created_at);

-- Trade offers
create index idx_trade_offers_initiator on public.trade_offers (initiator_id);
create index idx_trade_offers_receiver  on public.trade_offers (receiver_id);

-- Reviews
create index idx_reviews_reviewed_user on public.reviews (reviewed_user_id);

-- Price history
create index idx_price_history_card
  on public.card_price_history (card_id, fetched_at desc);


-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.card_sets
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.cards
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.binders
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.user_cards
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.conversations
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.trade_offers
  for each row execute function public.handle_updated_at();


-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-create a profile row when a user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'username',
      'user_' || left(new.id::text, 8)
    ),
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'username',
      'Trainer'
    )
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-create the first free binder for new profiles
create or replace function public.handle_new_profile()
returns trigger as $$
begin
  insert into public.binders (user_id, name)
  values (new.id, 'My Binder');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute function public.handle_new_profile();

-- Find nearby traders within a radius (km)
create or replace function public.nearby_profiles(
  lat double precision,
  lng double precision,
  radius_km double precision default 50
)
returns setof public.profiles as $$
begin
  return query
    select *
    from public.profiles
    where location is not null
      and st_dwithin(
            location,
            st_makepoint(lng, lat)::geography,
            radius_km * 1000
          )
    order by location <-> st_makepoint(lng, lat)::geography;
end;
$$ language plpgsql stable;


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles                   enable row level security;
alter table public.card_sets                   enable row level security;
alter table public.cards                       enable row level security;
alter table public.card_price_history          enable row level security;
alter table public.binders                     enable row level security;
alter table public.user_cards                  enable row level security;
alter table public.binder_cards                enable row level security;
alter table public.wishlists                   enable row level security;
alter table public.conversations               enable row level security;
alter table public.conversation_participants   enable row level security;
alter table public.messages                    enable row level security;
alter table public.trade_offers                enable row level security;
alter table public.trade_offer_items           enable row level security;
alter table public.reviews                     enable row level security;

-- ---- Profiles ----

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ---- Card catalog (read-only for all authenticated users) ----

create policy "Card sets are viewable by everyone"
  on public.card_sets for select using (true);

create policy "Cards are viewable by everyone"
  on public.cards for select using (true);

create policy "Card prices are viewable by everyone"
  on public.card_price_history for select using (true);

-- ---- Binders ----

create policy "Public binders are viewable by everyone"
  on public.binders for select
  using (is_public or auth.uid() = user_id);

create policy "Users can create own binders"
  on public.binders for insert
  with check (auth.uid() = user_id);

create policy "Users can update own binders"
  on public.binders for update
  using (auth.uid() = user_id);

create policy "Users can delete own binders"
  on public.binders for delete
  using (auth.uid() = user_id);

-- ---- User cards ----

create policy "Users can view own cards"
  on public.user_cards for select
  using (auth.uid() = user_id);

create policy "Tradeable cards are viewable by everyone"
  on public.user_cards for select
  using (trade_status != 'none');

create policy "Users can insert own cards"
  on public.user_cards for insert
  with check (auth.uid() = user_id);

create policy "Users can update own cards"
  on public.user_cards for update
  using (auth.uid() = user_id);

create policy "Users can delete own cards"
  on public.user_cards for delete
  using (auth.uid() = user_id);

-- ---- Binder cards ----

create policy "Binder cards follow binder visibility"
  on public.binder_cards for select using (
    exists (
      select 1 from public.binders b
      where b.id = binder_cards.binder_id
        and (b.is_public or b.user_id = auth.uid())
    )
  );

create policy "Users can manage own binder cards (insert)"
  on public.binder_cards for insert with check (
    exists (
      select 1 from public.binders b
      where b.id = binder_cards.binder_id
        and b.user_id = auth.uid()
    )
  );

create policy "Users can manage own binder cards (update)"
  on public.binder_cards for update using (
    exists (
      select 1 from public.binders b
      where b.id = binder_cards.binder_id
        and b.user_id = auth.uid()
    )
  );

create policy "Users can manage own binder cards (delete)"
  on public.binder_cards for delete using (
    exists (
      select 1 from public.binders b
      where b.id = binder_cards.binder_id
        and b.user_id = auth.uid()
    )
  );

-- ---- Wishlists ----

create policy "Users can view own wishlist"
  on public.wishlists for select
  using (auth.uid() = user_id);

create policy "Users can insert into own wishlist"
  on public.wishlists for insert
  with check (auth.uid() = user_id);

create policy "Users can update own wishlist"
  on public.wishlists for update
  using (auth.uid() = user_id);

create policy "Users can delete from own wishlist"
  on public.wishlists for delete
  using (auth.uid() = user_id);

-- ---- Conversations ----

create policy "Participants can view conversations"
  on public.conversations for select using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversations.id
        and cp.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create conversations"
  on public.conversations for insert
  with check (auth.uid() is not null);

-- ---- Conversation participants ----

create policy "Participants can view other participants"
  on public.conversation_participants for select using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_participants.conversation_id
        and cp.user_id = auth.uid()
    )
  );

create policy "Users can add themselves to conversations"
  on public.conversation_participants for insert
  with check (auth.uid() = user_id);

-- ---- Messages ----

create policy "Participants can view messages"
  on public.messages for select using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id
        and cp.user_id = auth.uid()
    )
  );

create policy "Participants can send messages"
  on public.messages for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id
        and cp.user_id = auth.uid()
    )
  );

-- ---- Trade offers ----

create policy "Trade participants can view offers"
  on public.trade_offers for select
  using (auth.uid() in (initiator_id, receiver_id));

create policy "Users can create trade offers"
  on public.trade_offers for insert
  with check (auth.uid() = initiator_id);

create policy "Trade participants can update offers"
  on public.trade_offers for update
  using (auth.uid() in (initiator_id, receiver_id));

-- ---- Trade offer items ----

create policy "Trade participants can view items"
  on public.trade_offer_items for select using (
    exists (
      select 1 from public.trade_offers t
      where t.id = trade_offer_items.trade_offer_id
        and auth.uid() in (t.initiator_id, t.receiver_id)
    )
  );

create policy "Users can add own items to trade"
  on public.trade_offer_items for insert
  with check (auth.uid() = offered_by);

-- ---- Reviews ----

create policy "Reviews are viewable by everyone"
  on public.reviews for select using (true);

create policy "Users can create reviews"
  on public.reviews for insert
  with check (auth.uid() = reviewer_id);


-- ============================================================
-- STORAGE BUCKETS (run via Supabase dashboard or SQL editor)
-- ============================================================
-- insert into storage.buckets (id, name, public)
--   values ('card-images', 'card-images', true);
-- insert into storage.buckets (id, name, public)
--   values ('avatars', 'avatars', true);
-- insert into storage.buckets (id, name, public)
--   values ('binder-covers', 'binder-covers', true);
