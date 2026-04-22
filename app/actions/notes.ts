"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/server/db";

export type NoteMutationResult = { ok: true } | { ok: false; error: string };

export async function createNote(formData: FormData): Promise<NoteMutationResult> {
  const channel_id = String(formData.get("channel_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const video_id_raw = String(formData.get("video_id") ?? "").trim();
  const video_id = video_id_raw.length > 0 ? video_id_raw : null;

  if (!channel_id) {
    return { ok: false, error: "Channel is missing." };
  }

  try {
    await query(
      `insert into public.notes (channel_id, title, body, video_id)
       values ($1, $2, $3, $4)`,
      [channel_id, title, body, video_id],
    );
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not create note." };
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

  try {
    await query(`update public.notes set title = $2, body = $3 where id = $1`, [id, title, body]);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update note." };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function deleteNote(formData: FormData): Promise<NoteMutationResult> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return { ok: false, error: "Note id is missing." };
  }

  try {
    await query(`delete from public.notes where id = $1`, [id]);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete note." };
  }

  revalidatePath("/");
  return { ok: true };
}
