"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api/url";
import { VideoEpisodeStatusRow } from "@/components/videos/video-episode-status-row";
import { defaultEpisodeForNewVideo } from "@/lib/episode";
import type { VideoRow } from "@/lib/types/video";
import type { ScriptVersionRow, ScriptType } from "@/lib/types/script-version";

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

  // Controlled values so loading a past version updates the textarea.
  const [scriptValue, setScriptValue] = useState(video.script ?? "");
  const [ttsScriptValue, setTtsScriptValue] = useState(video.tts_script ?? "");

  const [versions, setVersions] = useState<ScriptVersionRow[]>([]);
  const [loadedScriptVersion, setLoadedScriptVersion] = useState<number | null>(null);
  const [loadedTtsVersion, setLoadedTtsVersion] = useState<number | null>(null);
  const [savingVersion, setSavingVersion] = useState<ScriptType | null>(null);
  const [versionError, setVersionError] = useState<string | null>(null);

  // Fetch existing versions for this video on mount.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const response = await fetch(apiUrl(`/api/videos/${video.id}/script-versions`), {
        cache: "no-store",
      });
      const result = (await response.json()) as {
        ok: boolean;
        versions?: ScriptVersionRow[];
      };
      if (!cancelled && result.ok) {
        setVersions(result.versions ?? []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [video.id]);

  const scriptVersions = useMemo(
    () => versions.filter((v) => v.script_type === "script"),
    [versions],
  );
  const ttsVersions = useMemo(
    () => versions.filter((v) => v.script_type === "tts_script"),
    [versions],
  );

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
    // Controlled textareas write to the DOM so FormData captures them, but
    // set explicitly to be safe.
    fd.set("script", scriptValue);
    fd.set("tts_script", ttsScriptValue);

    setPending(true);
    try {
      const response = await fetch(apiUrl(`/api/videos/${video.id}`), {
        method: "PATCH",
        body: fd,
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!result.ok) {
        setError(result.error ?? "Could not update video.");
        return;
      }
      onDone();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function onSaveVersion(scriptType: ScriptType) {
    setVersionError(null);
    setSavingVersion(scriptType);
    try {
      const body = scriptType === "script" ? scriptValue : ttsScriptValue;
      const response = await fetch(apiUrl(`/api/videos/${video.id}/script-versions`), {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ scriptType, body }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        error?: string;
        version?: ScriptVersionRow;
      };
      if (!result.ok) {
        setVersionError(result.error ?? "Could not save script version.");
        return;
      }
      if (!result.version) {
        setVersionError("Script version response was incomplete.");
        return;
      }
      const version = result.version;
      setVersions((prev) => [...prev, version]);
      if (scriptType === "script") setLoadedScriptVersion(version.version_number);
      else setLoadedTtsVersion(version.version_number);
    } finally {
      setSavingVersion(null);
    }
  }

  function loadVersion(v: ScriptVersionRow) {
    if (v.script_type === "script") {
      setScriptValue(v.body);
      setLoadedScriptVersion(v.version_number);
    } else {
      setTtsScriptValue(v.body);
      setLoadedTtsVersion(v.version_number);
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

          {/* Script with versioning */}
          <ScriptField
            htmlId="edit-video-script"
            label="Script"
            value={scriptValue}
            onChange={setScriptValue}
            rows={14}
            placeholder="Outline, full script, or notes…"
            versions={scriptVersions}
            loadedVersion={loadedScriptVersion}
            onLoadVersion={loadVersion}
            onSaveVersion={() => onSaveVersion("script")}
            saving={savingVersion === "script"}
          />

          {/* TTS Script with versioning */}
          <ScriptField
            htmlId="edit-video-tts-script"
            label="TTS Script"
            value={ttsScriptValue}
            onChange={setTtsScriptValue}
            rows={14}
            placeholder="Narration or voice-over text optimized for TTS…"
            versions={ttsVersions}
            loadedVersion={loadedTtsVersion}
            onLoadVersion={loadVersion}
            onSaveVersion={() => onSaveVersion("tts_script")}
            saving={savingVersion === "tts_script"}
          />

          <div>
            <label
              htmlFor="edit-video-next-episode-promise"
              className="mb-1.5 block text-label font-medium text-foreground"
            >
              Next episode promise
            </label>
            <textarea
              id="edit-video-next-episode-promise"
              name="next_episode_promise"
              rows={4}
              defaultValue={video.next_episode_promise}
              placeholder="What you'll cover next time — outro tease, series hook, or CTA…"
              className="w-full resize-y rounded-md border border-border bg-paper px-3 py-2 text-body leading-7 text-foreground shadow-sm outline-none ring-accent/30 placeholder:text-muted focus:ring-2 dark:bg-paper-light/30"
            />
          </div>
        </div>

        {versionError ? (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-meta text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            {versionError}
          </p>
        ) : null}

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

function ScriptField({
  htmlId,
  label,
  value,
  onChange,
  rows,
  placeholder,
  versions,
  loadedVersion,
  onLoadVersion,
  onSaveVersion,
  saving,
}: {
  htmlId: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
  placeholder: string;
  versions: ScriptVersionRow[];
  loadedVersion: number | null;
  onLoadVersion: (v: ScriptVersionRow) => void;
  onSaveVersion: () => void;
  saving: boolean;
}) {
  const nextVersionNumber = versions.length > 0
    ? versions[versions.length - 1].version_number + 1
    : 1;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={htmlId} className="text-label font-medium text-foreground">
          {label}
        </label>
        <button
          type="button"
          onClick={onSaveVersion}
          disabled={saving || !value.trim()}
          className="shrink-0 rounded border border-border px-2.5 py-1 text-meta font-medium text-muted transition-colors hover:border-foreground/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Saving…" : `Save v${nextVersionNumber}`}
        </button>
      </div>

      {versions.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {versions.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onLoadVersion(v)}
              className={`rounded px-2 py-0.5 text-meta transition-colors ${
                loadedVersion === v.version_number
                  ? "bg-ink text-paper-light dark:bg-accent dark:text-paper"
                  : "border border-border text-muted hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              v{v.version_number}
            </button>
          ))}
        </div>
      ) : null}

      <textarea
        id={htmlId}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-y rounded-md border border-border bg-paper px-3 py-2 font-serif text-body leading-7 text-foreground shadow-sm outline-none ring-accent/30 placeholder:text-muted focus:ring-2 dark:bg-paper-light/30"
      />
    </div>
  );
}
