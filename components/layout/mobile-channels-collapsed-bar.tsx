"use client";

import { PanelLeftOpen } from "lucide-react";

/** Shown below lg when channels nav is collapsed during new-video flow. */
export function MobileChannelsCollapsedBar({ onOpen }: { onOpen: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex shrink-0 items-center justify-between gap-3 border-b border-border bg-paper px-4 py-3 lg:hidden">
      <div className="min-w-0">
        <div className="font-serif text-h4 leading-tight text-foreground">Praxis</div>
        <div className="truncate text-meta text-muted">New video</div>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-label font-medium text-foreground shadow-soft"
        aria-label="Open channels"
      >
        <PanelLeftOpen className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        Open channels
      </button>
    </header>
  );
}
