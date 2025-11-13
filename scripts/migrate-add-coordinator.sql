-- Add coordinator column to submissions to support coordinator assignments linked to "Add By"
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS "coordinator" TEXT;

