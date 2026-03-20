-- ============================================================
-- Avatars storage bucket + RLS (run against your Supabase project)
-- Object paths MUST be: {auth.uid()}/avatar.{ext}  (first path segment = user id)
-- ============================================================
-- Note: Prefer split_part(...) over storage.foldername() — works on all Supabase
-- versions and matches how the app uploads (userId + '/' + filename).

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "avatars_select_public" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;

-- Anyone can read objects in this bucket (public URLs)
create policy "avatars_select_public"
  on storage.objects
  for select
  using (bucket_id = 'avatars');

-- Logged-in users: only create files under a folder named exactly their user id
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
