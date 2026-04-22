export type LinkRow = {
  id: string;
  channel_id: string | null;
  /** When set, link is scoped to this video; when null, link is workspace/channel-level. */
  video_id: string | null;
  title: string;
  url: string;
  note: string;
  created_at: string;
};
