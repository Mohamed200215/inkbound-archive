-- Run this in your Supabase project's SQL Editor (or via `supabase db push`
-- if you have the CLI linked to your project) before using the app's
-- login/favourites features. Safe to re-run — policies are dropped and
-- recreated each time.
--
-- Auth itself (sign up, log in, sessions) is handled entirely by
-- Supabase's built-in `auth.users` table — nothing to set up there beyond
-- having Email auth enabled, which is on by default for new projects
-- (Authentication -> Providers -> Email).

create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  manga_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, manga_id)
);

alter table public.favorites enable row level security;

-- `to authenticated` + an ownership predicate in `using`/`with check` is the
-- correct pairing: `to authenticated` alone only checks the role, not which
-- rows belong to the caller. `(select auth.uid())` (vs. bare `auth.uid()`)
-- lets Postgres evaluate it once per statement instead of once per row.
drop policy if exists "Users can view their own favourites" on public.favorites;
create policy "Users can view their own favourites"
  on public.favorites for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add their own favourites" on public.favorites;
create policy "Users can add their own favourites"
  on public.favorites for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can remove their own favourites" on public.favorites;
create policy "Users can remove their own favourites"
  on public.favorites for delete
  to authenticated
  using ((select auth.uid()) = user_id);
