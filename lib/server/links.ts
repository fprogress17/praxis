import { query } from "@/lib/server/db";

export type LinkMutationResult = { ok: true } | { ok: false; error: string };

export type LinkInput = {
  id?: string;
  channel_id?: string | null;
  video_id?: string | null;
  title: string;
  url: string;
  note: string;
};

function normalizeUrl(raw: string) {
  const value = raw.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export function parseLinkFormData(formData: FormData): LinkInput {
  const id = String(formData.get("id") ?? "").trim();
  const channel_id = String(formData.get("channel_id") ?? "").trim();
  const video_id = String(formData.get("video_id") ?? "").trim();

  return {
    ...(id ? { id } : {}),
    channel_id: channel_id || null,
    video_id: video_id || null,
    title: String(formData.get("title") ?? "").trim(),
    url: normalizeUrl(String(formData.get("url") ?? "")),
    note: String(formData.get("note") ?? "").trim(),
  };
}

export async function createLinkRecord(input: LinkInput): Promise<LinkMutationResult> {
  if (!input.url) return { ok: false, error: "URL is required." };

  try {
    await query(
      `insert into public.links (channel_id, video_id, title, url, note)
       values ($1, $2, $3, $4, $5)`,
      [input.channel_id ?? null, input.video_id ?? null, input.title, input.url, input.note],
    );
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not create link." };
  }

  return { ok: true };
}

export async function updateLinkRecord(input: LinkInput): Promise<LinkMutationResult> {
  const id = input.id?.trim() ?? "";
  if (!id) return { ok: false, error: "Link id is missing." };
  if (!input.url) return { ok: false, error: "URL is required." };

  try {
    await query(`update public.links set title = $2, url = $3, note = $4 where id = $1`, [
      id,
      input.title,
      input.url,
      input.note,
    ]);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update link." };
  }

  return { ok: true };
}

export async function deleteLinkRecord(id: string): Promise<LinkMutationResult> {
  const trimmed = id.trim();
  if (!trimmed) return { ok: false, error: "Link id is missing." };

  try {
    await query(`delete from public.links where id = $1`, [trimmed]);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete link." };
  }

  return { ok: true };
}
