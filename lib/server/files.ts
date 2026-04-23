import { query } from "@/lib/server/db";
import {
  deleteStorageObject,
  makeObjectPath,
  overwriteStorageObject,
  readStorageObject,
  writeStorageObject,
} from "@/lib/server/storage";

export type FileMutationResult = { ok: true } | { ok: false; error: string };

export type FileScope = "workspace" | "channel" | "video";

export type FileRecord = {
  id: string;
  name: string;
  mime_type: string;
  object_path: string;
};

export function parseScope(formData: FormData): FileScope {
  const scopeValue = String(formData.get("scope") ?? "workspace").trim();
  return scopeValue === "video" || scopeValue === "channel" ? scopeValue : "workspace";
}

export async function uploadStorageFiles(input: {
  scope: FileScope;
  channelId: string | null;
  videoId: string | null;
  files: File[];
}): Promise<FileMutationResult> {
  if (input.files.length === 0) {
    return { ok: false, error: "Pick at least one file." };
  }

  try {
    for (const file of input.files) {
      const objectPath = makeObjectPath(input.scope, input.channelId, input.videoId, file.name);
      const bytes = new Uint8Array(await file.arrayBuffer());
      await writeStorageObject(objectPath, bytes);
      await query(
        `insert into public.files (
           channel_id, video_id, bucket, object_path, name, mime_type, size_bytes
         ) values ($1, $2, $3, $4, $5, $6, $7)`,
        [
          input.channelId,
          input.videoId,
          "local-files",
          objectPath,
          file.name,
          file.type || "",
          file.size,
        ],
      );
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not upload files." };
  }

  return { ok: true };
}

export async function getStoredFile(id: string): Promise<FileRecord | null> {
  const result = await query<FileRecord>(
    `select id, name, mime_type, object_path from public.files where id = $1 limit 1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function readStoredFile(id: string) {
  const file = await getStoredFile(id);
  if (!file) {
    return { ok: false as const, error: "File not found." };
  }

  try {
    const bytes = await readStorageObject(file.object_path);
    return { ok: true as const, file, bytes };
  } catch {
    return { ok: false as const, error: "File content is missing on disk." };
  }
}

export async function deleteStoredFile(id: string): Promise<FileMutationResult> {
  const trimmed = id.trim();
  if (!trimmed) return { ok: false, error: "File id is missing." };

  try {
    const file = await getStoredFile(trimmed);
    if (!file) {
      return { ok: false, error: "File not found." };
    }
    await deleteStorageObject(file.object_path);
    await query(`delete from public.files where id = $1`, [trimmed]);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete file." };
  }

  return { ok: true };
}

export async function updateStoredFileContent(input: {
  id: string;
  content: string;
  mimeType: string;
}): Promise<FileMutationResult> {
  const trimmed = input.id.trim();
  if (!trimmed) {
    return { ok: false, error: "File id is missing." };
  }

  try {
    const file = await getStoredFile(trimmed);
    if (!file) {
      return { ok: false, error: "File not found." };
    }

    const body = new TextEncoder().encode(input.content);
    await overwriteStorageObject(file.object_path, body);
    if (input.mimeType) {
      await query(`update public.files set mime_type = $2 where id = $1`, [trimmed, input.mimeType]);
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save file." };
  }

  return { ok: true };
}
