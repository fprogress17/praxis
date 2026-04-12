-- Allow updating videos with the anon key (dev). Run in SQL Editor if saves from Edit video fail with RLS.

create policy "videos_update_anon"
  on public.videos
  for update
  to anon, authenticated
  using (true)
  with check (true);

grant update on table public.videos to anon, authenticated;
