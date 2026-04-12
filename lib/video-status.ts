export type VideoStatus = "draft" | "published" | "skip" | "to_be_published";

export const VIDEO_STATUS_OPTIONS: {
  value: VideoStatus;
  label: string;
  /** Tailwind classes for the color dot */
  dot: string;
}[] = [
  { value: "draft", label: "Draft", dot: "bg-zinc-400 dark:bg-zinc-500" },
  { value: "published", label: "Published", dot: "bg-emerald-500 dark:bg-emerald-400" },
  { value: "skip", label: "Skip", dot: "bg-amber-500 dark:bg-amber-400" },
  { value: "to_be_published", label: "To be published", dot: "bg-sky-500 dark:bg-sky-400" },
];

const ALLOWED = new Set<string>(VIDEO_STATUS_OPTIONS.map((o) => o.value));

export function normalizeVideoStatus(raw: string | null | undefined): VideoStatus {
  const v = String(raw ?? "").trim();
  if (ALLOWED.has(v)) return v as VideoStatus;
  return "draft";
}

export function statusDotClass(status: string): string {
  return VIDEO_STATUS_OPTIONS.find((o) => o.value === status)?.dot ?? "bg-zinc-400 dark:bg-zinc-500";
}
