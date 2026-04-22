-- Quick-capture ideas per channel (separate from right-panel notes). Run after 001.

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels (id) on delete cascade,
  body text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists ideas_channel_id_idx on public.ideas (channel_id);
create index if not exists ideas_created_at_idx on public.ideas (created_at desc);

alter table public.ideas enable row level security;

drop policy if exists "ideas_select_anon" on public.ideas;
create policy "ideas_select_anon"
  on public.ideas
  for select
  to anon, authenticated
  using (true);

drop policy if exists "ideas_insert_anon" on public.ideas;
create policy "ideas_insert_anon"
  on public.ideas
  for insert
  to anon, authenticated
  with check (true);

grant select, insert on table public.ideas to anon, authenticated;
