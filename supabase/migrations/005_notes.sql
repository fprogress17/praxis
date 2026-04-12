-- Channel-scoped notes for the right panel. Run after 001_channels.sql.
-- Idempotent policies for `supabase db push`.

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels (id) on delete cascade,
  title text not null default '',
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_channel_id_idx on public.notes (channel_id);
create index if not exists notes_created_at_idx on public.notes (created_at desc);

alter table public.notes enable row level security;

drop policy if exists "notes_select_anon" on public.notes;
create policy "notes_select_anon"
  on public.notes
  for select
  to anon, authenticated
  using (true);

drop policy if exists "notes_insert_anon" on public.notes;
create policy "notes_insert_anon"
  on public.notes
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "notes_update_anon" on public.notes;
create policy "notes_update_anon"
  on public.notes
  for update
  to anon, authenticated
  using (true)
  with check (true);

grant select, insert, update on table public.notes to anon, authenticated;

create or replace function public.notes_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
  before update on public.notes
  for each row
  execute function public.notes_set_updated_at();
