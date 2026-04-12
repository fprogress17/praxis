"use client";

import { PanelLeftOpen } from "lucide-react";

/** Shown below lg when channels nav is collapsed during video compose/edit. */
export function MobileChannelsCollapsedBar({
  onOpen,
  onGoHome,
  subtitle = "New video",
}: {
  onOpen: () => void;
  onGoHome: () => void;
  subtitle?: string;
}) {
  return (
    <header className="sticky top-0 z-20 flex shrink-0 items-center justify-between gap-3 border-b border-border bg-paper px-4 py-3 lg:hidden">
      <button
        type="button"
        onClick={onGoHome}
        className="min-w-0 rounded-md text-left outline-none ring-offset-2 ring-offset-paper transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent dark:ring-offset-paper"
      >
        <div className="font-serif text-h4 leading-tight text-foreground">Praxis</div>
        <div className="truncate text-meta text-muted">{subtitle}</div>
      </button>
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
