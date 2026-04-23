import { query } from "@/lib/server/db";
import { normalizeVideoStatus } from "@/lib/video-status";

export type VideoMutationResult =
  | { ok: true }
  | { ok: false; error: string };

export type VideoInput = {
  id?: string;
  channel_id?: string;
  episode: string;
  status: string;
  title: string;
  brief: string;
  script: string;
  tts_script: string;
  next_episode_promise: string;
};

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

export function parseVideoFormData(formData: FormData): VideoInput {
  const id = String(formData.get("id") ?? "").trim();
  const channel_id = String(formData.get("channel_id") ?? "").trim();

  return {
    ...(id ? { id } : {}),
    ...(channel_id ? { channel_id } : {}),
    episode: String(formData.get("episode") ?? "").trim(),
    status: normalizeVideoStatus(String(formData.get("status") ?? "")),
    title: String(formData.get("title") ?? "").trim(),
    brief: String(formData.get("brief") ?? "").trim(),
    script: String(formData.get("script") ?? "").trim(),
    tts_script: String(formData.get("tts_script") ?? "").trim(),
    next_episode_promise: String(formData.get("next_episode_promise") ?? "").trim(),
  };
}

export async function createVideoRecord(input: VideoInput): Promise<VideoMutationResult> {
  const channelId = input.channel_id?.trim() ?? "";
  if (!channelId) {
    return { ok: false, error: "Channel is missing." };
  }
  if (!input.title) {
    return { ok: false, error: "Video title is required." };
  }

  try {
    await query(
      `insert into public.videos (
        channel_id, episode, status, title, brief, script, tts_script, next_episode_promise
      ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        channelId,
        input.episode || "",
        input.status,
        input.title,
        input.brief || "",
        input.script || "",
        input.tts_script || "",
        input.next_episode_promise || "",
      ],
    );
  } catch (error) {
    if (isUniqueError(error, "videos_channel_episode_unique")) {
      return {
        ok: false,
        error: "That episode code is already used for this channel. Choose another from the list.",
      };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not create video.",
    };
  }

  return { ok: true };
}

export async function updateVideoRecord(input: VideoInput): Promise<VideoMutationResult> {
  const id = input.id?.trim() ?? "";
  if (!id) {
    return { ok: false, error: "Video id is missing." };
  }
  if (!input.title) {
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
      [
        id,
        input.episode || "",
        input.status,
        input.title,
        input.brief || "",
        input.script || "",
        input.tts_script || "",
        input.next_episode_promise || "",
      ],
    );
  } catch (error) {
    if (isUniqueError(error, "videos_channel_episode_unique")) {
      return {
        ok: false,
        error: "That episode code is already used for this channel. Choose another from the list.",
      };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not update video.",
    };
  }

  return { ok: true };
}

export async function deleteVideoRecord(id: string): Promise<VideoMutationResult> {
  const trimmed = id.trim();
  if (!trimmed) {
    return { ok: false, error: "Video id is missing." };
  }

  try {
    await query(`delete from public.videos where id = $1`, [trimmed]);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not delete video.",
    };
  }

  return { ok: true };
}
