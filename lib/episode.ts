/** Max episode index in dropdown: ep0001 … ep2000 */
export const EPISODE_MAX = 2000;

export function formatEpisodeCode(n: number): string {
  if (n < 1 || n > EPISODE_MAX) return "ep0001";
  return `ep${String(n).padStart(4, "0")}`;
}

/** Prebuilt list for `<select>` — ep0001 … ep2000 */
export const EPISODE_SELECT_OPTIONS: string[] = Array.from({ length: EPISODE_MAX }, (_, i) =>
  formatEpisodeCode(i + 1),
);

/** First `epNNNN` in range not present in this channel’s used list. */
export function defaultEpisodeForNewVideo(usedEpisodes: string[]): string {
  const used = new Set(usedEpisodes.filter(Boolean));
  for (let i = 1; i <= EPISODE_MAX; i++) {
    const e = formatEpisodeCode(i);
    if (!used.has(e)) return e;
  }
  return formatEpisodeCode(1);
}
