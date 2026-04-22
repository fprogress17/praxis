-- Script version snapshots per video, scoped to script type (script or tts_script).
-- Version numbers are assigned per (video_id, script_type) independently.

CREATE TABLE IF NOT EXISTS script_versions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id        UUID        NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  script_type     TEXT        NOT NULL CHECK (script_type IN ('script', 'tts_script')),
  version_number  INT         NOT NULL,
  body            TEXT        NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS script_versions_video_id_idx
  ON script_versions(video_id);

CREATE INDEX IF NOT EXISTS script_versions_video_type_version_idx
  ON script_versions(video_id, script_type, version_number);

ALTER TABLE script_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon and auth can select script_versions"
  ON script_versions FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon and auth can insert script_versions"
  ON script_versions FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "anon and auth can delete script_versions"
  ON script_versions FOR DELETE TO anon, authenticated USING (true);
