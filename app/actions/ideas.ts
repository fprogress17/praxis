"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/server/db";

export type IdeaMutationResult = { ok: true } | { ok: false; error: string };

export async function createIdea(formData: FormData): Promise<IdeaMutationResult> {
  const channel_id = String(formData.get("channel_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!channel_id) {
    return { ok: false, error: "Channel is missing." };
  }
  if (!body) {
    return { ok: false, error: "Write something before saving." };
  }

  try {
    await query(`insert into public.ideas (channel_id, body) values ($1, $2)`, [channel_id, body]);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not create idea." };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function updateIdea(formData: FormData): Promise<IdeaMutationResult> {
  const idea_id = String(formData.get("idea_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!idea_id) {
    return { ok: false, error: "Idea is missing." };
  }
  if (!body) {
    return { ok: false, error: "Write something before saving." };
  }

  try {
    await query(`update public.ideas set body = $2 where id = $1`, [idea_id, body]);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update idea." };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function deleteIdea(formData: FormData): Promise<IdeaMutationResult> {
  const idea_id = String(formData.get("idea_id") ?? "").trim();

  if (!idea_id) {
    return { ok: false, error: "Idea is missing." };
  }

  try {
    await query(`delete from public.ideas where id = $1`, [idea_id]);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete idea." };
  }

  revalidatePath("/");
  return { ok: true };
}
