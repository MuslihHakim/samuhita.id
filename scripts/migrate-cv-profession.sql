-- Add profession column to cv_data for alignment with admin dashboard
ALTER TABLE cv_data
ADD COLUMN IF NOT EXISTS "profession" TEXT;

-- Backfill profession from existing positionApply values
UPDATE cv_data
SET "profession" = COALESCE("profession", NULLIF("positionApply", ''))
WHERE ("positionApply" IS NOT NULL AND "positionApply" <> '')
  AND ("profession" IS NULL OR "profession" = '');

-- Verify column exists
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'cv_data' AND column_name = 'profession';
