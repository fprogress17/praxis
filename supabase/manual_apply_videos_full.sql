-- =============================================================================
-- ONE PASTE — Supabase Dashboard → SQL Editor → New query → paste ALL → Run
-- Use this if Save video says the videos table is missing / schema cache error.
-- Prerequisite: `public.channels` must exist (run `001_channels.sql` first if not).
-- Safe to re-run: CREATE IF NOT EXISTS + DROP POLICY IF EXISTS where needed.
-- =============================================================================

-- --- 002: table + select/insert RLS (from migrations/002_videos.sql) --------

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels (id) on delete cascade,
  title text not null,
  brief text not null default '',
  script text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists videos_channel_id_idx on public.videos (channel_id);
create index if not exists videos_created_at_idx on public.videos (created_at desc);

alter table public.videos enable row level security;

drop policy if exists "videos_select_anon" on public.videos;
create policy "videos_select_anon"
  on public.videos
  for select
  to anon, authenticated
  using (true);

drop policy if exists "videos_insert_anon" on public.videos;
create policy "videos_insert_anon"
  on public.videos
  for insert
  to anon, authenticated
  with check (true);

grant select, insert on table public.videos to anon, authenticated;

-- --- 003: brief column if you have an old videos table without brief --------

alter table public.videos
  add column if not exists brief text not null default '';

-- --- 004: update policy for Edit video / Save changes (from 004 migration) ---

drop policy if exists "videos_update_anon" on public.videos;
create policy "videos_update_anon"
  on public.videos
  for update
  to anon, authenticated
  using (true)
  with check (true);

grant update on table public.videos to anon, authenticated;
