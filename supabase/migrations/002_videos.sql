-- Run in Supabase → SQL Editor after 001_channels.sql exists.

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels (id) on delete cascade,
  title text not null,
  script text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists videos_channel_id_idx on public.videos (channel_id);
create index if not exists videos_created_at_idx on public.videos (created_at desc);

alter table public.videos enable row level security;

create policy "videos_select_anon"
  on public.videos
  for select
  to anon, authenticated
  using (true);

create policy "videos_insert_anon"
  on public.videos
  for insert
  to anon, authenticated
  with check (true);

grant select, insert on table public.videos to anon, authenticated;
