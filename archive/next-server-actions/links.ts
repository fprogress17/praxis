"use server";

import { revalidatePath } from "next/cache";
import {
  createLinkRecord,
  deleteLinkRecord,
  parseLinkFormData,
  type LinkMutationResult,
  updateLinkRecord,
} from "@/lib/server/links";

export async function createLink(formData: FormData): Promise<LinkMutationResult> {
  const result = await createLinkRecord(parseLinkFormData(formData));
  if (!result.ok) return result;
  revalidatePath("/");
  return result;
}

export async function updateLink(formData: FormData): Promise<LinkMutationResult> {
  const result = await updateLinkRecord(parseLinkFormData(formData));
  if (!result.ok) return result;
  revalidatePath("/");
  return result;
}

export async function deleteLink(formData: FormData): Promise<LinkMutationResult> {
  const result = await deleteLinkRecord(String(formData.get("id") ?? ""));
  if (!result.ok) return result;
  revalidatePath("/");
  return result;
}
