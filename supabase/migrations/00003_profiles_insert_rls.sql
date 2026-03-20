-- Allow authenticated users to INSERT their own profile row when UPDATE returns 0 rows
-- (e.g. signup trigger did not run, or project was created before triggers existed).

drop policy if exists "Users can insert own profile" on public.profiles;

create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Ensure the API role can insert (some projects omit this grant on new tables)
grant insert on table public.profiles to authenticated;
