"use server";

import { revalidatePath } from "next/cache";
import {
  createWorkspaceIdeaRecord,
  deleteWorkspaceIdeaRecord,
  parseWorkspaceIdeaFormData,
  type WorkspaceIdeaMutationResult,
  updateWorkspaceIdeaRecord,
} from "@/lib/server/ideas";

export async function createWorkspaceIdea(formData: FormData): Promise<WorkspaceIdeaMutationResult> {
  const result = await createWorkspaceIdeaRecord(parseWorkspaceIdeaFormData(formData));
  if (!result.ok) return result;
  revalidatePath("/");
  return result;
}

export async function updateWorkspaceIdea(formData: FormData): Promise<WorkspaceIdeaMutationResult> {
  const result = await updateWorkspaceIdeaRecord(parseWorkspaceIdeaFormData(formData));
  if (!result.ok) return result;
  revalidatePath("/");
  return result;
}

export async function deleteWorkspaceIdea(formData: FormData): Promise<WorkspaceIdeaMutationResult> {
  const result = await deleteWorkspaceIdeaRecord(String(formData.get("idea_id") ?? ""));
  if (!result.ok) return result;
  revalidatePath("/");
  return result;
}
