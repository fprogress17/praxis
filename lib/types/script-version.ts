export type ScriptType = "script" | "tts_script";

export type ScriptVersionRow = {
  id: string;
  video_id: string;
  script_type: ScriptType;
  version_number: number;
  body: string;
  created_at: string;
};
