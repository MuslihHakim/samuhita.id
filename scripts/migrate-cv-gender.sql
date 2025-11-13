-- Add gender column to cv_data for personal details
ALTER TABLE cv_data
ADD COLUMN IF NOT EXISTS "gender" TEXT;

-- Verify column exists
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'cv_data' AND column_name = 'gender';

