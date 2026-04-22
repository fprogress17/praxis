"use server";

import { revalidatePath } from "next/cache";
import { CHANNEL_CATEGORIES } from "@/lib/channel-categories";
import { query } from "@/lib/server/db";

export type CreateChannelResult =
  | { ok: true }
  | { ok: false; error: string };

export async function createChannel(formData: FormData): Promise<CreateChannelResult> {
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const brief_note = String(formData.get("brief_note") ?? "").trim();

  if (!title) {
    return { ok: false, error: "Title is required." };
  }

  if (!CHANNEL_CATEGORIES.includes(category as (typeof CHANNEL_CATEGORIES)[number])) {
    return { ok: false, error: "Pick a valid category." };
  }

  try {
    await query(
      `insert into public.channels (title, category, brief_note)
       values ($1, $2, $3)`,
      [title, category, brief_note || null],
    );
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not create channel.",
    };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function updateChannelPositions(orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      query(`update public.channels set position = $2 where id = $1`, [id, index + 1]),
    ),
  );
}
