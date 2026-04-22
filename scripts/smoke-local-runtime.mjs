import { Pool } from "pg";
import fs from "node:fs/promises";
import path from "node:path";

const ENV_PATH = path.join(process.cwd(), ".env.local");
const REQUIRED_TABLES = [
  "channels",
  "videos",
  "notes",
  "ideas",
  "workspace_ideas",
  "workspace_notes",
  "files",
  "links",
  "script_versions",
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

async function loadEnv() {
  try {
    const text = await fs.readFile(ENV_PATH, "utf8");
    const parsed = parseEnv(text);
    for (const [key, value] of Object.entries(parsed)) {
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // Ignore missing .env.local and rely on shell env.
  }
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function storageRoot() {
  return process.env.FILE_STORAGE_ROOT || path.join(process.cwd(), "local-storage", "praxis-files");
}

async function main() {
  await loadEnv();
  const pool = new Pool({ connectionString: requiredEnv("DATABASE_URL") });

  try {
    const dbCheck = await pool.query(
      `select current_database() as database_name, current_user as user_name`,
    );
    const dbInfo = dbCheck.rows[0];

    const tableCheck = await pool.query(
      `select table_name
       from information_schema.tables
       where table_schema = 'public'
       order by table_name asc`,
    );

    const presentTables = new Set(tableCheck.rows.map((row) => String(row.table_name)));
    const missingTables = REQUIRED_TABLES.filter((table) => !presentTables.has(table));
    if (missingTables.length > 0) {
      throw new Error(`Missing tables: ${missingTables.join(", ")}`);
    }

    const counts = await pool.query(
      `select 'channels' as table_name, count(*)::int as row_count from public.channels
       union all select 'videos', count(*)::int from public.videos
       union all select 'notes', count(*)::int from public.notes
       union all select 'ideas', count(*)::int from public.ideas
       union all select 'workspace_ideas', count(*)::int from public.workspace_ideas
       union all select 'workspace_notes', count(*)::int from public.workspace_notes
       union all select 'files', count(*)::int from public.files
       union all select 'links', count(*)::int from public.links
       union all select 'script_versions', count(*)::int from public.script_versions
       order by table_name asc`,
    );

    const root = storageRoot();
    await fs.mkdir(root, { recursive: true });
    const sampleFiles = await fs.readdir(root);

    console.log("Local runtime smoke check passed.");
    console.log(`Database: ${dbInfo.database_name}`);
    console.log(`User: ${dbInfo.user_name}`);
    console.log(`Storage root: ${root}`);
    console.log(`Storage entries: ${sampleFiles.length}`);
    for (const row of counts.rows) {
      console.log(`${row.table_name}: ${row.row_count}`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
