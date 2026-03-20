-- ============================================================
-- HOTFIX: Run this ENTIRE file in Supabase Dashboard → SQL → New query → Run
-- Use if you still see:
--   • "new row violates row-level security policy" (storage upload), or
--   • "row-level security policy for table profiles" (name save).
--
-- Safe to run multiple times (drops/recreates our policies only).
-- ============================================================

-- ── Storage: avatars bucket + policies ─────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "avatars_select_public" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;

create policy "avatars_select_public"
  on storage.objects
  for select
  using (bucket_id = 'avatars');

create policy "avatars_insert_own"
  on storage.objects
  for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects
  for update
  using (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "avatars_delete_own"
  on storage.objects
  for delete
  using (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and split_part(name, '/', 1) = auth.uid()::text
  );

-- ── Table: allow profile self-insert ───────────────────────
drop policy if exists "Users can insert own profile" on public.profiles;

create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

grant insert on table public.profiles to authenticated;
