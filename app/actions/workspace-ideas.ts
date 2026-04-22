"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/server/db";

export type WorkspaceIdeaMutationResult = { ok: true } | { ok: false; error: string };

export async function createWorkspaceIdea(formData: FormData): Promise<WorkspaceIdeaMutationResult> {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) {
    return { ok: false, error: "Write something before saving." };
  }

  try {
    await query(`insert into public.workspace_ideas (body) values ($1)`, [body]);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not create workspace idea.",
    };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function updateWorkspaceIdea(formData: FormData): Promise<WorkspaceIdeaMutationResult> {
  const idea_id = String(formData.get("idea_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!idea_id) {
    return { ok: false, error: "Idea is missing." };
  }
  if (!body) {
    return { ok: false, error: "Write something before saving." };
  }

  try {
    await query(`update public.workspace_ideas set body = $2 where id = $1`, [idea_id, body]);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not update workspace idea.",
    };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function deleteWorkspaceIdea(formData: FormData): Promise<WorkspaceIdeaMutationResult> {
  const idea_id = String(formData.get("idea_id") ?? "").trim();
  if (!idea_id) {
    return { ok: false, error: "Idea is missing." };
  }

  try {
    await query(`delete from public.workspace_ideas where id = $1`, [idea_id]);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not delete workspace idea.",
    };
  }

  revalidatePath("/");
  return { ok: true };
}
