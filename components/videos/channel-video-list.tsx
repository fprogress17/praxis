"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api/url";
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

function DeleteVideoConfirmPopover({
  video,
  anchor,
  triggerRef,
  deleting,
  onConfirm,
  onClose,
}: {
  video: VideoRow;
  anchor: { top: number; left: number };
  triggerRef: RefObject<HTMLButtonElement | null>;
  deleting: boolean;
  onConfirm: () => void;
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

  const maxW = 320;
  const left = Math.max(
    8,
    Math.min(anchor.left, typeof window !== "undefined" ? window.innerWidth - maxW - 8 : anchor.left),
  );
  const label = `${video.episode ? `${video.episode} ` : ""}${video.title}`;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Delete video confirmation"
      className="fixed z-[100] w-[min(20rem,calc(100vw-1rem))] rounded-md border border-border bg-surface p-3 text-meta leading-relaxed text-foreground shadow-lift"
      style={{ top: anchor.top, left }}
    >
      <div className="text-micro font-semibold uppercase tracking-wide text-muted">Delete video</div>
      <p className="mt-2 text-ui font-medium text-foreground">{label}</p>
      <p className="mt-1 text-meta text-muted">This cannot be undone.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-meta font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
          Delete
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={deleting}
          className="rounded-md border border-border px-3 py-1.5 text-meta font-medium text-foreground hover:bg-black/4 disabled:opacity-60 dark:hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
    </div>,
    document.body,
  );
}

function DeleteVideoButton({
  video,
  deleting,
  onConfirm,
}: {
  video: VideoRow;
  deleting: boolean;
  onConfirm: (video: VideoRow, onDone: () => void) => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState({ top: 0, left: 0 });

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setAnchor({ top: r.bottom + 6, left: r.right - 320 });
    setOpen(true);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }}
        disabled={deleting}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-red-500/10 hover:text-red-800 disabled:opacity-50 dark:hover:text-red-300"
        aria-label="Delete video"
        title="Delete video"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      </button>
      {open ? (
        <DeleteVideoConfirmPopover
          video={video}
          anchor={anchor}
          triggerRef={triggerRef}
          deleting={deleting}
          onConfirm={() => onConfirm(video, () => setOpen(false))}
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
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onDeleteVideo(video: VideoRow, onDone: () => void) {
    setError(null);
    setDeletingId(video.id);
    try {
      const response = await fetch(apiUrl(`/api/videos/${video.id}`), {
        method: "DELETE",
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!result.ok) {
        setError(result.error ?? "Could not delete video.");
        return;
      }

      onDone();
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

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
      {error ? (
        <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-meta text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </p>
      ) : null}
      <ul className="space-y-3">
        {videos.map((video) => {
          const promise = video.next_episode_promise?.trim() ?? "";
          return (
            <li key={video.id}>
              {/* Outer div — cannot wrap <button> around NextEpisodePromiseDot (also a button). */}
              <div className="flex w-full items-start gap-2 rounded-lg border border-border bg-surface p-4 text-left shadow-soft transition-colors hover:bg-black/4 dark:hover:bg-white/5">
                <button
                  type="button"
                  onClick={() => onSelectVideo(video)}
                  className="min-w-0 flex-1 text-left outline-none ring-offset-2 ring-offset-paper focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-accent dark:ring-offset-paper"
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
                    <span className="min-w-0 font-medium text-foreground">{video.title}</span>
                  </div>
                  {video.brief ? (
                    <p className="mt-1 line-clamp-2 text-body leading-6 text-muted">{video.brief}</p>
                  ) : null}
                  <div className="mt-2 text-label text-muted">{formatDate(video.created_at)}</div>
                </button>
                {promise ? (
                  <div className="shrink-0 pt-px">
                    <NextEpisodePromiseDot promiseText={promise} />
                  </div>
                ) : null}
                <DeleteVideoButton
                  video={video}
                  deleting={deletingId !== null}
                  onConfirm={(target, onDone) => void onDeleteVideo(target, onDone)}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
