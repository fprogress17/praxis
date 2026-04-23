import { query } from "@/lib/server/db";

export type IdeaMutationResult = { ok: true } | { ok: false; error: string };
export type WorkspaceIdeaMutationResult = { ok: true } | { ok: false; error: string };

export type IdeaInput = {
  idea_id?: string;
  channel_id?: string;
  body: string;
};

export type WorkspaceIdeaInput = {
  idea_id?: string;
  body: string;
};

export function parseIdeaFormData(formData: FormData): IdeaInput {
  const idea_id = String(formData.get("idea_id") ?? "").trim();
  const channel_id = String(formData.get("channel_id") ?? "").trim();

  return {
    ...(idea_id ? { idea_id } : {}),
    ...(channel_id ? { channel_id } : {}),
    body: String(formData.get("body") ?? "").trim(),
  };
}

export function parseWorkspaceIdeaFormData(formData: FormData): WorkspaceIdeaInput {
  const idea_id = String(formData.get("idea_id") ?? "").trim();

  return {
    ...(idea_id ? { idea_id } : {}),
    body: String(formData.get("body") ?? "").trim(),
  };
}

export async function createIdeaRecord(input: IdeaInput): Promise<IdeaMutationResult> {
  const channelId = input.channel_id?.trim() ?? "";
  if (!channelId) {
    return { ok: false, error: "Channel is missing." };
  }
  if (!input.body) {
    return { ok: false, error: "Write something before saving." };
  }

  try {
    await query(`insert into public.ideas (channel_id, body) values ($1, $2)`, [channelId, input.body]);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not create idea." };
  }

  return { ok: true };
}

export async function updateIdeaRecord(input: IdeaInput): Promise<IdeaMutationResult> {
  const ideaId = input.idea_id?.trim() ?? "";
  if (!ideaId) {
    return { ok: false, error: "Idea is missing." };
  }
  if (!input.body) {
    return { ok: false, error: "Write something before saving." };
  }

  try {
    await query(`update public.ideas set body = $2 where id = $1`, [ideaId, input.body]);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not update idea." };
  }

  return { ok: true };
}

export async function deleteIdeaRecord(ideaId: string): Promise<IdeaMutationResult> {
  const trimmed = ideaId.trim();
  if (!trimmed) {
    return { ok: false, error: "Idea is missing." };
  }

  try {
    await query(`delete from public.ideas where id = $1`, [trimmed]);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete idea." };
  }

  return { ok: true };
}

export async function createWorkspaceIdeaRecord(
  input: WorkspaceIdeaInput,
): Promise<WorkspaceIdeaMutationResult> {
  if (!input.body) {
    return { ok: false, error: "Write something before saving." };
  }

  try {
    await query(`insert into public.workspace_ideas (body) values ($1)`, [input.body]);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not create workspace idea.",
    };
  }

  return { ok: true };
}

export async function updateWorkspaceIdeaRecord(
  input: WorkspaceIdeaInput,
): Promise<WorkspaceIdeaMutationResult> {
  const ideaId = input.idea_id?.trim() ?? "";
  if (!ideaId) {
    return { ok: false, error: "Idea is missing." };
  }
  if (!input.body) {
    return { ok: false, error: "Write something before saving." };
  }

  try {
    await query(`update public.workspace_ideas set body = $2 where id = $1`, [ideaId, input.body]);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not update workspace idea.",
    };
  }

  return { ok: true };
}

export async function deleteWorkspaceIdeaRecord(
  ideaId: string,
): Promise<WorkspaceIdeaMutationResult> {
  const trimmed = ideaId.trim();
  if (!trimmed) {
    return { ok: false, error: "Idea is missing." };
  }

  try {
    await query(`delete from public.workspace_ideas where id = $1`, [trimmed]);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not delete workspace idea.",
    };
  }

  return { ok: true };
}
