/** Top-level channel categories — extend in DB check constraint when adding here. */
export const CHANNEL_CATEGORIES = [
  "English",
  "History",
  "Geopolitics",
  "Korea social",
  "Technology",
  "Other",
] as const;

export type ChannelCategory = (typeof CHANNEL_CATEGORIES)[number];
