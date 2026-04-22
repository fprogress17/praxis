export type FileRow = {
  id: string;
  channel_id: string | null;
  /** When set, file is scoped to this video; when null, file is workspace/channel-level. */
  video_id: string | null;
  bucket: string;
  object_path: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};
