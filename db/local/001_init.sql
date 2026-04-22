create extension if not exists pgcrypto;

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
  position int,
  created_at timestamptz not null default now()
);

create index if not exists channels_created_at_idx on public.channels (created_at desc);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels (id) on delete cascade,
  episode text not null default '',
  status text not null default 'draft'
    check (
      status in (
        'draft',
        'published',
        'skip',
        'to_be_published'
      )
    ),
  title text not null,
  brief text not null default '',
  script text not null default '',
  tts_script text not null default '',
  next_episode_promise text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists videos_channel_id_idx on public.videos (channel_id);
create index if not exists videos_created_at_idx on public.videos (created_at desc);
create unique index if not exists videos_channel_episode_unique
  on public.videos (channel_id, episode)
  where episode <> '';

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels (id) on delete cascade,
  video_id uuid references public.videos (id) on delete cascade,
  title text not null default '',
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_channel_id_idx on public.notes (channel_id);
create index if not exists notes_video_id_idx on public.notes (video_id);
create index if not exists notes_created_at_idx on public.notes (created_at desc);
create index if not exists notes_channel_video_null_idx on public.notes (channel_id) where video_id is null;

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

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels (id) on delete cascade,
  body text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists ideas_channel_id_idx on public.ideas (channel_id);
create index if not exists ideas_created_at_idx on public.ideas (created_at desc);

create table if not exists public.workspace_ideas (
  id uuid primary key default gen_random_uuid(),
  body text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists workspace_ideas_created_at_idx on public.workspace_ideas (created_at desc);

create table if not exists public.workspace_notes (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_notes_created_at_idx on public.workspace_notes (created_at desc);

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

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references public.channels(id) on delete cascade,
  video_id uuid references public.videos(id) on delete cascade,
  bucket text not null default 'local-files',
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

create table if not exists public.script_versions (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  script_type text not null check (script_type in ('script', 'tts_script')),
  version_number int not null,
  body text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists script_versions_video_id_idx on public.script_versions(video_id);
create index if not exists script_versions_video_type_version_idx
  on public.script_versions(video_id, script_type, version_number);
