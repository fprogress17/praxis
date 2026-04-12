"use client";

import { ChevronDown, CirclePlus } from "lucide-react";
import { ChannelCard } from "@/components/channels/channel-card";
import type { ChannelRow } from "@/lib/types/channel";
import { ThemeToggle } from "@/components/theme-toggle";

/** Visible below `lg` — desktop sidebar is hidden there, so this carries New channel + channel list. */
export function MobileNav({
  channels,
  onNewChannel,
  onGoHome,
  selectedId,
  onSelectChannel,
  onAddVideo,
}: {
  channels: ChannelRow[];
  onNewChannel: () => void;
  onGoHome: () => void;
  selectedId: string | null;
  onSelectChannel: (id: string) => void;
  onAddVideo: (channelId: string) => void;
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
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onNewChannel}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-label font-medium text-foreground shadow-soft"
          >
            <CirclePlus className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
            <span className="hidden min-[380px]:inline">New channel</span>
            <span className="min-[380px]:hidden">New</span>
          </button>
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
                />
              ))}
            </div>
          )}
        </div>
      </details>
    </header>
  );
}
