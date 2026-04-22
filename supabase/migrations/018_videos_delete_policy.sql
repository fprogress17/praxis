-- Allow deleting videos with the anon key (solo-dev). Idempotent for `db push`.

drop policy if exists "videos_delete_anon" on public.videos;
create policy "videos_delete_anon"
  on public.videos
  for delete
  to anon, authenticated
  using (true);

grant delete on table public.videos to anon, authenticated;
