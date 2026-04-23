"use server";

import { revalidatePath } from "next/cache";
import {
  createWorkspaceNoteRecord,
  deleteWorkspaceNoteRecord,
  parseWorkspaceNoteFormData,
  type WorkspaceNoteMutationResult,
  updateWorkspaceNoteRecord,
} from "@/lib/server/notes";

export async function createWorkspaceNote(
  formData: FormData,
): Promise<WorkspaceNoteMutationResult> {
  const result = await createWorkspaceNoteRecord(parseWorkspaceNoteFormData(formData));
  if (!result.ok) return result;
  revalidatePath("/");
  return result;
}

export async function updateWorkspaceNote(
  formData: FormData,
): Promise<WorkspaceNoteMutationResult> {
  const result = await updateWorkspaceNoteRecord(parseWorkspaceNoteFormData(formData));
  if (!result.ok) return result;
  revalidatePath("/");
  return result;
}

export async function deleteWorkspaceNote(
  formData: FormData,
): Promise<WorkspaceNoteMutationResult> {
  const result = await deleteWorkspaceNoteRecord(String(formData.get("id") ?? ""));
  if (!result.ok) return result;
  revalidatePath("/");
  return result;
}
