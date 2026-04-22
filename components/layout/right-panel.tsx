"use client";

import { useState } from "react";
import { BrowserPanel } from "@/components/browser/browser-panel";
import { FilesPanel } from "@/components/files/files-panel";
import { LinksSection } from "@/components/links/links-section";
import { NotesSection } from "@/components/notes/notes-section";
import type { FileRow } from "@/lib/types/file";
import type { LinkRow } from "@/lib/types/link";
import type { NoteRow } from "@/lib/types/note";
import type { WorkspaceNoteRow } from "@/lib/types/workspace-note";

const TABS = ["Notes", "Files", "Browser", "Links", "AI"] as const;
type TabId = (typeof TABS)[number];

export function RightPanel({
  contextTitle = "Workspace",
  contextDetail = "Create a channel or pick one from the list.",
  notesScope,
  channelId = null,
  videoId = null,
  workspaceNotes = [],
  channelNotes = [],
  files = [],
  links = [],
  dataConfigured = false,
  widthPx = 300,
}: {
  contextTitle?: string;
  contextDetail?: string;
  notesScope: "workspace" | "channel" | "video";
  channelId?: string | null;
  videoId?: string | null;
  workspaceNotes?: WorkspaceNoteRow[];
  channelNotes?: NoteRow[];
  files?: FileRow[];
  links?: LinkRow[];
  dataConfigured?: boolean;
  /** Width of the right column in pixels (set by drag handle on xl+). */
  widthPx?: number;
}) {
  const scopeWorkspace = notesScope === "workspace";
  const scopeVideo = notesScope === "video";
  const browserScopeKey =
    notesScope === "workspace"
      ? "workspace"
      : notesScope === "video" && videoId
        ? `video:${videoId}`
        : channelId
          ? `channel:${channelId}`
          : notesScope;
  const [tab, setTab] = useState<TabId>("Notes");
  const contextLabel = scopeWorkspace ? "Workspace lens" : scopeVideo ? "Video lens" : "Channel lens";
  const contextBody = scopeWorkspace
    ? "Notes, files, links, and AI on this tab apply across all channels. Pick a channel for channel-specific work, or open a video for episode files and notes."
    : scopeVideo
      ? "Notes, files, links, and AI on this tab apply to the video you are editing. Switch back to the channel list for channel-wide work."
      : "Notes, files, links, and AI on this tab apply to the selected channel. Open a video to work with episode-specific files and notes.";

  return (
    <aside
      className="hidden min-w-0 shrink-0 overflow-hidden bg-paper xl:flex xl:flex-col"
      style={{ width: widthPx }}
    >
      <div className="border-b border-border px-6 py-6">
        <div className="font-serif text-h4 text-foreground">Praxis</div>
        <div className="mt-2 flex flex-wrap gap-2" role="tablist" aria-label="Right panel">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1 text-label transition-colors ${
                tab === t
                  ? "bg-black/6 text-foreground dark:bg-white/10"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {tab === "Notes" ? (
            notesScope === "workspace" ? (
              <NotesSection
                scope="workspace"
                notes={workspaceNotes}
                dataConfigured={dataConfigured}
              />
            ) : channelId ? (
              <NotesSection
                scope={scopeVideo ? "video" : "channel"}
                channelId={channelId}
                videoId={videoId}
                notes={channelNotes}
                dataConfigured={dataConfigured}
              />
            ) : null
          ) : null}

          {tab === "Links" ? (
            <LinksSection
              scope={notesScope}
              channelId={channelId}
              videoId={videoId}
              links={links}
              dataConfigured={dataConfigured}
            />
          ) : null}

          {tab === "Browser" ? <BrowserPanel scopeKey={browserScopeKey} /> : null}

          {tab === "Files" ? (
            <FilesPanel
              scope={notesScope}
              channelId={channelId}
              videoId={videoId}
              files={files}
              dataConfigured={dataConfigured}
              contextTitle={contextTitle}
              contextDetail={contextDetail}
              contextLabel={contextLabel}
              contextBody={contextBody}
            />
          ) : null}

          {tab === "AI" ? (
            <p className="text-meta leading-6 text-muted">
              {scopeWorkspace
                ? "Cross-channel ideas and planning — your own chat here later (server API, not embedded ChatGPT)."
                : scopeVideo
                  ? "Titles, hooks, and outlines for this video — your own chat here later (server API, not embedded ChatGPT)."
                  : "Titles, hooks, outlines, and descriptions for this channel — your own chat here later (API on the server, not embedded ChatGPT)."}
            </p>
          ) : null}
        </div>

        {tab !== "Files" ? (
        <div className="shrink-0 border-t border-border px-6 py-6">
          <div className="rounded-lg border border-border bg-surface p-4 shadow-soft">
            <div className="text-micro font-semibold uppercase tracking-[0.08em] text-muted">
              Context
            </div>
            <div className="mt-3 font-serif text-h4 text-foreground">{contextLabel}</div>
            <p className="mt-3 text-body leading-7 text-muted">{contextBody}</p>
            <div className="mt-5 space-y-3">
              <div className="rounded-md border border-border bg-paper px-3 py-3 dark:bg-paper-light/50">
                <div className="text-label text-muted">Current</div>
                <div className="mt-1 text-ui font-medium text-foreground">{contextTitle}</div>
              </div>
              <div className="rounded-md border border-border bg-paper px-3 py-3 dark:bg-paper-light/50">
                <div className="text-label text-muted">Focus</div>
                <div className="mt-1 text-ui font-medium text-foreground">{contextDetail}</div>
              </div>
            </div>
          </div>
        </div>
        ) : null}
      </div>
    </aside>
  );
}
