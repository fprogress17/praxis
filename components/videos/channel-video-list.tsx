"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { VideoRow } from "@/lib/types/video";
import { statusDotClass } from "@/lib/video-status";

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function NextEpisodePromisePopover({
  promiseText,
  anchor,
  triggerRef,
  onClose,
}: {
  promiseText: string;
  anchor: { top: number; left: number };
  triggerRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onPointer = (e: MouseEvent | PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer, true);
    };
  }, [onClose, triggerRef]);

  const maxW = 288;
  const left = Math.max(8, Math.min(anchor.left, typeof window !== "undefined" ? window.innerWidth - maxW - 8 : anchor.left));

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Next episode promise"
      className="fixed z-[100] max-h-48 max-w-[min(18rem,calc(100vw-1rem))] overflow-y-auto rounded-md border border-border bg-surface p-3 text-meta leading-relaxed text-foreground shadow-lift"
      style={{ top: anchor.top, left }}
    >
      <div className="mb-1 text-micro font-semibold uppercase tracking-wide text-muted">
        Next episode promise
      </div>
      <p className="whitespace-pre-wrap">{promiseText}</p>
    </div>,
    document.body,
  );
}

function NextEpisodePromiseDot({ promiseText }: { promiseText: string }) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState({ top: 0, left: 0 });

  const toggle = useCallback(() => {
    if (open) {
      setOpen(false);
      return;
    }
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setAnchor({ top: r.top, left: r.left });
    setOpen(true);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-md text-accent transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        aria-label="Next episode promise"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }}
      >
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent shadow-[0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
          aria-hidden
        />
      </button>
      {open ? (
        <NextEpisodePromisePopover
          promiseText={promiseText}
          anchor={anchor}
          triggerRef={triggerRef}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

export function ChannelVideoList({
  videos,
  onSelectVideo,
}: {
  videos: VideoRow[];
  onSelectVideo: (video: VideoRow) => void;
}) {
  if (videos.length === 0) {
    return (
      <div className="mt-10 rounded-lg border border-dashed border-border bg-surface/60 p-8 text-center text-meta text-muted">
        No videos yet. Use <strong className="text-foreground">Add video</strong> on the channel
        card to create one.
      </div>
    );
  }

  return (
    <section className="mt-10">
      <div className="mb-4 text-micro font-semibold uppercase tracking-[0.08em] text-muted">
        Videos
      </div>
      <ul className="space-y-3">
        {videos.map((video) => {
          const promise = video.next_episode_promise?.trim() ?? "";
          return (
            <li key={video.id}>
              <div className="flex items-stretch gap-0 rounded-lg border border-border bg-surface shadow-soft">
                <button
                  type="button"
                  onClick={() => onSelectVideo(video)}
                  className="min-w-0 flex-1 p-4 text-left transition-colors hover:bg-black/4 dark:hover:bg-white/5"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(video.status)}`}
                      title={video.status.replace(/_/g, " ")}
                      aria-hidden
                    />
                    {video.episode ? (
                      <span className="shrink-0 rounded bg-black/6 px-1.5 py-0.5 font-mono text-label text-muted dark:bg-white/10">
                        {video.episode}
                      </span>
                    ) : null}
                    <span className="font-medium text-foreground">{video.title}</span>
                  </div>
                  {video.brief ? (
                    <p className="mt-1 line-clamp-2 text-body leading-6 text-muted">{video.brief}</p>
                  ) : null}
                  <div className="mt-2 text-label text-muted">{formatDate(video.created_at)}</div>
                </button>
                {promise ? (
                  <div className="flex shrink-0 border-l border-border/60 pr-1 pl-0.5">
                    <NextEpisodePromiseDot promiseText={promise} />
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
