"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const NOTES_TABLE_HINT =
  "The notes table is missing. Run praxis-web/supabase/migrations/005_notes.sql (or npm run db:push -- --yes). See SETUP-SUPABASE.md.";

function notesErrorMessage(error: { message: string; code?: string }): string | null {
  const msg = error.message.toLowerCase();
  if (
    error.code === "PGRST205" ||
    msg.includes("schema cache") ||
    msg.includes("could not find the table") ||
    msg.includes("relation \"notes\"") ||
    msg.includes("does not exist")
  ) {
    return NOTES_TABLE_HINT;
  }
  return null;
}

export type NoteMutationResult = { ok: true } | { ok: false; error: string };

export async function createNote(formData: FormData): Promise<NoteMutationResult> {
  const channel_id = String(formData.get("channel_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!channel_id) {
    return { ok: false, error: "Channel is missing." };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { ok: false, error: "Supabase is not configured. Check .env.local." };
  }

  const supabase = createClient(url, key);

  const { error } = await supabase.from("notes").insert({
    channel_id,
    title,
    body,
  });

  if (error) {
    return { ok: false, error: notesErrorMessage(error) ?? error.message };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function updateNote(formData: FormData): Promise<NoteMutationResult> {
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!id) {
    return { ok: false, error: "Note id is missing." };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { ok: false, error: "Supabase is not configured. Check .env.local." };
  }

  const supabase = createClient(url, key);

  const { error } = await supabase.from("notes").update({ title, body }).eq("id", id);

  if (error) {
    return { ok: false, error: notesErrorMessage(error) ?? error.message };
  }

  revalidatePath("/");
  return { ok: true };
}
