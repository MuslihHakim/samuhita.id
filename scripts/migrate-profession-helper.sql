-- Rename legacy "Helper" profession entries to "Cook Helper"
-- Run this in Supabase SQL Editor

-- Update submissions.profession
UPDATE submissions
SET profession = 'Cook Helper'
WHERE profession IS NOT NULL
  AND lower(profession) = 'helper';

-- Update cv_data.profession
UPDATE cv_data
SET "profession" = 'Cook Helper'
WHERE "profession" IS NOT NULL
  AND lower("profession") = 'helper';

-- Update legacy cv_data.positionApply values
UPDATE cv_data
SET "positionApply" = 'Cook Helper'
WHERE "positionApply" IS NOT NULL
  AND lower("positionApply") = 'helper';

-- Verify updates
SELECT profession, COUNT(*) AS count
FROM submissions
GROUP BY profession
ORDER BY profession;

SELECT "profession", COUNT(*) AS count
FROM cv_data
GROUP BY "profession"
ORDER BY "profession";
