-- Allow updating videos with the anon key (dev). Idempotent for `db push`.

drop policy if exists "videos_update_anon" on public.videos;
create policy "videos_update_anon"
  on public.videos
  for update
  to anon, authenticated
  using (true)
  with check (true);

grant update on table public.videos to anon, authenticated;
