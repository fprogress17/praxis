-- Allow updating and deleting ideas with the anon key (dev). Idempotent for `db push`.
-- Run after 009_ideas.sql.

drop policy if exists "ideas_update_anon" on public.ideas;
create policy "ideas_update_anon"
  on public.ideas
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "ideas_delete_anon" on public.ideas;
create policy "ideas_delete_anon"
  on public.ideas
  for delete
  to anon, authenticated
  using (true);

grant update, delete on table public.ideas to anon, authenticated;
