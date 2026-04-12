-- Run this in Supabase → SQL Editor → New query → Run once.
-- See SETUP-SUPABASE.md for context.

create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null
    check (
      category in (
        'English',
        'History',
        'Geopolitics',
        'Korea social',
        'Technology',
        'Other'
      )
    ),
  brief_note text,
  created_at timestamptz not null default now()
);

create index if not exists channels_created_at_idx on public.channels (created_at desc);

alter table public.channels enable row level security;

-- Dev-friendly: anon key can read/write. Replace with auth-scoped policies before any public deploy.
create policy "channels_select_anon"
  on public.channels
  for select
  to anon, authenticated
  using (true);

create policy "channels_insert_anon"
  on public.channels
  for insert
  to anon, authenticated
  with check (true);

grant select, insert on table public.channels to anon, authenticated;
