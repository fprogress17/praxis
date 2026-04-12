-- Production workflow status per video. Run after 006.

alter table public.videos
  add column if not exists status text not null default 'draft';

alter table public.videos drop constraint if exists videos_status_check;

alter table public.videos add constraint videos_status_check
  check (
    status in (
      'draft',
      'published',
      'skip',
      'to_be_published'
    )
  );
