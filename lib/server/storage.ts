import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const DEFAULT_ROOT = path.join(process.cwd(), "local-storage", "praxis-files");

export function storageRoot() {
  return process.env.FILE_STORAGE_ROOT || DEFAULT_ROOT;
}

export function storageConfigured() {
  return Boolean(storageRoot());
}

function sanitizeSegment(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "file";
}

export function makeObjectPath(
  scope: "workspace" | "channel" | "video",
  channelId: string | null,
  videoId: string | null,
  fileName: string,
) {
  const safeName = sanitizeSegment(fileName);
  const prefix =
    scope === "video" && channelId && videoId
      ? `channels/${channelId}/videos/${videoId}`
      : scope === "channel" && channelId
        ? `channels/${channelId}`
        : "workspace";

  return `${prefix}/${randomUUID()}-${safeName}`;
}

export function absolutePathFor(objectPath: string) {
  const root = storageRoot();
  const fullPath = path.resolve(root, objectPath);
  const expectedPrefix = `${path.resolve(root)}${path.sep}`;
  if (fullPath !== path.resolve(root) && !fullPath.startsWith(expectedPrefix)) {
    throw new Error("Invalid file path.");
  }
  return fullPath;
}

export async function writeStorageObject(objectPath: string, bytes: Uint8Array) {
  const fullPath = absolutePathFor(objectPath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, bytes);
  return fullPath;
}

export async function readStorageObject(objectPath: string) {
  return fs.readFile(absolutePathFor(objectPath));
}

export async function deleteStorageObject(objectPath: string) {
  const fullPath = absolutePathFor(objectPath);
  await fs.rm(fullPath, { force: true });
}

export async function overwriteStorageObject(objectPath: string, bytes: Uint8Array) {
  const fullPath = absolutePathFor(objectPath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, bytes);
  return fullPath;
}
