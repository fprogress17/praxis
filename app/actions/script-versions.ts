"use server";

import type { ScriptVersionRow, ScriptType } from "@/lib/types/script-version";
import {
  listVideoScriptVersions,
  saveVideoScriptVersion,
  type SaveScriptVersionResult,
} from "@/lib/server/script-versions";

export async function listScriptVersions(videoId: string): Promise<ScriptVersionRow[]> {
  return listVideoScriptVersions(videoId);
}

export async function saveScriptVersion(
  videoId: string,
  scriptType: ScriptType,
  body: string,
): Promise<SaveScriptVersionResult> {
  return saveVideoScriptVersion(videoId, scriptType, body);
}
