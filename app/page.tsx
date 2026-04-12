import { createClient } from "@supabase/supabase-js";
import { PraxisShell } from "@/components/praxis-shell";
import type { ChannelRow } from "@/lib/types/channel";

/** Channels come from Supabase — must not be frozen at build time. */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseConfigured = Boolean(url && key);

  let channels: ChannelRow[] = [];

  if (supabaseConfigured) {
    try {
      const supabase = createClient(url!, key!);
      const { data, error } = await supabase
        .from("channels")
        .select("id,title,category,brief_note,created_at")
        .order("created_at", { ascending: false });

      if (!error && data) {
        channels = data.map((row) => ({
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
    } catch {
      channels = [];
    }
  }

  return (
    <PraxisShell
      initialChannels={channels}
      supabaseConfigured={supabaseConfigured}
    />
  );
}
