-- Teaser / promise for the following episode (YouTube workflow).

alter table public.videos
  add column if not exists next_episode_promise text not null default '';
