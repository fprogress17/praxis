-- Adds a position column to channels for drag-and-drop reordering.
-- Backfills existing rows with their current created_at DESC order.

ALTER TABLE channels ADD COLUMN IF NOT EXISTS position INT;

UPDATE channels
SET position = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn
  FROM channels
  WHERE position IS NULL
) sub
WHERE channels.id = sub.id;
