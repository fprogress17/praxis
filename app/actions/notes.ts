"use server";

import { revalidatePath } from "next/cache";
import {
  createNoteRecord,
  deleteNoteRecord,
  parseNoteFormData,
  type NoteMutationResult,
  updateNoteRecord,
} from "@/lib/server/notes";

export async function createNote(formData: FormData): Promise<NoteMutationResult> {
  const result = await createNoteRecord(parseNoteFormData(formData));
  if (!result.ok) return result;
  revalidatePath("/");
  return result;
}

export async function updateNote(formData: FormData): Promise<NoteMutationResult> {
  const result = await updateNoteRecord(parseNoteFormData(formData));
  if (!result.ok) return result;
  revalidatePath("/");
  return result;
}

export async function deleteNote(formData: FormData): Promise<NoteMutationResult> {
  const result = await deleteNoteRecord(String(formData.get("id") ?? ""));
  if (!result.ok) return result;
  revalidatePath("/");
  return result;
}
