import { createClient } from "@supabase/supabase-js";
import { PraxisShell } from "@/components/praxis-shell";
import type { ChannelRow } from "@/lib/types/channel";
import type { NoteRow } from "@/lib/types/note";
import type { VideoRow } from "@/lib/types/video";

/** Channels come from Supabase — must not be frozen at build time. */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseConfigured = Boolean(url && key);

  let channels: ChannelRow[] = [];
  let videos: VideoRow[] = [];
  let notes: NoteRow[] = [];

  if (supabaseConfigured) {
    try {
      const supabase = createClient(url!, key!);
      const [channelsRes, videosRes, notesRes] = await Promise.all([
        supabase
          .from("channels")
          .select("id,title,category,brief_note,created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("videos")
          .select("id,channel_id,episode,title,brief,script,created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("notes")
          .select("id,channel_id,title,body,created_at,updated_at")
          .order("created_at", { ascending: false }),
      ]);

      if (!channelsRes.error && channelsRes.data) {
        channels = channelsRes.data.map((row) => ({
          id: String(row.id),
          title: String(row.title),
          category: String(row.category),
          brief_note: row.brief_note != null ? String(row.brief_note) : null,
          created_at:
            typeof row.created_at === "string"
              ? row.created_at
              : String(row.created_at),
        }));
      }

      if (!videosRes.error && videosRes.data) {
        videos = videosRes.data.map((row) => ({
          id: String(row.id),
          channel_id: String(row.channel_id),
          episode: row.episode != null ? String(row.episode) : "",
          title: String(row.title),
          brief: row.brief != null ? String(row.brief) : "",
          script: row.script != null ? String(row.script) : "",
          created_at:
            typeof row.created_at === "string"
              ? row.created_at
              : String(row.created_at),
        }));
      }

      if (!notesRes.error && notesRes.data) {
        notes = notesRes.data.map((row) => ({
          id: String(row.id),
          channel_id: String(row.channel_id),
          title: row.title != null ? String(row.title) : "",
          body: row.body != null ? String(row.body) : "",
          created_at:
            typeof row.created_at === "string"
              ? row.created_at
              : String(row.created_at),
          updated_at:
            typeof row.updated_at === "string"
              ? row.updated_at
              : String(row.updated_at),
        }));
      }
    } catch {
      channels = [];
      videos = [];
      notes = [];
    }
  }

  return (
    <PraxisShell
      initialChannels={channels}
      initialVideos={videos}
      initialNotes={notes}
      supabaseConfigured={supabaseConfigured}
    />
  );
}
