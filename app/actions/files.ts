"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/server/db";
import {
  deleteStorageObject,
  makeObjectPath,
  overwriteStorageObject,
  writeStorageObject,
} from "@/lib/server/storage";

export type FileMutationResult = { ok: true } | { ok: false; error: string };

type FileRecord = {
  id: string;
  object_path: string;
};

function parseScope(formData: FormData) {
  const scopeValue = String(formData.get("scope") ?? "workspace").trim();
  return scopeValue === "video" || scopeValue === "channel" ? scopeValue : "workspace";
}

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
  const scope = parseScope(formData);
  const channelId = String(formData.get("channel_id") ?? "").trim() || null;
  const videoId = String(formData.get("video_id") ?? "").trim() || null;
  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    return { ok: false, error: "Pick at least one file." };
  }

  try {
    for (const file of files) {
      const objectPath = makeObjectPath(scope, channelId, videoId, file.name);
      const bytes = new Uint8Array(await file.arrayBuffer());
      await writeStorageObject(objectPath, bytes);
      await query(
        `insert into public.files (
           channel_id, video_id, bucket, object_path, name, mime_type, size_bytes
         ) values ($1, $2, $3, $4, $5, $6, $7)`,
        [channelId, videoId, "local-files", objectPath, file.name, file.type || "", file.size],
      );
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not upload files." };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function deleteFileRecord(formData: FormData): Promise<FileMutationResult> {
  const id = String(formData.get("id") ?? "").trim();
  const object_path = String(formData.get("object_path") ?? "").trim();

  if (!id) return { ok: false, error: "File id is missing." };
  if (!object_path) return { ok: false, error: "File path is missing." };

  try {
    await deleteStorageObject(object_path);
    await query(`delete from public.files where id = $1`, [id]);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete file." };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function updateFileContent(formData: FormData): Promise<FileMutationResult> {
  const id = String(formData.get("id") ?? "").trim();
  const content = String(formData.get("content") ?? "");
  const mimeType = String(formData.get("mime_type") ?? "").trim();

  if (!id) {
    return { ok: false, error: "File id is missing." };
  }

  try {
    const result = await query<FileRecord>(
      `select id, object_path from public.files where id = $1 limit 1`,
      [id],
    );
    const file = result.rows[0];
    if (!file) {
      return { ok: false, error: "File not found." };
    }

    const body = new TextEncoder().encode(content);
    await overwriteStorageObject(file.object_path, body);
    if (mimeType) {
      await query(`update public.files set mime_type = $2 where id = $1`, [id, mimeType]);
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save file." };
  }

  revalidatePath("/");
  return { ok: true };
}
