"use server";

import type { ScriptVersionRow, ScriptType } from "@/lib/types/script-version";
import { query } from "@/lib/server/db";

export type SaveScriptVersionResult =
  | { ok: true; version: ScriptVersionRow }
  | { ok: false; error: string };

function mapVersion(row: Record<string, unknown>): ScriptVersionRow {
  return {
    id: String(row.id),
    video_id: String(row.video_id),
    script_type: row.script_type as ScriptType,
    version_number: Number(row.version_number),
    body: String(row.body),
    created_at: String(row.created_at),
  };
}

export async function listScriptVersions(videoId: string): Promise<ScriptVersionRow[]> {
  const result = await query(
    `select id, video_id, script_type, version_number, body, created_at
     from public.script_versions
     where video_id = $1
     order by version_number asc`,
    [videoId],
  );

  return result.rows.map((row) => mapVersion(row));
}

export async function saveScriptVersion(
  videoId: string,
  scriptType: ScriptType,
  body: string,
): Promise<SaveScriptVersionResult> {
  try {
    const { rows } = await query(
      `with next_version as (
         select coalesce(max(version_number), 0) + 1 as version_number
         from public.script_versions
         where video_id = $1 and script_type = $2
       )
       insert into public.script_versions (video_id, script_type, version_number, body)
       select $1, $2, next_version.version_number, $3
       from next_version
       returning id, video_id, script_type, version_number, body, created_at`,
      [videoId, scriptType, body],
    );

    return {
      ok: true,
      version: mapVersion(rows[0]),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not save script version.",
    };
  }
}
