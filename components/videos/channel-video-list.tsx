"use client";

import type { VideoRow } from "@/lib/types/video";

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
        {videos.map((video) => (
          <li key={video.id}>
            <button
              type="button"
              onClick={() => onSelectVideo(video)}
              className="w-full rounded-lg border border-border bg-surface p-4 text-left shadow-soft transition-colors hover:bg-black/4 dark:hover:bg-white/5"
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
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
          </li>
        ))}
      </ul>
    </section>
  );
}
