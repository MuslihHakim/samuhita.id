-- Migration script to update status from 'completed' to 'registered'
-- Run this in Supabase SQL Editor

-- First, drop the existing CHECK constraint (may have different name)
ALTER TABLE submissions
DROP CONSTRAINT IF EXISTS submissions_status_check;

-- Also try to drop constraint that might have a different name pattern
ALTER TABLE submissions
DROP CONSTRAINT IF EXISTS submissions_status_check_1;

-- Now update existing records safely
UPDATE submissions
SET status = 'registered'
WHERE status = 'completed';

-- Add the new CHECK constraint
ALTER TABLE submissions
ADD CONSTRAINT submissions_status_check
CHECK (status IN ('pending', 'verified', 'registered'));

-- Verify the changes
SELECT status, COUNT(*) as count
FROM submissions
GROUP BY status
ORDER BY status;