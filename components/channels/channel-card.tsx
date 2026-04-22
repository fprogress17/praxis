"use client";

import { Lightbulb, Video } from "lucide-react";
import type { ChannelRow } from "@/lib/types/channel";

export function ChannelCard({
  channel,
  active,
  onSelect,
  onAddVideo,
  onAddIdea,
}: {
  channel: ChannelRow;
  active: boolean;
  onSelect: (id: string) => void;
  onAddVideo: (id: string) => void;
  onAddIdea: (id: string) => void;
}) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-border bg-surface shadow-soft transition-shadow ${
        active ? "ring-2 ring-accent/35 ring-offset-2 ring-offset-paper dark:ring-offset-paper" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(channel.id)}
        className="w-full px-3 py-2.5 text-left text-ui transition-colors hover:bg-black/4 dark:hover:bg-white/5"
      >
        <span className="line-clamp-2 font-medium text-foreground">{channel.title}</span>
        <span className="mt-0.5 block text-label text-muted">{channel.category}</span>
      </button>
      <div className="border-t border-border bg-paper/80 px-2 py-2 dark:bg-paper-light/20">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddVideo(channel.id);
            }}
            className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface px-2 py-2 text-label font-medium text-foreground transition-colors hover:bg-black/4 dark:hover:bg-white/5"
          >
            <Video className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
            <span className="truncate">Add video</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddIdea(channel.id);
            }}
            className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface px-2 py-2 text-label font-medium text-foreground transition-colors hover:bg-black/4 dark:hover:bg-white/5"
          >
            <Lightbulb className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
            Idea
          </button>
        </div>
      </div>
    </div>
  );
}
