-- Cache table for card search responses
create table if not exists public.card_search_cache (
  cache_key text primary key,
  query_name text,
  query_set_number text,
  query_set_name text,
  payload jsonb not null,
  cached_at timestamptz not null default now()
);

create index if not exists idx_card_search_cache_cached_at
  on public.card_search_cache (cached_at desc);

-- Cache table for full card detail responses
create table if not exists public.card_details_cache (
  card_id text primary key,
  payload jsonb not null,
  cached_at timestamptz not null default now()
);

create index if not exists idx_card_details_cache_cached_at
  on public.card_details_cache (cached_at desc);

-- Keep cache accessible from edge functions only (service role bypasses RLS)
alter table public.card_search_cache enable row level security;
alter table public.card_details_cache enable row level security;

-- Optional helper cleanup function (call from cron or manually)
create or replace function public.purge_expired_card_cache(
  search_ttl_seconds int default 21600,
  details_ttl_seconds int default 86400
)
returns void
language plpgsql
as $$
begin
  delete from public.card_search_cache
  where cached_at < now() - make_interval(secs => search_ttl_seconds);

  delete from public.card_details_cache
  where cached_at < now() - make_interval(secs => details_ttl_seconds);
end;
$$;
