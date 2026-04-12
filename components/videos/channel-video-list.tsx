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
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-amber-600 transition-colors hover:bg-amber-500/15 dark:text-amber-400 dark:hover:bg-amber-400/15"
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
          className="h-2 w-2 shrink-0 rounded-full bg-amber-500 shadow-[0_0_0_1px_rgba(245,158,11,0.45)] dark:bg-amber-400 dark:shadow-[0_0_0_1px_rgba(251,191,36,0.5)]"
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
              <button
                type="button"
                onClick={() => onSelectVideo(video)}
                className="w-full rounded-lg border border-border bg-surface p-4 text-left shadow-soft transition-colors hover:bg-black/4 dark:hover:bg-white/5"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
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
                      <span className="min-w-0 font-medium text-foreground">{video.title}</span>
                    </div>
                    {video.brief ? (
                      <p className="mt-1 line-clamp-2 text-body leading-6 text-muted">{video.brief}</p>
                    ) : null}
                    <div className="mt-2 text-label text-muted">{formatDate(video.created_at)}</div>
                  </div>
                  {promise ? (
                    <div className="shrink-0 pt-px">
                      <NextEpisodePromiseDot promiseText={promise} />
                    </div>
                  ) : null}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
