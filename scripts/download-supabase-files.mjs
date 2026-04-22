import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env.local");
const DEFAULT_STORAGE_ROOT = path.join(ROOT, "local-storage", "praxis-files");
const PAGE_SIZE = 500;

function parseEnv(text) {
  const values = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

async function loadEnv() {
  const text = await fs.readFile(ENV_PATH, "utf8");
  return parseEnv(text);
}

async function fetchFileRows(client) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await client
      .from("files")
      .select("id,bucket,object_path,name")
      .order("created_at", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`files: ${error.message}`);
    }

    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return rows;
}

async function writeBlob(storageRoot, objectPath, blob) {
  const filePath = path.join(storageRoot, objectPath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const buffer = Buffer.from(await blob.arrayBuffer());
  await fs.writeFile(filePath, buffer);
}

async function main() {
  const env = await loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  }

  const storageRoot = process.argv[2] ?? DEFAULT_STORAGE_ROOT;
  const client = createClient(url, key, { auth: { persistSession: false } });
  const rows = await fetchFileRows(client);

  let downloaded = 0;
  for (const row of rows) {
    const { data, error } = await client.storage.from(row.bucket).download(row.object_path);
    if (error) {
      throw new Error(`download ${row.object_path}: ${error.message}`);
    }
    await writeBlob(storageRoot, row.object_path, data);
    downloaded += 1;
  }

  console.log(`Downloaded ${downloaded} file(s) to ${storageRoot}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
