import { query } from "@/lib/server/db";

export type NoteMutationResult = { ok: true } | { ok: false; error: string };
export type WorkspaceNoteMutationResult = { ok: true } | { ok: false; error: string };

export type NoteInput = {
  id?: string;
  channel_id?: string;
  video_id?: string | null;
  title: string;
  body: string;
};

export type WorkspaceNoteInput = {
  id?: string;
  title: string;
  body: string;
};

export function parseNoteFormData(formData: FormData): NoteInput {
  const id = String(formData.get("id") ?? "").trim();
  const channel_id = String(formData.get("channel_id") ?? "").trim();
  const video_id_raw = String(formData.get("video_id") ?? "").trim();

  return {
    ...(id ? { id } : {}),
    ...(channel_id ? { channel_id } : {}),
    video_id: video_id_raw.length > 0 ? video_id_raw : null,
    title: String(formData.get("title") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim(),
  };
}

export function parseWorkspaceNoteFormData(formData: FormData): WorkspaceNoteInput {
  const id = String(formData.get("id") ?? "").trim();

  return {
    ...(id ? { id } : {}),
    title: String(formData.get("title") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim(),
  };
}

export async function createNoteRecord(input: NoteInput): Promise<NoteMutationResult> {
  const channelId = input.channel_id?.trim() ?? "";
  if (!channelId) {
    return { ok: false, error: "Channel is missing." };
  }

  try {
    await query(
      `insert into public.notes (channel_id, title, body, video_id)
       values ($1, $2, $3, $4)`,
      [channelId, input.title, input.body, input.video_id ?? null],
    );
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not create note." };
  }

  return { ok: true };
}

export async function updateNoteRecord(input: NoteInput): Promise<NoteMutationResult> {
  const id = input.id?.trim() ?? "";
  if (!id) {
    return { ok: false, error: "Note id is missing." };
  }

  try {
    await query(`update public.notes set title = $2, body = $3 where id = $1`, [
      id,
      input.title,
      input.body,
    ]);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update note." };
  }

  return { ok: true };
}

export async function deleteNoteRecord(id: string): Promise<NoteMutationResult> {
  const trimmed = id.trim();
  if (!trimmed) {
    return { ok: false, error: "Note id is missing." };
  }

  try {
    await query(`delete from public.notes where id = $1`, [trimmed]);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete note." };
  }

  return { ok: true };
}

export async function createWorkspaceNoteRecord(
  input: WorkspaceNoteInput,
): Promise<WorkspaceNoteMutationResult> {
  try {
    await query(`insert into public.workspace_notes (title, body) values ($1, $2)`, [
      input.title,
      input.body,
    ]);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not create workspace note.",
    };
  }

  return { ok: true };
}

export async function updateWorkspaceNoteRecord(
  input: WorkspaceNoteInput,
): Promise<WorkspaceNoteMutationResult> {
  const id = input.id?.trim() ?? "";
  if (!id) {
    return { ok: false, error: "Note id is missing." };
  }

  try {
    await query(`update public.workspace_notes set title = $2, body = $3 where id = $1`, [
      id,
      input.title,
      input.body,
    ]);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not update workspace note.",
    };
  }

  return { ok: true };
}

export async function deleteWorkspaceNoteRecord(
  id: string,
): Promise<WorkspaceNoteMutationResult> {
  const trimmed = id.trim();
  if (!trimmed) {
    return { ok: false, error: "Note id is missing." };
  }

  try {
    await query(`delete from public.workspace_notes where id = $1`, [trimmed]);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not delete workspace note.",
    };
  }

  return { ok: true };
}
