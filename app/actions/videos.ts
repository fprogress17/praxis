"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { normalizeVideoStatus } from "@/lib/video-status";

const VIDEOS_TABLE_HINT =
  "The videos table is missing. In Supabase → SQL Editor, paste and run the full contents of praxis-web/supabase/migrations/002_videos.sql (then 003 only if your 002 had no brief column; 004 for editing). See SETUP-SUPABASE.md. If the table already exists, wait a minute or in Dashboard use Table Editor → refresh / restart the project so the API schema cache updates.";

function videosErrorMessage(error: { message: string; code?: string }): string | null {
  const msg = error.message.toLowerCase();
  if (
    error.code === "PGRST205" ||
    msg.includes("schema cache") ||
    msg.includes("could not find the table") ||
    msg.includes("relation \"videos\"") ||
    msg.includes("does not exist")
  ) {
    return VIDEOS_TABLE_HINT;
  }
  return null;
}

export type CreateVideoResult =
  | { ok: true }
  | { ok: false; error: string };

export async function createVideo(formData: FormData): Promise<CreateVideoResult> {
  const channel_id = String(formData.get("channel_id") ?? "").trim();
  const episode = String(formData.get("episode") ?? "").trim();
  const status = normalizeVideoStatus(String(formData.get("status") ?? ""));
  const title = String(formData.get("title") ?? "").trim();
  const brief = String(formData.get("brief") ?? "").trim();
  const script = String(formData.get("script") ?? "").trim();
  const next_episode_promise = String(formData.get("next_episode_promise") ?? "").trim();

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
    episode: episode || "",
    status,
    title,
    brief: brief || "",
    script: script || "",
    next_episode_promise: next_episode_promise || "",
  });

  if (error) {
    const tableHint = videosErrorMessage(error);
    const dup =
      error.code === "23505" ||
      error.message.toLowerCase().includes("duplicate") ||
      error.message.includes("videos_channel_episode_unique");
    const hint =
      tableHint ??
      (dup
        ? "That episode code is already used for this channel. Choose another from the list."
        : error.message.includes("next_episode_promise") || error.code === "PGRST204"
          ? "Run supabase/migrations/008_videos_next_episode_promise.sql (or npm run db:push -- --yes). See SETUP-SUPABASE.md."
          : error.message.includes("status") || error.code === "PGRST204"
            ? "Run supabase/migrations/007_videos_status.sql (or npm run db:push -- --yes). See SETUP-SUPABASE.md."
            : error.message.includes("episode") || error.code === "PGRST204"
              ? "Run supabase/migrations/006_videos_episode.sql (or npm run db:push -- --yes). See SETUP-SUPABASE.md."
              : error.message.includes("brief") || error.code === "PGRST204"
                ? "Run supabase/migrations/003_videos_brief.sql (and 002 if needed). See SETUP-SUPABASE.md."
                : error.message.includes("row-level security") || error.code === "42P01"
                  ? "Run supabase/migrations/002_videos.sql (see SETUP-SUPABASE.md)."
                  : null);
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
  const episode = String(formData.get("episode") ?? "").trim();
  const status = normalizeVideoStatus(String(formData.get("status") ?? ""));
  const title = String(formData.get("title") ?? "").trim();
  const brief = String(formData.get("brief") ?? "").trim();
  const script = String(formData.get("script") ?? "").trim();
  const next_episode_promise = String(formData.get("next_episode_promise") ?? "").trim();

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
      episode: episode || "",
      status,
      title,
      brief: brief || "",
      script: script || "",
      next_episode_promise: next_episode_promise || "",
    })
    .eq("id", id);

  if (error) {
    const tableHint = videosErrorMessage(error);
    const dup =
      error.code === "23505" ||
      error.message.toLowerCase().includes("duplicate") ||
      error.message.includes("videos_channel_episode_unique");
    const hint =
      tableHint ??
      (dup
        ? "That episode code is already used for this channel. Choose another from the list."
        : error.message.includes("next_episode_promise") || error.code === "PGRST204"
          ? "Run supabase/migrations/008_videos_next_episode_promise.sql (or npm run db:push -- --yes). See SETUP-SUPABASE.md."
          : error.message.includes("status") || error.code === "PGRST204"
            ? "Run supabase/migrations/007_videos_status.sql (or npm run db:push -- --yes). See SETUP-SUPABASE.md."
            : error.message.includes("episode") || error.code === "PGRST204"
              ? "Run supabase/migrations/006_videos_episode.sql (or npm run db:push -- --yes). See SETUP-SUPABASE.md."
              : error.message.includes("row-level security") || error.code === "42501"
                ? "Run supabase/migrations/004_videos_update_policy.sql in the SQL Editor."
                : null);
    return {
      ok: false,
      error: hint ?? error.message,
    };
  }

  revalidatePath("/");
  return { ok: true };
}
