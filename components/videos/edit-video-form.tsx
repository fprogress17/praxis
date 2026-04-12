"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updateVideo } from "@/app/actions/videos";
import { VideoEpisodeStatusRow } from "@/components/videos/video-episode-status-row";
import { defaultEpisodeForNewVideo } from "@/lib/episode";
import type { VideoRow } from "@/lib/types/video";

export function EditVideoForm({
  video,
  channelTitle,
  usedEpisodesByOthers,
  onDone,
}: {
  video: VideoRow;
  channelTitle: string;
  /** Episodes taken by other videos in this channel (exclude current). */
  usedEpisodesByOthers: string[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultEpisode = useMemo(() => {
    const cur = video.episode?.trim();
    if (cur) return cur;
    return defaultEpisodeForNewVideo(usedEpisodesByOthers);
  }, [video.episode, usedEpisodesByOthers]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);

    setPending(true);
    try {
      const result = await updateVideo(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onDone();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-8">
      <div className="mb-4 text-micro font-semibold uppercase tracking-[0.08em] text-muted">
        Edit video
      </div>
      <form
        key={video.id}
        onSubmit={onSubmit}
        className="rounded-lg border border-border bg-surface p-6 shadow-soft"
      >
        <input type="hidden" name="id" value={video.id} />
        <p className="mb-5 text-meta text-muted">
          Channel: <span className="font-medium text-foreground">{channelTitle}</span>
        </p>

        <div className="space-y-5">
          <VideoEpisodeStatusRow
            episodeDefault={defaultEpisode}
            statusDefault={video.status}
            episodeHtmlId="edit-video-episode"
            statusHtmlId="edit-video-status"
          />

          <div>
            <label
              htmlFor="edit-video-title"
              className="mb-1.5 block text-label font-medium text-foreground"
            >
              Video title
            </label>
            <input
              id="edit-video-title"
              name="title"
              required
              defaultValue={video.title}
              className="w-full rounded-md border border-border bg-paper px-3 py-2 text-ui text-foreground shadow-sm outline-none ring-accent/30 focus:ring-2 dark:bg-paper-light/30"
            />
          </div>

          <div>
            <label
              htmlFor="edit-video-brief"
              className="mb-1.5 block text-label font-medium text-foreground"
            >
              Brief
            </label>
            <textarea
              id="edit-video-brief"
              name="brief"
              rows={3}
              defaultValue={video.brief}
              placeholder="One-line pitch or hook…"
              className="w-full resize-y rounded-md border border-border bg-paper px-3 py-2 text-body leading-7 text-foreground shadow-sm outline-none ring-accent/30 placeholder:text-muted focus:ring-2 dark:bg-paper-light/30"
            />
          </div>

          <div>
            <label
              htmlFor="edit-video-script"
              className="mb-1.5 block text-label font-medium text-foreground"
            >
              Script
            </label>
            <textarea
              id="edit-video-script"
              name="script"
              rows={14}
              defaultValue={video.script}
              placeholder="Outline, full script, or notes…"
              className="w-full resize-y rounded-md border border-border bg-paper px-3 py-2 font-serif text-body leading-7 text-foreground shadow-sm outline-none ring-accent/30 placeholder:text-muted focus:ring-2 dark:bg-paper-light/30"
            />
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-meta text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-ink px-4 py-2 text-ui font-medium text-paper-light transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-accent dark:text-paper"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={onDone}
            disabled={pending}
            className="rounded-md border border-border bg-transparent px-4 py-2 text-ui font-medium text-foreground hover:bg-black/4 dark:hover:bg-white/5"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
