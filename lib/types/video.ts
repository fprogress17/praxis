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
  created_at: string;
};
