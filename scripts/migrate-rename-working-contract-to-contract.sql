-- Optional: rename old status values if you have existing rows
-- Run this before re-adding the new check constraint (or after dropping it)

UPDATE public.submissions
SET status = 'Contract'
WHERE status = 'Working Contract';

-- Verify
SELECT status, COUNT(*)
FROM public.submissions
GROUP BY status
ORDER BY status;

