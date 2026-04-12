"use client";

import { useState } from "react";
import { EPISODE_SELECT_OPTIONS } from "@/lib/episode";
import {
  normalizeVideoStatus,
  statusDotClass,
  VIDEO_STATUS_OPTIONS,
  type VideoStatus,
} from "@/lib/video-status";

export const compactEpisodeSelectClass =
  "h-7 max-w-[5.25rem] rounded border border-border bg-paper py-0 pl-1.5 pr-5 text-label text-foreground shadow-sm outline-none ring-accent/20 focus:ring-1 dark:bg-paper-light/30";

export const compactStatusSelectClass =
  "h-7 min-w-[8.5rem] max-w-[12rem] rounded border border-border bg-paper py-0 pl-1.5 pr-5 text-label text-foreground shadow-sm outline-none ring-accent/20 focus:ring-1 dark:bg-paper-light/30";

export function VideoEpisodeStatusRow({
  episodeDefault,
  statusDefault,
  episodeHtmlId,
  statusHtmlId,
}: {
  episodeDefault: string;
  statusDefault: string;
  episodeHtmlId: string;
  statusHtmlId: string;
}) {
  const [status, setStatus] = useState<VideoStatus>(normalizeVideoStatus(statusDefault));

  return (
    <div>
      <div className="flex flex-wrap items-end gap-5 gap-y-2">
        <div className="min-w-0">
          <label
            htmlFor={episodeHtmlId}
            className="mb-1 block text-micro font-medium uppercase tracking-wide text-muted"
          >
            Episode
          </label>
          <select
            id={episodeHtmlId}
            name="episode"
            defaultValue={episodeDefault}
            className={compactEpisodeSelectClass}
          >
            {EPISODE_SELECT_OPTIONS.map((ep) => (
              <option key={ep} value={ep}>
                {ep}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <label
            htmlFor={statusHtmlId}
            className="mb-1 block text-micro font-medium uppercase tracking-wide text-muted"
          >
            Status
          </label>
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(status)}`}
              aria-hidden
            />
            <select
              id={statusHtmlId}
              name="status"
              value={status}
              onChange={(e) => setStatus(normalizeVideoStatus(e.target.value))}
              className={compactStatusSelectClass}
            >
              {VIDEO_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <p className="mt-2 text-micro leading-snug text-muted">
        ep0001–ep2000 · one code per channel · status dot matches selection
      </p>
    </div>
  );
}
