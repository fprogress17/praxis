-- Files for workspace / channel / video scopes.
-- Binary data lives in Supabase Storage bucket "praxis-files"; this table stores metadata.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('praxis-files', 'praxis-files', false, 52428800, null)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references public.channels(id) on delete cascade,
  video_id uuid references public.videos(id) on delete cascade,
  bucket text not null default 'praxis-files',
  object_path text not null unique,
  name text not null,
  mime_type text not null default '',
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now(),
  constraint files_video_requires_channel check (video_id is null or channel_id is not null)
);

create index if not exists files_channel_created_at_idx on public.files (channel_id, created_at desc);
create index if not exists files_video_created_at_idx on public.files (video_id, created_at desc);
create index if not exists files_created_at_idx on public.files (created_at desc);

alter table public.files enable row level security;

drop policy if exists "files_select_anon" on public.files;
create policy "files_select_anon"
  on public.files
  for select
  to anon, authenticated
  using (true);

drop policy if exists "files_insert_anon" on public.files;
create policy "files_insert_anon"
  on public.files
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "files_delete_anon" on public.files;
create policy "files_delete_anon"
  on public.files
  for delete
  to anon, authenticated
  using (true);

grant select, insert, delete on table public.files to anon, authenticated;

drop policy if exists "praxis_files_select_anon" on storage.objects;
create policy "praxis_files_select_anon"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'praxis-files');

drop policy if exists "praxis_files_insert_anon" on storage.objects;
create policy "praxis_files_insert_anon"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'praxis-files');

drop policy if exists "praxis_files_update_anon" on storage.objects;
create policy "praxis_files_update_anon"
  on storage.objects
  for update
  to anon, authenticated
  using (bucket_id = 'praxis-files')
  with check (bucket_id = 'praxis-files');

drop policy if exists "praxis_files_delete_anon" on storage.objects;
create policy "praxis_files_delete_anon"
  on storage.objects
  for delete
  to anon, authenticated
  using (bucket_id = 'praxis-files');
