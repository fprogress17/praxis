-- Ideas for channels you have not created yet (sidebar list). No FK to channels.

create table if not exists public.workspace_ideas (
  id uuid primary key default gen_random_uuid(),
  body text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists workspace_ideas_created_at_idx on public.workspace_ideas (created_at desc);

alter table public.workspace_ideas enable row level security;

drop policy if exists "workspace_ideas_select_anon" on public.workspace_ideas;
create policy "workspace_ideas_select_anon"
  on public.workspace_ideas
  for select
  to anon, authenticated
  using (true);

drop policy if exists "workspace_ideas_insert_anon" on public.workspace_ideas;
create policy "workspace_ideas_insert_anon"
  on public.workspace_ideas
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "workspace_ideas_update_anon" on public.workspace_ideas;
create policy "workspace_ideas_update_anon"
  on public.workspace_ideas
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "workspace_ideas_delete_anon" on public.workspace_ideas;
create policy "workspace_ideas_delete_anon"
  on public.workspace_ideas
  for delete
  to anon, authenticated
  using (true);

grant select, insert, update, delete on table public.workspace_ideas to anon, authenticated;
