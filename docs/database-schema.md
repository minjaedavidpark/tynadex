# TogeDex Database Schema

## Overview

TogeDex uses **PostgreSQL on Supabase** with PostGIS for location queries and Row Level Security (RLS) for data access control. The schema is defined in `supabase/migrations/00001_initial_schema.sql`.

---

## Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  auth.users  │──1:1──│   profiles   │──1:N──│   binders    │
└──────────────┘       └──────┬───────┘       └──────┬───────┘
                              │                      │
                         1:N  │                 1:N  │
                              ▼                      ▼
                       ┌──────────────┐       ┌──────────────┐
                       │  user_cards  │◄──────│ binder_cards │
                       └──────┬───────┘       └──────────────┘
                              │
                         N:1  │
                              ▼
┌──────────────┐       ┌──────────────┐
│  card_sets   │──1:N──│    cards     │
└──────────────┘       └──────┬───────┘
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
             ┌───────────┐ ┌─────────┐ ┌──────────────────┐
             │ wishlists │ │  (join) │ │ card_price_history│
             └───────────┘ └─────────┘ └──────────────────┘

┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│conversations │──1:N──│   messages   │       │   reviews    │
└──────┬───────┘       └──────────────┘       └──────────────┘
       │
  ┌────┴────┐
  ▼         ▼
┌────────────────────────┐  ┌──────────────────────┐
│conversation_participants│  │    trade_offers      │──1:N──┐
└────────────────────────┘  └──────────────────────┘       │
                                                            ▼
                                                  ┌──────────────────┐
                                                  │trade_offer_items │
                                                  └──────────────────┘
```

---

## Tables

### profiles
Extends Supabase Auth. Created automatically when a user signs up.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | References `auth.users(id)` |
| username | text (unique) | Required, unique handle |
| display_name | text | Shown in UI |
| avatar_url | text | Supabase Storage path |
| bio | text | Short user bio |
| location | geography(point) | Approximate lat/lng for nearby discovery |
| location_updated_at | timestamptz | When location was last refreshed |
| max_binders | int | Default 1 (free tier) |
| created_at | timestamptz | |
| updated_at | timestamptz | Auto-updated via trigger |

### card_sets
Pokemon TCG expansion sets. Populated from Scrydex API.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| external_id | text (unique) | ID from Scrydex |
| name | text | e.g. "Scarlet & Violet 151" |
| code | text (unique) | e.g. "sv3pt5" |
| series | text | e.g. "Scarlet & Violet" |
| total_cards | int | Cards in the set |
| release_date | date | |
| logo_url | text | |
| symbol_url | text | |

### cards
Master catalog of every Pokemon TCG card. Read-only for normal users.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| external_id | text (unique) | ID from Scrydex |
| set_id | uuid (FK → card_sets) | |
| name | text | Card name |
| card_number | text | e.g. "25/198" |
| supertype | text | Pokemon / Trainer / Energy |
| subtypes | text[] | e.g. {Stage 1, V} |
| types | text[] | e.g. {Fire, Water} |
| rarity | text | e.g. "Rare Holo V" |
| hp | text | |
| image_url | text | Official card image |
| image_url_hires | text | High-res version |
| market_price_usd | numeric(10,2) | Latest market price |
| market_price_cad | numeric(10,2) | Latest market price (CAD) |
| price_updated_at | timestamptz | When price was last fetched |

### card_price_history
Periodic snapshots of card market prices from eBay / TCGPlayer.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| card_id | uuid (FK → cards) | |
| source | text | 'ebay', 'tcgplayer', etc. |
| price_usd | numeric(10,2) | |
| price_cad | numeric(10,2) | |
| fetched_at | timestamptz | |

### binders
A user's card binder. Users start with 1 free binder.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK → profiles) | Owner |
| name | text | Default "My Binder" |
| description | text | |
| cover_image_url | text | Cosmetic |
| grid_columns | int | Default 3 (for 3x3 layout) |
| grid_rows | int | Default 3 |
| is_public | boolean | Default true |
| sort_order | int | For ordering multiple binders |

### user_cards
A specific physical card owned by a user. Users must upload front + back images before a card is added.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK → profiles) | Owner |
| card_id | uuid (FK → cards) | Which catalog card |
| front_image_url | text | **Required** — user-uploaded photo |
| back_image_url | text | **Required** — user-uploaded photo |
| condition | enum | mint, near_mint, lightly_played, moderately_played, heavily_played, damaged |
| quantity | int | Default 1, must be > 0 |
| trade_status | enum | none, for_trade, for_sale, pending |
| asking_price_cad | numeric(10,2) | Only if trade_status = 'for_sale' |
| notes | text | |

### binder_cards
Places a `user_card` into a specific page + slot within a binder.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| binder_id | uuid (FK → binders) | |
| user_card_id | uuid (FK → user_cards) | |
| page_number | int | 1-based page number |
| slot_index | int | 0-based position (L→R, T→B) |

**Constraint:** unique `(binder_id, page_number, slot_index)` — one card per slot.

### wishlists
Cards a user wants to acquire.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK → profiles) | |
| card_id | uuid (FK → cards) | |
| priority | int | Higher = more wanted |
| notes | text | |

**Constraint:** unique `(user_id, card_id)`.

### conversations
A messaging thread between users (typically for trade negotiation).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### conversation_participants
Who is in each conversation.

| Column | Type | Notes |
|--------|------|-------|
| conversation_id | uuid (FK → conversations) | Composite PK |
| user_id | uuid (FK → profiles) | Composite PK |
| joined_at | timestamptz | |
| last_read_at | timestamptz | For unread badge tracking |

### messages
Individual messages in a conversation.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| conversation_id | uuid (FK → conversations) | |
| sender_id | uuid (FK → profiles) | |
| body | text | Message content |
| message_type | enum | text, image, trade_offer, system |
| created_at | timestamptz | |

### trade_offers
A structured trade proposal tied to a conversation.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| conversation_id | uuid (FK → conversations) | |
| initiator_id | uuid (FK → profiles) | Who proposed |
| receiver_id | uuid (FK → profiles) | Who it's proposed to |
| message_id | uuid (FK → messages) | Optional link to the message |
| status | enum | pending, accepted, declined, cancelled, completed |
| notes | text | |

**Constraint:** `initiator_id != receiver_id`.

### trade_offer_items
Cards included in a trade offer (from either side).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| trade_offer_id | uuid (FK → trade_offers) | |
| user_card_id | uuid (FK → user_cards) | The specific card |
| offered_by | uuid (FK → profiles) | Who's giving this card |

### reviews
Post-trade trust ratings.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| reviewer_id | uuid (FK → profiles) | |
| reviewed_user_id | uuid (FK → profiles) | |
| trade_offer_id | uuid (FK → trade_offers) | Optional link to trade |
| rating | smallint | 1–5 stars |
| comment | text | |

**Constraint:** `reviewer_id != reviewed_user_id`.

---

## Design Decisions

### Separation of `cards` vs `user_cards`
The `cards` table is the master **catalog** (read-only, synced from Scrydex). `user_cards` represents a user's **physical copy** with their own uploaded images and condition. This separates catalog data from user data cleanly.

### Binder page/slot model
Rather than a complex page entity, `binder_cards` uses `(page_number, slot_index)` to map cards into the binder grid. The number of slots per page is derived from `binders.grid_columns * binders.grid_rows`. A unique constraint on `(binder_id, page_number, slot_index)` prevents placing two cards in the same slot.

### Location as `geography(point)`
PostGIS `geography` type stores lat/lng and enables efficient radius queries via `ST_DWithin`. The `nearby_profiles()` function wraps this for the app. Location is intentionally approximate — stored as a single point rather than a precise address.

### Image uploads required
`user_cards.front_image_url` and `back_image_url` are both `NOT NULL`, enforcing the requirement that users must upload photos before adding a card. Images are stored in Supabase Storage (`card-images` bucket).

### Trade status on user_cards
Instead of a separate trade listing table, `trade_status` lives directly on `user_cards` (enum: none, for_trade, for_sale, pending). This simplifies queries for "show me all tradeable cards near me" and avoids an extra join.

### Messaging model
Conversations are generic (supporting 2+ participants), enabling future group trades. Messages have a `message_type` enum so the UI can render trade offers, images, and system notifications differently.

### Row Level Security
Every table has RLS enabled. Key policies:
- **Catalog data** (cards, sets, prices): readable by everyone
- **Profiles**: publicly readable, only self-updatable
- **Binders**: public binders readable by everyone, private binders only by owner
- **User cards**: own cards always visible; cards marked for trade visible to everyone
- **Messages/conversations**: only participants can read/write
- **Trade offers**: only initiator and receiver can view/update
- **Reviews**: publicly readable, only creatable by the reviewer

### Auto-created resources
- **Profile**: created automatically when a user signs up (trigger on `auth.users`)
- **First binder**: created automatically when a profile is created (trigger on `profiles`)

---

## Storage Buckets

| Bucket | Purpose | Public |
|--------|---------|--------|
| `card-images` | User-uploaded front/back card photos | Yes |
| `avatars` | User profile pictures | Yes |
| `binder-covers` | Custom binder cover images | Yes |

Apply `supabase/migrations/00002_storage_avatars.sql` and `00003_profiles_insert_rls.sql` in the Supabase SQL editor (or via CLI).

**If uploads or name save still show RLS errors**, open **`supabase/migrations/00004_rls_hotfix_run_in_dashboard.sql`**, copy the whole file into **Dashboard → SQL → New query**, and **Run** once. It reapplies bucket + storage policies (using `split_part` + `auth.uid()`, which fixes common Supabase policy issues) and the `profiles` insert policy + `GRANT`.

---

## Key Queries

### Find nearby traders
```sql
select * from public.nearby_profiles(43.6532, -79.3832, 25);
-- Returns profiles within 25km of downtown Toronto
```

### Get a user's binder with cards
```sql
select bc.page_number, bc.slot_index,
       c.name, c.image_url, c.rarity,
       uc.front_image_url, uc.condition, uc.trade_status
from binder_cards bc
join user_cards uc on uc.id = bc.user_card_id
join cards c on c.id = uc.card_id
where bc.binder_id = '<binder-uuid>'
order by bc.page_number, bc.slot_index;
```

### Search cards by name (fuzzy)
```sql
select * from cards
where name % 'Charizard'  -- trigram similarity
order by similarity(name, 'Charizard') desc
limit 20;
```

### Get tradeable cards near me
```sql
select p.username, p.display_name,
       c.name, c.rarity, uc.condition, uc.trade_status, uc.asking_price_cad
from user_cards uc
join profiles p on p.id = uc.user_id
join cards c on c.id = uc.card_id
where uc.trade_status != 'none'
  and st_dwithin(p.location, st_makepoint(-79.38, 43.65)::geography, 50000)
order by p.location <-> st_makepoint(-79.38, 43.65)::geography;
```
