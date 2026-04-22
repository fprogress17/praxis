"use client";

import { ChevronDown, CirclePlus, Lightbulb } from "lucide-react";
import { ChannelCard } from "@/components/channels/channel-card";
import { WorkspaceIdeaSidebarList } from "@/components/ideas/workspace-idea-sidebar-list";
import type { ChannelRow } from "@/lib/types/channel";
import type { WorkspaceIdeaRow } from "@/lib/types/workspace-idea";
import { ThemeToggle } from "@/components/theme-toggle";

/** Visible below `lg` — desktop sidebar is hidden there, so this carries New channel + channel list. */
export function MobileNav({
  channels,
  onNewChannel,
  onWorkspaceIdea,
  workspaceIdeas,
  onGoHome,
  selectedId,
  onSelectChannel,
  onAddVideo,
  onAddIdea,
  dataConfigured,
}: {
  channels: ChannelRow[];
  onNewChannel: () => void;
  onWorkspaceIdea: () => void;
  workspaceIdeas: WorkspaceIdeaRow[];
  onGoHome: () => void;
  selectedId: string | null;
  onSelectChannel: (id: string) => void;
  onAddVideo: (channelId: string) => void;
  onAddIdea: (channelId: string) => void;
  dataConfigured: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-border bg-paper lg:hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <button
          type="button"
          onClick={onGoHome}
          className="min-w-0 rounded-md text-left outline-none ring-offset-2 ring-offset-paper transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent dark:ring-offset-paper"
        >
          <div className="font-serif text-h4 leading-tight text-foreground">Praxis</div>
          <div className="truncate text-meta text-muted">YouTube channel creation workspace</div>
        </button>
        <div className="flex min-w-0 shrink-0 items-center gap-1.5">
          <div className="grid min-w-0 max-w-[11rem] grid-cols-2 gap-1 sm:max-w-none sm:gap-1.5">
            <button
              type="button"
              onClick={onNewChannel}
              className="flex min-w-0 items-center justify-center gap-1 rounded-lg border border-border bg-surface px-2 py-2 text-label font-medium text-foreground shadow-soft"
            >
              <CirclePlus className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" strokeWidth={1.75} aria-hidden />
              <span className="hidden truncate sm:inline">New channel</span>
              <span className="truncate sm:hidden">New</span>
            </button>
            <button
              type="button"
              onClick={onWorkspaceIdea}
              disabled={!dataConfigured}
              title={!dataConfigured ? "Configure DATABASE_URL first" : undefined}
              className="flex items-center justify-center gap-1 rounded-lg border border-border bg-surface px-2 py-2 text-label font-medium text-foreground shadow-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Lightbulb className="h-3.5 w-3.5 shrink-0 opacity-90 sm:h-4 sm:w-4" strokeWidth={1.75} aria-hidden />
              Idea
            </button>
          </div>
          <ThemeToggle compact />
        </div>
      </div>

      <details className="border-t border-border px-4 py-2 group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-2 text-ui font-medium text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
          <span>
            Channels
            <span className="ml-1.5 font-normal text-muted">({channels.length})</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="max-h-[40vh] overflow-y-auto pb-2">
          {channels.length === 0 ? (
            <p className="py-2 text-meta text-muted">No channels yet — tap New channel.</p>
          ) : (
            <div className="space-y-3 pt-1">
              {channels.map((ch) => (
                <ChannelCard
                  key={ch.id}
                  channel={ch}
                  active={ch.id === selectedId}
                  onSelect={onSelectChannel}
                  onAddVideo={onAddVideo}
                  onAddIdea={onAddIdea}
                />
              ))}
            </div>
          )}
          {dataConfigured ? (
            <div className="border-t border-border">
              <WorkspaceIdeaSidebarList ideas={workspaceIdeas} embedded />
            </div>
          ) : null}
        </div>
      </details>
    </header>
  );
}
