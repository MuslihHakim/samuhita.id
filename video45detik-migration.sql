-- Add Video 45 Detik column to cv_data table
-- This migration adds support for storing video URLs in the CV data

ALTER TABLE cv_data
ADD COLUMN "video45DetikUrl" TEXT;

-- Add comment to describe the new column
COMMENT ON COLUMN cv_data."video45DetikUrl" IS 'URL for the 45-second introduction video uploaded by user';

-- Query to verify the column was added successfully
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'cv_data' AND column_name = 'video45DetikUrl';