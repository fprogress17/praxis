"use server";

import { revalidatePath } from "next/cache";
import {
  createVideoRecord,
  deleteVideoRecord,
  parseVideoFormData,
  type VideoMutationResult,
  updateVideoRecord,
} from "@/lib/server/videos";

export type CreateVideoResult = VideoMutationResult;

export async function createVideo(formData: FormData): Promise<CreateVideoResult> {
  const result = await createVideoRecord(parseVideoFormData(formData));
  if (!result.ok) return result;
  revalidatePath("/");
  return result;
}

export async function updateVideo(formData: FormData): Promise<CreateVideoResult> {
  const result = await updateVideoRecord(parseVideoFormData(formData));
  if (!result.ok) return result;
  revalidatePath("/");
  return result;
}

export async function deleteVideo(id: string): Promise<CreateVideoResult> {
  const result = await deleteVideoRecord(id);
  if (!result.ok) return result;
  revalidatePath("/");
  return result;
}
