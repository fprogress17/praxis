-- Text-to-speech script (separate from main script). Run after 002/008.

alter table public.videos
  add column if not exists tts_script text not null default '';
