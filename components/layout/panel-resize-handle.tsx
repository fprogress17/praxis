"use client";

import { forwardRef } from "react";

export const PanelResizeHandle = forwardRef<
  HTMLDivElement,
  {
    onMouseDown: (e: React.MouseEvent) => void;
    dragging: boolean;
  }
>(function PanelResizeHandle({ onMouseDown, dragging }, ref) {
  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize right panel"
      className={`hidden w-3 shrink-0 cursor-col-resize select-none border-l border-border bg-paper xl:block ${
        dragging ? "bg-accent/15" : "hover:bg-black/4 dark:hover:bg-white/5"
      }`}
      onMouseDown={onMouseDown}
    />
  );
});

PanelResizeHandle.displayName = "PanelResizeHandle";
