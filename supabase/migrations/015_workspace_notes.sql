-- Notes for the whole workspace (Home / no channel selected). Run after 001 is not required — no FK.

create table if not exists public.workspace_notes (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_notes_created_at_idx on public.workspace_notes (created_at desc);

alter table public.workspace_notes enable row level security;

drop policy if exists "workspace_notes_select_anon" on public.workspace_notes;
create policy "workspace_notes_select_anon"
  on public.workspace_notes
  for select
  to anon, authenticated
  using (true);

drop policy if exists "workspace_notes_insert_anon" on public.workspace_notes;
create policy "workspace_notes_insert_anon"
  on public.workspace_notes
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "workspace_notes_update_anon" on public.workspace_notes;
create policy "workspace_notes_update_anon"
  on public.workspace_notes
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "workspace_notes_delete_anon" on public.workspace_notes;
create policy "workspace_notes_delete_anon"
  on public.workspace_notes
  for delete
  to anon, authenticated
  using (true);

grant select, insert, update, delete on table public.workspace_notes to anon, authenticated;

create or replace function public.workspace_notes_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists workspace_notes_set_updated_at on public.workspace_notes;
create trigger workspace_notes_set_updated_at
  before update on public.workspace_notes
  for each row
  execute function public.workspace_notes_set_updated_at();
