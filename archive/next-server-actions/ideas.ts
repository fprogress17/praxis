"use server";

import { revalidatePath } from "next/cache";
import {
  createIdeaRecord,
  deleteIdeaRecord,
  parseIdeaFormData,
  type IdeaMutationResult,
  updateIdeaRecord,
} from "@/lib/server/ideas";

export async function createIdea(formData: FormData): Promise<IdeaMutationResult> {
  const result = await createIdeaRecord(parseIdeaFormData(formData));
  if (!result.ok) return result;
  revalidatePath("/");
  return result;
}

export async function updateIdea(formData: FormData): Promise<IdeaMutationResult> {
  const result = await updateIdeaRecord(parseIdeaFormData(formData));
  if (!result.ok) return result;
  revalidatePath("/");
  return result;
}

export async function deleteIdea(formData: FormData): Promise<IdeaMutationResult> {
  const result = await deleteIdeaRecord(String(formData.get("idea_id") ?? ""));
  if (!result.ok) return result;
  revalidatePath("/");
  return result;
}
