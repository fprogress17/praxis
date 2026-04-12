"use client";

import { PanelLeftOpen } from "lucide-react";

/** Narrow strip with button to reopen the desktop channels sidebar (lg+). */
export function ChannelsPanelRail({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="hidden w-12 shrink-0 flex-col items-center border-r border-border bg-paper pt-4 lg:flex">
      <button
        type="button"
        onClick={onOpen}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface text-foreground shadow-soft transition-colors hover:bg-black/4 dark:hover:bg-white/5"
        title="Open channels panel"
        aria-label="Open channels panel"
      >
        <PanelLeftOpen className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}
