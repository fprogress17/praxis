"use client";

import { useMemo, useState } from "react";
import { ChannelsPanelRail } from "@/components/layout/channels-panel-rail";
import { CenterPanel } from "@/components/layout/center-panel";
import { MobileChannelsCollapsedBar } from "@/components/layout/mobile-channels-collapsed-bar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PanelResizeHandle } from "@/components/layout/panel-resize-handle";
import { RightPanel } from "@/components/layout/right-panel";
import { Sidebar } from "@/components/layout/sidebar";
import { useRightPanelWidth } from "@/lib/use-right-panel-width";
import { NewChannelForm } from "@/components/channels/new-channel-form";
import { ChannelVideoList } from "@/components/videos/channel-video-list";
import { EditVideoForm } from "@/components/videos/edit-video-form";
import { NewVideoForm } from "@/components/videos/new-video-form";
import type { ChannelRow } from "@/lib/types/channel";
import type { NoteRow } from "@/lib/types/note";
import type { VideoRow } from "@/lib/types/video";

type Mode = "home" | "new-channel" | "new-video" | "edit-video";

export function PraxisShell({
  initialChannels,
  initialVideos,
  initialNotes,
  supabaseConfigured,
}: {
  initialChannels: ChannelRow[];
  initialVideos: VideoRow[];
  initialNotes: NoteRow[];
  supabaseConfigured: boolean;
}) {
  const [mode, setMode] = useState<Mode>("home");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  /** Desktop (lg+): full channels sidebar vs narrow rail with open button. */
  const [channelsPanelOpen, setChannelsPanelOpen] = useState(true);
  /** Mobile: full top nav vs slim bar when composing/editing video. */
  const [mobileChannelsOpen, setMobileChannelsOpen] = useState(true);

  const { widthPx: rightPanelWidthPx, dragging: rightPanelDragging, onResizePointerDown } =
    useRightPanelWidth();

  const selected = useMemo(
    () => initialChannels.find((c) => c.id === selectedId) ?? null,
    [initialChannels, selectedId],
  );

  const channelVideos = useMemo(() => {
    if (!selectedId) return [];
    return initialVideos.filter((v) => v.channel_id === selectedId);
  }, [initialVideos, selectedId]);

  const channelNotes = useMemo(() => {
    if (!selectedId) return [];
    return initialNotes.filter((n) => n.channel_id === selectedId);
  }, [initialNotes, selectedId]);

  const editingVideo = useMemo(
    () => (editingVideoId ? initialVideos.find((v) => v.id === editingVideoId) ?? null : null),
    [initialVideos, editingVideoId],
  );

  const contextTitle =
    mode === "new-video" && selected
      ? "New video"
      : mode === "edit-video" && editingVideo
        ? editingVideo.title
        : (selected?.title ?? "Workspace");

  const contextDetail =
    mode === "new-video" && selected
      ? `Adding to “${selected.title}”`
      : mode === "edit-video" && editingVideo && selected
        ? `Editing in “${selected.title}”`
        : selected
          ? `${selected.category}${selected.brief_note ? ` · ${selected.brief_note.slice(0, 80)}${selected.brief_note.length > 80 ? "…" : ""}` : ""}`
          : "Pick a channel or create one with New channel.";

  const collapseChannelsForVideo = () => {
    setChannelsPanelOpen(false);
    setMobileChannelsOpen(false);
  };

  const openNewChannel = () => {
    setMode("new-channel");
    setSelectedId(null);
    setEditingVideoId(null);
    setChannelsPanelOpen(true);
    setMobileChannelsOpen(true);
  };

  const selectChannel = (id: string) => {
    setSelectedId(id);
    setMode("home");
    setEditingVideoId(null);
  };

  const openAddVideo = (channelId: string) => {
    setSelectedId(channelId);
    setEditingVideoId(null);
    setMode("new-video");
    collapseChannelsForVideo();
  };

  const openEditVideo = (video: VideoRow) => {
    setSelectedId(video.channel_id);
    setEditingVideoId(video.id);
    setMode("edit-video");
    collapseChannelsForVideo();
  };

  const exitVideoComposer = () => {
    setMode("home");
    setEditingVideoId(null);
    setChannelsPanelOpen(true);
    setMobileChannelsOpen(true);
  };

  const videoFlowActive = mode === "new-video" || mode === "edit-video";
  const showMobileCollapsed = videoFlowActive && !mobileChannelsOpen;

  const mobileBarSubtitle =
    mode === "edit-video" ? "Edit video" : "New video";

  const renderCenter = () => {
    if (mode === "new-channel") {
      return <NewChannelForm onCancel={() => setMode("home")} />;
    }

    if (mode === "new-video" && selected) {
      return (
        <div>
          <div className="mb-3 text-micro font-semibold uppercase tracking-[0.08em] text-muted">
            Workspace
          </div>
          <h1 className="font-serif text-display leading-none tracking-[-0.02em] text-foreground">
            {selected.title}
          </h1>
          <p className="mt-4 max-w-[44rem] text-body leading-7 text-muted">
            {selected.brief_note || "No brief note yet."}
          </p>
          <NewVideoForm
            channelId={selected.id}
            channelTitle={selected.title}
            onCancel={exitVideoComposer}
          />
        </div>
      );
    }

    if (mode === "edit-video" && selected && editingVideo) {
      return (
        <div>
          <div className="mb-3 text-micro font-semibold uppercase tracking-[0.08em] text-muted">
            Workspace
          </div>
          <h1 className="font-serif text-display leading-none tracking-[-0.02em] text-foreground">
            {selected.title}
          </h1>
          <p className="mt-4 max-w-[44rem] text-body leading-7 text-muted">
            {selected.brief_note || "No brief note yet."}
          </p>
          <EditVideoForm
            video={editingVideo}
            channelTitle={selected.title}
            onDone={exitVideoComposer}
          />
        </div>
      );
    }

    if (mode === "edit-video" && (!selected || !editingVideo)) {
      return (
        <div className="rounded-lg border border-border bg-surface p-6">
          <p className="text-body text-muted">
            That video could not be loaded. Return to the channel and pick it from the list.
          </p>
          <button
            type="button"
            onClick={exitVideoComposer}
            className="mt-4 rounded-md border border-border px-4 py-2 text-ui font-medium text-foreground hover:bg-black/4 dark:hover:bg-white/5"
          >
            Back
          </button>
        </div>
      );
    }

    return (
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
          <ChannelVideoList videos={channelVideos} onSelectVideo={openEditVideo} />
        ) : null}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {showMobileCollapsed ? (
        <MobileChannelsCollapsedBar
          onOpen={() => setMobileChannelsOpen(true)}
          subtitle={mobileBarSubtitle}
        />
      ) : (
        <MobileNav
          channels={initialChannels}
          onNewChannel={openNewChannel}
          selectedId={selectedId}
          onSelectChannel={selectChannel}
          onAddVideo={openAddVideo}
        />
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {channelsPanelOpen ? (
          <Sidebar
            channels={initialChannels}
            onNewChannel={openNewChannel}
            selectedId={selectedId}
            onSelectChannel={selectChannel}
            onAddVideo={openAddVideo}
          />
        ) : (
          <ChannelsPanelRail onOpen={() => setChannelsPanelOpen(true)} />
        )}

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

          {renderCenter()}
        </CenterPanel>

        <PanelResizeHandle onMouseDown={onResizePointerDown} dragging={rightPanelDragging} />

        <RightPanel
          contextTitle={contextTitle}
          contextDetail={contextDetail}
          channelId={selectedId}
          channelNotes={channelNotes}
          supabaseConfigured={supabaseConfigured}
          widthPx={rightPanelWidthPx}
        />
      </div>
    </div>
  );
}
