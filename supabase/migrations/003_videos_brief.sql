-- Run in Supabase → SQL Editor if you already applied 002_videos.sql.
-- Adds optional-at-UI "brief" between title and script in the app.

alter table public.videos
  add column if not exists brief text not null default '';
