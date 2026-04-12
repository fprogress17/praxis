-- Episode label per video (e.g. ep0001). Run after 002–004.
-- Idempotent: add column + partial unique (same channel cannot reuse a non-empty episode code).

alter table public.videos
  add column if not exists episode text not null default '';

create unique index if not exists videos_channel_episode_unique
  on public.videos (channel_id, episode)
  where episode <> '';
