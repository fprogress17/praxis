"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/server/db";
import { normalizeVideoStatus } from "@/lib/video-status";

function isUniqueError(error: unknown, constraint: string) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505" &&
    "constraint" in error &&
    (error as { constraint?: string }).constraint === constraint
  );
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
  const tts_script = String(formData.get("tts_script") ?? "").trim();
  const next_episode_promise = String(formData.get("next_episode_promise") ?? "").trim();

  if (!channel_id) {
    return { ok: false, error: "Channel is missing." };
  }
  if (!title) {
    return { ok: false, error: "Video title is required." };
  }

  try {
    await query(
      `insert into public.videos (
        channel_id, episode, status, title, brief, script, tts_script, next_episode_promise
      ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        channel_id,
        episode || "",
        status,
        title,
        brief || "",
        script || "",
        tts_script || "",
        next_episode_promise || "",
      ],
    );
  } catch (error) {
    if (isUniqueError(error, "videos_channel_episode_unique")) {
      return {
        ok: false,
        error: "That episode code is already used for this channel. Choose another from the list.",
      };
    }
    return { ok: false, error: error instanceof Error ? error.message : "Could not create video." };
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
  const tts_script = String(formData.get("tts_script") ?? "").trim();
  const next_episode_promise = String(formData.get("next_episode_promise") ?? "").trim();

  if (!id) {
    return { ok: false, error: "Video id is missing." };
  }
  if (!title) {
    return { ok: false, error: "Video title is required." };
  }

  try {
    await query(
      `update public.videos
       set episode = $2,
           status = $3,
           title = $4,
           brief = $5,
           script = $6,
           tts_script = $7,
           next_episode_promise = $8
       where id = $1`,
      [id, episode || "", status, title, brief || "", script || "", tts_script || "", next_episode_promise || ""],
    );
  } catch (error) {
    if (isUniqueError(error, "videos_channel_episode_unique")) {
      return {
        ok: false,
        error: "That episode code is already used for this channel. Choose another from the list.",
      };
    }
    return { ok: false, error: error instanceof Error ? error.message : "Could not update video." };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function deleteVideo(id: string): Promise<CreateVideoResult> {
  const trimmed = id.trim();
  if (!trimmed) {
    return { ok: false, error: "Video id is missing." };
  }

  try {
    await query(`delete from public.videos where id = $1`, [trimmed]);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete video." };
  }

  revalidatePath("/");
  return { ok: true };
}
