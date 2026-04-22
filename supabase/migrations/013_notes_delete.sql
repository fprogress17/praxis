-- Allow deleting notes with the anon key (dev). Idempotent for `db push`.

drop policy if exists "notes_delete_anon" on public.notes;
create policy "notes_delete_anon"
  on public.notes
  for delete
  to anon, authenticated
  using (true);

grant delete on table public.notes to anon, authenticated;
