-- Links for workspace / channel / video scopes.

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references public.channels(id) on delete cascade,
  video_id uuid references public.videos(id) on delete cascade,
  title text not null default '',
  url text not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  constraint links_video_requires_channel check (video_id is null or channel_id is not null)
);

create index if not exists links_channel_created_at_idx on public.links (channel_id, created_at desc);
create index if not exists links_video_created_at_idx on public.links (video_id, created_at desc);
create index if not exists links_created_at_idx on public.links (created_at desc);

alter table public.links enable row level security;

drop policy if exists "links_select_anon" on public.links;
create policy "links_select_anon"
  on public.links
  for select
  to anon, authenticated
  using (true);

drop policy if exists "links_insert_anon" on public.links;
create policy "links_insert_anon"
  on public.links
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "links_update_anon" on public.links;
create policy "links_update_anon"
  on public.links
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "links_delete_anon" on public.links;
create policy "links_delete_anon"
  on public.links
  for delete
  to anon, authenticated
  using (true);

grant select, insert, update, delete on table public.links to anon, authenticated;
