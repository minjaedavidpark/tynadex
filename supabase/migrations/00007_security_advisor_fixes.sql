-- ============================================================
-- Security advisor fixes (Supabase linter)
-- - extension_in_public: move pg_trgm to `extensions` when allowed
--   (postgis often cannot: "does not support SET SCHEMA" — leave in public)
-- - rls_disabled_in_public: try RLS on PostGIS catalog in public (often skipped:
--   table owner is the extension, not the migration role — see NOTICE)
-- - function_search_path_mutable: fixed search_path on app functions
-- - rls_enabled_no_policy (INFO): explicit deny for API roles on cache tables
-- ============================================================

-- ---- Extensions: move to extensions schema when PostgreSQL allows it ----
create schema if not exists extensions;

do $ext$
begin
  begin
    execute 'alter extension pg_trgm set schema extensions';
  exception
    when others then
      raise notice 'pg_trgm SET SCHEMA skipped: %', sqlerrm;
  end;

  begin
    execute 'alter extension postgis set schema extensions';
  exception
    when others then
      -- Common on PostGIS: SQLSTATE 0A000 "extension does not support SET SCHEMA"
      raise notice 'postgis SET SCHEMA skipped (not relocatable here): %', sqlerrm;
  end;
end;
$ext$;

-- ---- PostGIS catalog in public: enable RLS only if we own the table ----
-- Local Supabase / Docker: spatial_ref_sys is often owned by supabase_admin (42501).
-- Hosted Supabase migrations may succeed; if not, advisor may still warn — acceptable.
do $rls$
begin
  begin
    if to_regclass('public.spatial_ref_sys') is not null then
      execute 'alter table public.spatial_ref_sys enable row level security';
    end if;
  exception
    when others then
      raise notice 'spatial_ref_sys RLS skipped: %', sqlerrm;
  end;

  begin
    if to_regclass('public.geometry_columns') is not null then
      execute 'alter table public.geometry_columns enable row level security';
    end if;
  exception
    when others then
      raise notice 'geometry_columns RLS skipped: %', sqlerrm;
  end;
end;
$rls$;

-- ---- Functions: immutable search_path (prevents search_path hijacking in SECURITY DEFINER / triggers) ----
-- Include `extensions` when pg_trgm/postgis live there; PostGIS in public still resolves via `public`.
alter function public.handle_updated_at()
  set search_path = public, extensions, pg_temp;

alter function public.handle_new_user()
  set search_path = public, extensions, pg_temp;

alter function public.handle_new_profile()
  set search_path = public, extensions, pg_temp;

alter function public.nearby_profiles(double precision, double precision, double precision)
  set search_path = public, extensions, pg_temp;

alter function public.purge_expired_card_cache(integer, integer)
  set search_path = public, extensions, pg_temp;

-- ---- Cache tables: explicit no-access policies for API roles (service_role still bypasses RLS) ----
drop policy if exists "Block API access to card_search_cache" on public.card_search_cache;
drop policy if exists "Block API access to card_details_cache" on public.card_details_cache;

create policy "Block API access to card_search_cache"
  on public.card_search_cache
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy "Block API access to card_details_cache"
  on public.card_details_cache
  for all
  to anon, authenticated
  using (false)
  with check (false);
