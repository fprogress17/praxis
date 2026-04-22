import type { VideoStatus } from "@/lib/video-status";

export type VideoRow = {
  id: string;
  channel_id: string;
  /** e.g. ep0001 — optional for legacy rows */
  episode: string;
  /** draft | published | skip | to_be_published */
  status: VideoStatus;
  title: string;
  brief: string;
  script: string;
  /** TTS-optimized or narration script (optional). */
  tts_script: string;
  /** Hook or promise for the next episode (outro CTA, series continuity). */
  next_episode_promise: string;
  created_at: string;
};
