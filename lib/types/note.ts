export type NoteRow = {
  id: string;
  channel_id: string;
  /** When set, note is scoped to this video; when null, note is channel-level. */
  video_id: string | null;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
};
