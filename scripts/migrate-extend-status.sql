-- Extend allowed values for submissions.status to include process workflow statuses
-- Run this in Supabase SQL Editor

-- 1) Inspect current constraints on submissions
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.submissions'::regclass AND contype = 'c';

-- 2) Drop known check constraints if they exist
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_status_check;
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_status_check_1;
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS check_submissions_status;

-- 3) Recreate constraint with extended statuses
ALTER TABLE submissions
ADD CONSTRAINT submissions_status_check
CHECK (status IN ('pending','verified','registered','PreScreening','MCU','Interview','Contract','Visa','Depart'));

-- 4) Verify
SELECT status, COUNT(*) as count
FROM submissions
GROUP BY status
ORDER BY status;
