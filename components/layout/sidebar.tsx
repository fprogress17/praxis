"use client";

import { CirclePlus } from "lucide-react";
import { ChannelCard } from "@/components/channels/channel-card";
import type { ChannelRow } from "@/lib/types/channel";
import { ThemeToggle } from "@/components/theme-toggle";

export function Sidebar({
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
    <aside className="hidden w-[260px] shrink-0 border-r border-border bg-paper lg:flex lg:flex-col">
      <div className="border-b border-border px-4 py-4">
        <div className="mb-3">
          <button
            type="button"
            onClick={onGoHome}
            className="block w-full rounded-md text-left outline-none ring-offset-2 ring-offset-paper transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent dark:ring-offset-paper"
          >
            <div className="font-serif text-h4 text-foreground">Praxis</div>
            <div className="text-body text-muted">YouTube channel creation workspace</div>
          </button>
        </div>

        <button
          type="button"
          onClick={onNewChannel}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-ui font-medium text-foreground shadow-soft transition-colors hover:bg-black/4 dark:hover:bg-white/5"
        >
          <CirclePlus className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
          New channel
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mb-3 px-2 text-micro font-semibold uppercase tracking-[0.08em] text-muted">
          Channels
        </div>
        {channels.length === 0 ? (
          <p className="px-2 text-meta leading-6 text-muted">
            No channels yet. Create one to get started.
          </p>
        ) : (
          <div className="space-y-3">
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

      <div className="border-t border-border p-4">
        <ThemeToggle />
      </div>
    </aside>
  );
}
