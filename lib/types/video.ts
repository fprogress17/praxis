export type VideoRow = {
  id: string;
  channel_id: string;
  /** e.g. ep0001 — optional for legacy rows */
  episode: string;
  title: string;
  brief: string;
  script: string;
  created_at: string;
};
