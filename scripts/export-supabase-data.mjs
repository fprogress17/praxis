import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env.local");
const DEFAULT_OUTPUT = "/tmp/praxis-supabase-export.sql";
const PAGE_SIZE = 1000;

const TABLES = [
  {
    name: "channels",
    columns: ["id", "title", "category", "brief_note", "position", "created_at"],
    orderBy: "created_at",
  },
  {
    name: "videos",
    columns: [
      "id",
      "channel_id",
      "episode",
      "status",
      "title",
      "brief",
      "script",
      "tts_script",
      "next_episode_promise",
      "created_at",
    ],
    orderBy: "created_at",
  },
  {
    name: "notes",
    columns: ["id", "channel_id", "video_id", "title", "body", "created_at", "updated_at"],
    orderBy: "created_at",
  },
  {
    name: "ideas",
    columns: ["id", "channel_id", "body", "created_at"],
    orderBy: "created_at",
  },
  {
    name: "workspace_ideas",
    columns: ["id", "body", "created_at"],
    orderBy: "created_at",
  },
  {
    name: "workspace_notes",
    columns: ["id", "title", "body", "created_at", "updated_at"],
    orderBy: "created_at",
  },
  {
    name: "files",
    columns: [
      "id",
      "channel_id",
      "video_id",
      "bucket",
      "object_path",
      "name",
      "mime_type",
      "size_bytes",
      "created_at",
    ],
    orderBy: "created_at",
  },
  {
    name: "links",
    columns: ["id", "channel_id", "video_id", "title", "url", "note", "created_at"],
    orderBy: "created_at",
  },
  {
    name: "script_versions",
    columns: ["id", "video_id", "script_type", "version_number", "body", "created_at"],
    orderBy: "created_at",
  },
];

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

function sqlLiteral(value) {
  if (value == null) return "null";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "null";
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  const text = String(value).replace(/'/g, "''");
  return `'${text}'`;
}

function buildUpsert(tableName, columns, row) {
  const columnList = columns.join(", ");
  const values = columns.map((column) => sqlLiteral(row[column])).join(", ");
  const updates = columns
    .filter((column) => column !== "id")
    .map((column) => `${column} = excluded.${column}`)
    .join(", ");
  return `insert into public.${tableName} (${columnList}) values (${values}) on conflict (id) do update set ${updates};`;
}

async function loadEnv() {
  const text = await fs.readFile(ENV_PATH, "utf8");
  return parseEnv(text);
}

async function fetchAllRows(client, table) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await client
      .from(table.name)
      .select(table.columns.join(","))
      .order(table.orderBy, { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`${table.name}: ${error.message}`);
    }

    if (!data || data.length === 0) {
      break;
    }

    rows.push(...data);

    if (data.length < PAGE_SIZE) {
      break;
    }
  }
  return rows;
}

async function main() {
  const env = await loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  }

  const outputPath = process.argv[2] ?? DEFAULT_OUTPUT;
  const client = createClient(url, key, { auth: { persistSession: false } });

  const chunks = [
    "-- Generated from Supabase for local Postgres import",
    "begin;",
  ];

  for (const table of TABLES) {
    const rows = await fetchAllRows(client, table);
    chunks.push(`-- ${table.name}: ${rows.length} row(s)`);
    for (const row of rows) {
      chunks.push(buildUpsert(table.name, table.columns, row));
    }
  }

  chunks.push("commit;");
  await fs.writeFile(outputPath, `${chunks.join("\n")}\n`, "utf8");
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
