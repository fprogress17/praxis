"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export type CreateVideoResult =
  | { ok: true }
  | { ok: false; error: string };

export async function createVideo(formData: FormData): Promise<CreateVideoResult> {
  const channel_id = String(formData.get("channel_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const brief = String(formData.get("brief") ?? "").trim();
  const script = String(formData.get("script") ?? "").trim();

  if (!channel_id) {
    return { ok: false, error: "Channel is missing." };
  }
  if (!title) {
    return { ok: false, error: "Video title is required." };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return {
      ok: false,
      error: "Supabase is not configured. Check .env.local.",
    };
  }

  const supabase = createClient(url, key);

  const { error } = await supabase.from("videos").insert({
    channel_id,
    title,
    brief: brief || "",
    script: script || "",
  });

  if (error) {
    const hint =
      error.message.includes("brief") || error.code === "PGRST204"
        ? "Run supabase/migrations/003_videos_brief.sql (and 002 if needed). See SETUP-SUPABASE.md."
        : error.message.includes("row-level security") || error.code === "42P01"
          ? "Run supabase/migrations/002_videos.sql (see SETUP-SUPABASE.md)."
          : null;
    return {
      ok: false,
      error: hint ?? error.message,
    };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function updateVideo(formData: FormData): Promise<CreateVideoResult> {
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const brief = String(formData.get("brief") ?? "").trim();
  const script = String(formData.get("script") ?? "").trim();

  if (!id) {
    return { ok: false, error: "Video id is missing." };
  }
  if (!title) {
    return { ok: false, error: "Video title is required." };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return {
      ok: false,
      error: "Supabase is not configured. Check .env.local.",
    };
  }

  const supabase = createClient(url, key);

  const { error } = await supabase
    .from("videos")
    .update({
      title,
      brief: brief || "",
      script: script || "",
    })
    .eq("id", id);

  if (error) {
    const hint =
      error.message.includes("row-level security") || error.code === "42501"
        ? "Run supabase/migrations/004_videos_update_policy.sql in the SQL Editor."
        : null;
    return {
      ok: false,
      error: hint ?? error.message,
    };
  }

  revalidatePath("/");
  return { ok: true };
}
