"use client";

import { CirclePlus } from "lucide-react";
import type { ChannelRow } from "@/lib/types/channel";
import { ThemeToggle } from "@/components/theme-toggle";

export function Sidebar({
  channels,
  onNewChannel,
  selectedId,
  onSelectChannel,
}: {
  channels: ChannelRow[];
  onNewChannel: () => void;
  selectedId: string | null;
  onSelectChannel: (id: string) => void;
}) {
  return (
    <aside className="hidden w-[260px] shrink-0 border-r border-border bg-paper lg:flex lg:flex-col">
      <div className="border-b border-border px-4 py-4">
        <div className="mb-3">
          <div className="font-serif text-h4 text-foreground">Praxis</div>
          <div className="text-body text-muted">Personal project memory</div>
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
          <div className="space-y-0.5">
            {channels.map((ch) => {
              const active = ch.id === selectedId;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => onSelectChannel(ch.id)}
                  className={`w-full rounded-md px-3 py-2 text-left text-ui transition-colors ${
                    active
                      ? "bg-black/6 font-medium text-foreground dark:bg-white/10"
                      : "text-muted hover:bg-black/4 hover:text-foreground dark:hover:bg-white/5"
                  }`}
                >
                  <span className="line-clamp-2">{ch.title}</span>
                  <span className="mt-0.5 block text-label text-muted">
                    {ch.category}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-border p-4">
        <ThemeToggle />
      </div>
    </aside>
  );
}
