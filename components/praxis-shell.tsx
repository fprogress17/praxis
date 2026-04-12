"use client";

import { useMemo, useState } from "react";
import { CenterPanel } from "@/components/layout/center-panel";
import { MobileNav } from "@/components/layout/mobile-nav";
import { RightPanel } from "@/components/layout/right-panel";
import { Sidebar } from "@/components/layout/sidebar";
import { NewChannelForm } from "@/components/channels/new-channel-form";
import type { ChannelRow } from "@/lib/types/channel";

type Mode = "home" | "new-channel";

export function PraxisShell({
  initialChannels,
  supabaseConfigured,
}: {
  initialChannels: ChannelRow[];
  supabaseConfigured: boolean;
}) {
  const [mode, setMode] = useState<Mode>("home");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => initialChannels.find((c) => c.id === selectedId) ?? null,
    [initialChannels, selectedId],
  );

  const contextTitle = selected?.title ?? "Workspace";
  const contextDetail = selected
    ? `${selected.category}${selected.brief_note ? ` · ${selected.brief_note.slice(0, 80)}${selected.brief_note.length > 80 ? "…" : ""}` : ""}`
    : "Pick a channel or create one with New channel.";

  const openNewChannel = () => {
    setMode("new-channel");
    setSelectedId(null);
  };

  const selectChannel = (id: string) => {
    setSelectedId(id);
    setMode("home");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground lg:flex-row">
      <MobileNav
        channels={initialChannels}
        onNewChannel={openNewChannel}
        selectedId={selectedId}
        onSelectChannel={selectChannel}
      />

      <Sidebar
        channels={initialChannels}
        onNewChannel={openNewChannel}
        selectedId={selectedId}
        onSelectChannel={selectChannel}
      />

      <CenterPanel>
        {!supabaseConfigured ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-body text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
            <p className="font-medium">Supabase env vars missing</p>
            <p className="mt-2 text-meta leading-6 opacity-90">
              Copy <code className="rounded bg-black/5 px-1 dark:bg-white/10">.env.example</code>{" "}
              to <code className="rounded bg-black/5 px-1 dark:bg-white/10">.env.local</code> and
              add your project URL and anon key. Then run the SQL in{" "}
              <code className="rounded bg-black/5 px-1 dark:bg-white/10">
                supabase/migrations/001_channels.sql
              </code>{" "}
              (see <code className="rounded bg-black/5 px-1 dark:bg-white/10">SETUP-SUPABASE.md</code>
              ).
            </p>
          </div>
        ) : null}

        {mode === "new-channel" ? (
          <NewChannelForm onCancel={() => setMode("home")} />
        ) : (
          <div>
            <div className="mb-3 text-micro font-semibold uppercase tracking-[0.08em] text-muted">
              Workspace
            </div>
            <h1 className="font-serif text-display leading-none tracking-[-0.02em] text-foreground">
              {selected ? selected.title : "Home"}
            </h1>
            <p className="mt-4 max-w-[44rem] text-body leading-7 text-muted">
              {selected
                ? selected.brief_note || "No brief note yet."
                : "Three-column layout: channels on the left, main content here, context on the right (wide screens). Use New channel to add a top-level space."}
            </p>

            {selected ? (
              <div className="mt-10 rounded-lg border border-dashed border-border bg-surface/60 p-8 text-center text-meta text-muted">
                Editor and channel tools go here next.
              </div>
            ) : null}
          </div>
        )}
      </CenterPanel>

      <RightPanel contextTitle={contextTitle} contextDetail={contextDetail} />
    </div>
  );
}
