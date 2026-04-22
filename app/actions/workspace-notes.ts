"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/server/db";

export type WorkspaceNoteMutationResult = { ok: true } | { ok: false; error: string };

export async function createWorkspaceNote(
  formData: FormData,
): Promise<WorkspaceNoteMutationResult> {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  try {
    await query(`insert into public.workspace_notes (title, body) values ($1, $2)`, [title, body]);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not create workspace note.",
    };
  }
  revalidatePath("/");
  return { ok: true };
}

export async function updateWorkspaceNote(
  formData: FormData,
): Promise<WorkspaceNoteMutationResult> {
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!id) {
    return { ok: false, error: "Note id is missing." };
  }

  try {
    await query(`update public.workspace_notes set title = $2, body = $3 where id = $1`, [
      id,
      title,
      body,
    ]);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not update workspace note.",
    };
  }
  revalidatePath("/");
  return { ok: true };
}

export async function deleteWorkspaceNote(
  formData: FormData,
): Promise<WorkspaceNoteMutationResult> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return { ok: false, error: "Note id is missing." };
  }

  try {
    await query(`delete from public.workspace_notes where id = $1`, [id]);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not delete workspace note.",
    };
  }
  revalidatePath("/");
  return { ok: true };
}
