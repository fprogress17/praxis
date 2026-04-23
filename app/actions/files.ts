"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/server/db";
import {
  deleteStoredFile,
  parseScope,
  type FileMutationResult,
  updateStoredFileContent,
  uploadStorageFiles,
} from "@/lib/server/files";

export async function createFileRecord(formData: FormData): Promise<FileMutationResult> {
  const channel_id_raw = String(formData.get("channel_id") ?? "").trim();
  const video_id_raw = String(formData.get("video_id") ?? "").trim();
  const object_path = String(formData.get("object_path") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const mime_type = String(formData.get("mime_type") ?? "").trim();
  const size_bytes = Number(formData.get("size_bytes") ?? 0);

  if (!object_path) return { ok: false, error: "File path is missing." };
  if (!name) return { ok: false, error: "File name is missing." };

  try {
    await query(
      `insert into public.files (
         channel_id, video_id, bucket, object_path, name, mime_type, size_bytes
       ) values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        channel_id_raw || null,
        video_id_raw || null,
        "local-files",
        object_path,
        name,
        mime_type,
        Number.isFinite(size_bytes) ? size_bytes : 0,
      ],
    );
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not create file record." };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function uploadFiles(formData: FormData): Promise<FileMutationResult> {
  const result = await uploadStorageFiles({
    scope: parseScope(formData),
    channelId: String(formData.get("channel_id") ?? "").trim() || null,
    videoId: String(formData.get("video_id") ?? "").trim() || null,
    files: formData.getAll("files").filter((entry): entry is File => entry instanceof File),
  });
  if (!result.ok) return result;
  revalidatePath("/");
  return result;
}

export async function deleteFileRecord(formData: FormData): Promise<FileMutationResult> {
  const result = await deleteStoredFile(String(formData.get("id") ?? ""));
  if (!result.ok) return result;
  revalidatePath("/");
  return result;
}

export async function updateFileContent(formData: FormData): Promise<FileMutationResult> {
  const result = await updateStoredFileContent({
    id: String(formData.get("id") ?? ""),
    content: String(formData.get("content") ?? ""),
    mimeType: String(formData.get("mime_type") ?? "").trim(),
  });
  if (!result.ok) return result;
  revalidatePath("/");
  return result;
}
