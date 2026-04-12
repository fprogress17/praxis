"use client";

export function PanelResizeHandle({
  onMouseDown,
  dragging,
}: {
  onMouseDown: (e: React.MouseEvent) => void;
  dragging: boolean;
}) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize right panel"
      className={`hidden w-3 shrink-0 cursor-col-resize select-none border-l border-border bg-paper xl:block ${
        dragging ? "bg-accent/15" : "hover:bg-black/4 dark:hover:bg-white/5"
      }`}
      onMouseDown={onMouseDown}
    />
  );
}
