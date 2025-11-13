-- SAFE Migration script - Run step by step in Supabase SQL Editor
-- Step 1: Check current constraint name
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.submissions'::regclass AND contype = 'c';

-- Step 2: Drop ALL check constraints on submissions table
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_status_check;
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_status_check_1;
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS check_submissions_status;

-- Step 3: Update existing records
UPDATE submissions
SET status = 'registered'
WHERE status = 'completed';

-- Step 4: Add new constraint
ALTER TABLE submissions
ADD CONSTRAINT submissions_status_check
CHECK (status IN ('pending', 'verified', 'registered'));

-- Step 5: Verify changes
SELECT status, COUNT(*) as count
FROM submissions
GROUP BY status
ORDER BY status;