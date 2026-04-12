"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { CHANNEL_CATEGORIES } from "@/lib/channel-categories";

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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return {
      ok: false,
      error: "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
    };
  }

  const supabase = createClient(url, key);

  const { error } = await supabase.from("channels").insert({
    title,
    category,
    brief_note: brief_note || null,
  });

  if (error) {
    return {
      ok: false,
      error: error.message.includes("row-level security")
        ? "Database rejected the write. Run the SQL in supabase/migrations/001_channels.sql (see SETUP-SUPABASE.md)."
        : error.message,
    };
  }

  revalidatePath("/");
  return { ok: true };
}
