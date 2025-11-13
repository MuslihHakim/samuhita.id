-- SIMPLE Migration script for Supabase SQL Editor

-- Step 1: Drop any existing check constraints (safe approach)
DO $$
BEGIN
    -- Drop the constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'submissions'
        AND constraint_name = 'submissions_status_check'
    ) THEN
        ALTER TABLE submissions DROP CONSTRAINT submissions_status_check;
    END IF;

    -- Try other possible constraint names
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'submissions'
        AND constraint_name = 'submissions_status_check_1'
    ) THEN
        ALTER TABLE submissions DROP CONSTRAINT submissions_status_check_1;
    END IF;
END $$;

-- Step 2: Update the data safely
UPDATE submissions
SET status = 'registered'
WHERE status = 'completed';

-- Step 3: Add the new constraint
ALTER TABLE submissions
ADD CONSTRAINT submissions_status_check
CHECK (status IN ('pending', 'verified', 'registered'));

-- Step 4: Verify the changes
SELECT status, COUNT(*) as count
FROM submissions
GROUP BY status
ORDER BY status;