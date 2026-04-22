"use client";

import { useMemo, useRef, useState } from "react";
import { updateChannelPositions } from "@/app/actions/channels";
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
import { ChannelIdeaList } from "@/components/ideas/channel-idea-list";
import { NewIdeaForm } from "@/components/ideas/new-idea-form";
import { NewWorkspaceIdeaForm } from "@/components/ideas/new-workspace-idea-form";
import type { ChannelRow } from "@/lib/types/channel";
import type { FileRow } from "@/lib/types/file";
import type { IdeaRow } from "@/lib/types/idea";
import type { LinkRow } from "@/lib/types/link";
import type { WorkspaceIdeaRow } from "@/lib/types/workspace-idea";
import type { WorkspaceNoteRow } from "@/lib/types/workspace-note";
import type { NoteRow } from "@/lib/types/note";
import type { VideoRow } from "@/lib/types/video";

type Mode =
  | "home"
  | "new-channel"
  | "new-workspace-idea"
  | "new-video"
  | "new-idea"
  | "edit-video";

export function PraxisShell({
  initialChannels,
  initialVideos,
  initialNotes,
  initialFiles,
  initialLinks,
  initialIdeas,
  initialWorkspaceIdeas,
  initialWorkspaceNotes,
  dataConfigured,
}: {
  initialChannels: ChannelRow[];
  initialVideos: VideoRow[];
  initialNotes: NoteRow[];
  initialFiles: FileRow[];
  initialLinks: LinkRow[];
  initialIdeas: IdeaRow[];
  initialWorkspaceIdeas: WorkspaceIdeaRow[];
  initialWorkspaceNotes: WorkspaceNoteRow[];
  dataConfigured: boolean;
}) {
  const [mode, setMode] = useState<Mode>("home");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // orderedIds tracks drag-reordered channel order; null = use server order.
  const [orderedIds, setOrderedIds] = useState<string[] | null>(null);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  /** Desktop (lg+): full channels sidebar vs narrow rail with open button. */
  const [channelsPanelOpen, setChannelsPanelOpen] = useState(true);
  /** Mobile: full top nav vs slim bar when composing/editing video. */
  const [mobileChannelsOpen, setMobileChannelsOpen] = useState(true);

  const splitRegionRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const { widthPx: rightPanelWidthPx, dragging: rightPanelDragging, onResizePointerDown } =
    useRightPanelWidth(splitRegionRef, resizeHandleRef);

  const channels = useMemo(() => {
    const sorted = [...initialChannels].sort(
      (a, b) => (a.position ?? 9999) - (b.position ?? 9999),
    );
    if (!orderedIds) return sorted;
    const byId = new Map(initialChannels.map((c) => [c.id, c]));
    const result: ChannelRow[] = [];
    for (const id of orderedIds) {
      const ch = byId.get(id);
      if (ch) result.push(ch);
    }
    const inOrder = new Set(orderedIds);
    for (const ch of sorted) {
      if (!inOrder.has(ch.id)) result.push(ch);
    }
    return result;
  }, [initialChannels, orderedIds]);

  const selected = useMemo(
    () => channels.find((c) => c.id === selectedId) ?? null,
    [channels, selectedId],
  );

  function handleReorderChannels(newIds: string[]) {
    setOrderedIds(newIds);
    updateChannelPositions(newIds).catch(console.error);
  }

  const channelVideos = useMemo(() => {
    if (!selectedId) return [];
    return initialVideos.filter((v) => v.channel_id === selectedId);
  }, [initialVideos, selectedId]);

  /** Channel home / new video / new idea: notes with no video. Edit video: notes for that video only. */
  const rightPanelNotes = useMemo(() => {
    if (!selectedId) return [];
    const forChannel = initialNotes.filter((n) => n.channel_id === selectedId);
    if (mode === "edit-video" && editingVideoId) {
      return forChannel.filter((n) => n.video_id === editingVideoId);
    }
    return forChannel.filter((n) => n.video_id == null || n.video_id === "");
  }, [initialNotes, selectedId, mode, editingVideoId]);

  const notesScope = useMemo((): "workspace" | "channel" | "video" => {
    if (!selectedId) return "workspace";
    if (mode === "edit-video" && editingVideoId) return "video";
    return "channel";
  }, [selectedId, mode, editingVideoId]);

  const rightPanelFiles = useMemo(() => {
    if (!selectedId) {
      return initialFiles.filter((f) => f.channel_id == null && f.video_id == null);
    }
    const forChannel = initialFiles.filter((f) => f.channel_id === selectedId);
    if (mode === "edit-video" && editingVideoId) {
      return forChannel.filter((f) => f.video_id === editingVideoId);
    }
    return forChannel.filter((f) => f.video_id == null || f.video_id === "");
  }, [initialFiles, selectedId, mode, editingVideoId]);

  const rightPanelLinks = useMemo(() => {
    if (!selectedId) {
      return initialLinks.filter((link) => link.channel_id == null && link.video_id == null);
    }
    const forChannel = initialLinks.filter((link) => link.channel_id === selectedId);
    if (mode === "edit-video" && editingVideoId) {
      return forChannel.filter((link) => link.video_id === editingVideoId);
    }
    return forChannel.filter((link) => link.video_id == null || link.video_id === "");
  }, [initialLinks, selectedId, mode, editingVideoId]);

  const workspaceNotesSorted = useMemo(
    () =>
      [...initialWorkspaceNotes].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [initialWorkspaceNotes],
  );

  const channelIdeas = useMemo(() => {
    if (!selectedId) return [];
    return initialIdeas
      .filter((i) => i.channel_id === selectedId)
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [initialIdeas, selectedId]);

  const editingVideo = useMemo(
    () => (editingVideoId ? initialVideos.find((v) => v.id === editingVideoId) ?? null : null),
    [initialVideos, editingVideoId],
  );

  const contextTitle =
    mode === "new-workspace-idea"
      ? "New channel idea"
      : mode === "new-video" && selected
        ? "New video"
        : mode === "new-idea" && selected
          ? "New idea"
          : mode === "edit-video" && editingVideo
            ? editingVideo.title
            : (selected?.title ?? "Workspace");

  const contextDetail =
    mode === "new-workspace-idea"
      ? "Not tied to a channel yet — listed under your channels"
      : mode === "new-video" && selected
        ? `Adding to “${selected.title}”`
        : mode === "new-idea" && selected
          ? `Idea for “${selected.title}”`
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

  const openWorkspaceIdea = () => {
    setMode("new-workspace-idea");
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

  const openAddIdea = (channelId: string) => {
    setSelectedId(channelId);
    setEditingVideoId(null);
    setMode("new-idea");
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

  const goHome = () => {
    setMode("home");
    setSelectedId(null);
    setEditingVideoId(null);
    setChannelsPanelOpen(true);
    setMobileChannelsOpen(true);
  };

  const composerFlowActive =
    mode === "new-video" || mode === "new-idea" || mode === "edit-video";
  const showMobileCollapsed = composerFlowActive && !mobileChannelsOpen;

  const mobileBarSubtitle =
    mode === "edit-video" ? "Edit video" : mode === "new-idea" ? "New idea" : "New video";

  const renderCenter = () => {
    if (mode === "new-channel") {
      return <NewChannelForm onCancel={() => setMode("home")} />;
    }

    if (mode === "new-workspace-idea") {
      return (
        <div>
          <div className="mb-3 text-micro font-semibold uppercase tracking-[0.08em] text-muted">
            Workspace
          </div>
          <h1 className="font-serif text-display leading-none tracking-[-0.02em] text-foreground">
            New channel idea
          </h1>
          <p className="mt-4 max-w-[44rem] text-body leading-7 text-muted">
            For a channel you don’t have yet. After you save, it appears under your channel list in the
            sidebar.
          </p>
          <NewWorkspaceIdeaForm onCancel={() => setMode("home")} />
        </div>
      );
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
            key={`new-video:${selected.id}`}
            channelId={selected.id}
            channelTitle={selected.title}
            usedEpisodes={channelVideos.map((v) => v.episode)}
            onCancel={exitVideoComposer}
          />
        </div>
      );
    }

    if (mode === "new-idea" && selected) {
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
          <NewIdeaForm
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
            usedEpisodesByOthers={channelVideos
              .filter((v) => v.id !== editingVideo.id)
              .map((v) => v.episode)}
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
            : "Plan and draft YouTube videos by channel: pick or add a channel on the left, add videos in the center, notes and future AI on the right (wide screens)."}
        </p>

        {selected ? (
          <>
            <ChannelVideoList videos={channelVideos} onSelectVideo={openEditVideo} />
            <ChannelIdeaList ideas={channelIdeas} />
          </>
        ) : null}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {showMobileCollapsed ? (
        <MobileChannelsCollapsedBar
          onOpen={() => setMobileChannelsOpen(true)}
          onGoHome={goHome}
          subtitle={mobileBarSubtitle}
        />
      ) : (
        <MobileNav
          channels={channels}
          onNewChannel={openNewChannel}
          onWorkspaceIdea={openWorkspaceIdea}
          workspaceIdeas={initialWorkspaceIdeas}
          onGoHome={goHome}
          selectedId={selectedId}
          onSelectChannel={selectChannel}
          onAddVideo={openAddVideo}
          onAddIdea={openAddIdea}
          dataConfigured={dataConfigured}
        />
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {channelsPanelOpen ? (
          <Sidebar
            channels={channels}
            onNewChannel={openNewChannel}
            onWorkspaceIdea={openWorkspaceIdea}
            workspaceIdeas={initialWorkspaceIdeas}
            onGoHome={goHome}
            selectedId={selectedId}
            onSelectChannel={selectChannel}
            onAddVideo={openAddVideo}
            onAddIdea={openAddIdea}
            onReorderChannels={handleReorderChannels}
            dataConfigured={dataConfigured}
          />
        ) : (
          <ChannelsPanelRail onOpen={() => setChannelsPanelOpen(true)} />
        )}

        <div
          ref={splitRegionRef}
          className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row"
        >
          <CenterPanel>
            {!dataConfigured ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-body text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
                <p className="font-medium">Local database config missing</p>
                <p className="mt-2 text-meta leading-6 opacity-90">
                  Copy <code className="rounded bg-black/5 px-1 dark:bg-white/10">.env.example</code>{" "}
                  to <code className="rounded bg-black/5 px-1 dark:bg-white/10">.env.local</code> and
                  add <code className="rounded bg-black/5 px-1 dark:bg-white/10">DATABASE_URL</code>.
                  Optional: set <code className="rounded bg-black/5 px-1 dark:bg-white/10">FILE_STORAGE_ROOT</code>{" "}
                  if you want files outside the default local storage folder.
                </p>
              </div>
            ) : null}

            {renderCenter()}
          </CenterPanel>

          <PanelResizeHandle
            ref={resizeHandleRef}
            onMouseDown={onResizePointerDown}
            dragging={rightPanelDragging}
          />

          <RightPanel
            contextTitle={contextTitle}
            contextDetail={contextDetail}
            notesScope={notesScope}
            channelId={selectedId}
            videoId={mode === "edit-video" && editingVideoId ? editingVideoId : null}
            workspaceNotes={workspaceNotesSorted}
            channelNotes={rightPanelNotes}
            files={rightPanelFiles}
            links={rightPanelLinks}
            dataConfigured={dataConfigured}
            widthPx={rightPanelWidthPx}
          />
        </div>
      </div>
    </div>
  );
}
