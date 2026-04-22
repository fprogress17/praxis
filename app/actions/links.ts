"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/server/db";

function normalizeUrl(raw: string) {
  const value = raw.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export type LinkMutationResult = { ok: true } | { ok: false; error: string };

export async function createLink(formData: FormData): Promise<LinkMutationResult> {
  const channel_id_raw = String(formData.get("channel_id") ?? "").trim();
  const video_id_raw = String(formData.get("video_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const url = normalizeUrl(String(formData.get("url") ?? ""));
  const note = String(formData.get("note") ?? "").trim();

  if (!url) return { ok: false, error: "URL is required." };

  try {
    await query(
      `insert into public.links (channel_id, video_id, title, url, note)
       values ($1, $2, $3, $4, $5)`,
      [channel_id_raw || null, video_id_raw || null, title, url, note],
    );
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not create link." };
  }
  revalidatePath("/");
  return { ok: true };
}

export async function updateLink(formData: FormData): Promise<LinkMutationResult> {
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const url = normalizeUrl(String(formData.get("url") ?? ""));
  const note = String(formData.get("note") ?? "").trim();

  if (!id) return { ok: false, error: "Link id is missing." };
  if (!url) return { ok: false, error: "URL is required." };

  try {
    await query(`update public.links set title = $2, url = $3, note = $4 where id = $1`, [
      id,
      title,
      url,
      note,
    ]);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update link." };
  }
  revalidatePath("/");
  return { ok: true };
}

export async function deleteLink(formData: FormData): Promise<LinkMutationResult> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "Link id is missing." };

  try {
    await query(`delete from public.links where id = $1`, [id]);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete link." };
  }
  revalidatePath("/");
  return { ok: true };
}
