-- Optional video scope for notes: null = channel-level, set = this video only. Run after 005_notes.sql and 002_videos.sql.

alter table public.notes
  add column if not exists video_id uuid references public.videos (id) on delete cascade;

create index if not exists notes_video_id_idx on public.notes (video_id);
create index if not exists notes_channel_video_null_idx on public.notes (channel_id) where video_id is null;
