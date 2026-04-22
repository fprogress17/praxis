import { PraxisShell } from "@/components/praxis-shell";
import { dbConfigured, query } from "@/lib/server/db";
import type { ChannelRow } from "@/lib/types/channel";
import type { FileRow } from "@/lib/types/file";
import type { IdeaRow } from "@/lib/types/idea";
import type { LinkRow } from "@/lib/types/link";
import type { WorkspaceIdeaRow } from "@/lib/types/workspace-idea";
import type { WorkspaceNoteRow } from "@/lib/types/workspace-note";
import type { NoteRow } from "@/lib/types/note";
import { normalizeVideoStatus } from "@/lib/video-status";
import type { VideoRow } from "@/lib/types/video";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const dataConfigured = dbConfigured();

  let channels: ChannelRow[] = [];
  let videos: VideoRow[] = [];
  let notes: NoteRow[] = [];
  let files: FileRow[] = [];
  let links: LinkRow[] = [];
  let ideas: IdeaRow[] = [];
  let workspaceIdeas: WorkspaceIdeaRow[] = [];
  let workspaceNotes: WorkspaceNoteRow[] = [];

  if (dataConfigured) {
    try {
      const [
        channelsRes,
        videosRes,
        notesRes,
        filesRes,
        linksRes,
        ideasRes,
        workspaceIdeasRes,
        workspaceNotesRes,
      ] = await Promise.all([
        query(
          `select id, title, category, brief_note, position, created_at
           from public.channels
           order by position asc nulls last, created_at desc`,
        ),
        query(
          `select id, channel_id, episode, status, title, brief, script, tts_script, next_episode_promise, created_at
           from public.videos
           order by created_at desc`,
        ),
        query(
          `select id, channel_id, video_id, title, body, created_at, updated_at
           from public.notes
           order by created_at desc`,
        ),
        query(
          `select id, channel_id, video_id, bucket, object_path, name, mime_type, size_bytes, created_at
           from public.files
           order by created_at desc`,
        ),
        query(
          `select id, channel_id, video_id, title, url, note, created_at
           from public.links
           order by created_at desc`,
        ),
        query(
          `select id, channel_id, body, created_at
           from public.ideas
           order by created_at desc`,
        ),
        query(
          `select id, body, created_at
           from public.workspace_ideas
           order by created_at desc`,
        ),
        query(
          `select id, title, body, created_at, updated_at
           from public.workspace_notes
           order by created_at desc`,
        ),
      ]);

      channels = channelsRes.rows.map((row) => ({
        id: String(row.id),
        title: String(row.title),
        category: String(row.category),
        brief_note: row.brief_note != null ? String(row.brief_note) : null,
        position: row.position != null ? Number(row.position) : null,
        created_at: String(row.created_at),
      }));

      videos = videosRes.rows.map((row) => ({
        id: String(row.id),
        channel_id: String(row.channel_id),
        episode: row.episode != null ? String(row.episode) : "",
        status: normalizeVideoStatus(row.status != null ? String(row.status) : undefined),
        title: String(row.title),
        brief: row.brief != null ? String(row.brief) : "",
        script: row.script != null ? String(row.script) : "",
        tts_script: row.tts_script != null ? String(row.tts_script) : "",
        next_episode_promise:
          row.next_episode_promise != null ? String(row.next_episode_promise) : "",
        created_at: String(row.created_at),
      }));

      notes = notesRes.rows.map((row) => ({
        id: String(row.id),
        channel_id: String(row.channel_id),
        video_id: row.video_id != null ? String(row.video_id) : null,
        title: row.title != null ? String(row.title) : "",
        body: row.body != null ? String(row.body) : "",
        created_at: String(row.created_at),
        updated_at: String(row.updated_at),
      }));

      files = filesRes.rows.map((row) => ({
        id: String(row.id),
        channel_id: row.channel_id != null ? String(row.channel_id) : null,
        video_id: row.video_id != null ? String(row.video_id) : null,
        bucket: row.bucket != null ? String(row.bucket) : "local-files",
        object_path: String(row.object_path),
        name: String(row.name),
        mime_type: row.mime_type != null ? String(row.mime_type) : "",
        size_bytes: Number(row.size_bytes ?? 0),
        created_at: String(row.created_at),
      }));

      links = linksRes.rows.map((row) => ({
        id: String(row.id),
        channel_id: row.channel_id != null ? String(row.channel_id) : null,
        video_id: row.video_id != null ? String(row.video_id) : null,
        title: row.title != null ? String(row.title) : "",
        url: String(row.url),
        note: row.note != null ? String(row.note) : "",
        created_at: String(row.created_at),
      }));

      ideas = ideasRes.rows.map((row) => ({
        id: String(row.id),
        channel_id: String(row.channel_id),
        body: row.body != null ? String(row.body) : "",
        created_at: String(row.created_at),
      }));

      workspaceIdeas = workspaceIdeasRes.rows.map((row) => ({
        id: String(row.id),
        body: row.body != null ? String(row.body) : "",
        created_at: String(row.created_at),
      }));

      workspaceNotes = workspaceNotesRes.rows.map((row) => ({
        id: String(row.id),
        title: row.title != null ? String(row.title) : "",
        body: row.body != null ? String(row.body) : "",
        created_at: String(row.created_at),
        updated_at: String(row.updated_at),
      }));
    } catch {
      channels = [];
      videos = [];
      notes = [];
      files = [];
      links = [];
      ideas = [];
      workspaceIdeas = [];
      workspaceNotes = [];
    }
  }

  return (
    <PraxisShell
      initialChannels={channels}
      initialVideos={videos}
      initialNotes={notes}
      initialFiles={files}
      initialLinks={links}
      initialIdeas={ideas}
      initialWorkspaceIdeas={workspaceIdeas}
      initialWorkspaceNotes={workspaceNotes}
      dataConfigured={dataConfigured}
    />
  );
}
