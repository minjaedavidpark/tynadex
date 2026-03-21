/**
 * TypeScript types generated from the Supabase database schema.
 * These map 1:1 to the tables in supabase/migrations/00001_initial_schema.sql.
 *
 * Usage with Supabase client:
 *   const { data } = await supabase.from('profiles').select('*')
 *   // data is typed as Profile[]
 */

// ── Enums ──────────────────────────────────────────────────

export type CardCondition =
  | "mint"
  | "near_mint"
  | "lightly_played"
  | "moderately_played"
  | "heavily_played"
  | "damaged";

export type TradeStatus = "none" | "for_trade" | "for_sale" | "pending";

export type MessageType = "text" | "image" | "trade_offer" | "system";

export type TradeOfferStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled"
  | "completed";

// ── Row types ──────────────────────────────────────────────

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: unknown | null; // PostGIS geography; use lat/lng helpers
  location_updated_at: string | null;
  max_binders: number;
  created_at: string;
  updated_at: string;
}

export interface CardSet {
  id: string;
  external_id: string | null;
  name: string;
  code: string;
  series: string | null;
  total_cards: number | null;
  release_date: string | null;
  logo_url: string | null;
  symbol_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  external_id: string | null;
  set_id: string | null;
  name: string;
  card_number: string;
  supertype: string | null;
  subtypes: string[] | null;
  types: string[] | null;
  rarity: string | null;
  hp: string | null;
  image_url: string | null;
  image_url_hires: string | null;
  market_price_usd: number | null;
  market_price_cad: number | null;
  price_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CardPriceHistory {
  id: string;
  card_id: string;
  source: string;
  price_usd: number | null;
  price_cad: number | null;
  fetched_at: string;
}

export interface Binder {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  grid_columns: number;
  grid_rows: number;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserCard {
  id: string;
  user_id: string;
  card_id: string;
  front_image_url: string;
  back_image_url: string;
  condition: CardCondition | null;
  quantity: number;
  trade_status: TradeStatus;
  asking_price_cad: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BinderCard {
  id: string;
  binder_id: string;
  user_card_id: string;
  page_number: number;
  slot_index: number;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  card_id: string;
  priority: number;
  notes: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipant {
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  message_type: MessageType;
  created_at: string;
}

export interface TradeOffer {
  id: string;
  conversation_id: string | null;
  initiator_id: string;
  receiver_id: string;
  message_id: string | null;
  status: TradeOfferStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TradeOfferItem {
  id: string;
  trade_offer_id: string;
  user_card_id: string;
  offered_by: string;
}

export interface Review {
  id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  trade_offer_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

// ── Insert types (omit server-generated fields) ────────────

export type ProfileInsert = Pick<Profile, "id" | "username"> &
  Partial<Pick<Profile, "display_name" | "avatar_url" | "bio">>;

export type BinderInsert = Pick<Binder, "user_id"> &
  Partial<
    Pick<
      Binder,
      | "name"
      | "description"
      | "cover_image_url"
      | "grid_columns"
      | "grid_rows"
      | "is_public"
      | "sort_order"
    >
  >;

export type UserCardInsert = Pick<
  UserCard,
  "user_id" | "card_id" | "front_image_url" | "back_image_url"
> &
  Partial<
    Pick<
      UserCard,
      "condition" | "quantity" | "trade_status" | "asking_price_cad" | "notes"
    >
  >;

export type BinderCardInsert = Pick<
  BinderCard,
  "binder_id" | "user_card_id" | "page_number" | "slot_index"
>;

export type WishlistInsert = Pick<WishlistItem, "user_id" | "card_id"> &
  Partial<Pick<WishlistItem, "priority" | "notes">>;

export type MessageInsert = Pick<
  Message,
  "conversation_id" | "sender_id"
> &
  Partial<Pick<Message, "body" | "message_type">>;

export type TradeOfferInsert = Pick<
  TradeOffer,
  "initiator_id" | "receiver_id"
> &
  Partial<
    Pick<TradeOffer, "conversation_id" | "message_id" | "status" | "notes">
  >;

export type ReviewInsert = Pick<
  Review,
  "reviewer_id" | "reviewed_user_id" | "rating"
> &
  Partial<Pick<Review, "trade_offer_id" | "comment">>;

// ── Joined / enriched types for common queries ─────────────

export interface UserCardWithDetails extends UserCard {
  card: Card;
}

export interface BinderCardWithDetails extends BinderCard {
  user_card: UserCard & { card: Card };
}

export interface TradeOfferWithItems extends TradeOffer {
  items: (TradeOfferItem & { user_card: UserCardWithDetails })[];
  initiator: Profile;
  receiver: Profile;
}

export interface ConversationWithParticipants extends Conversation {
  participants: (ConversationParticipant & { profile: Profile })[];
  last_message?: Message;
}
