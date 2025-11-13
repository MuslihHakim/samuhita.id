-- Backfill user_auth_accounts from existing submissions and credential records.
-- Run this after deploying the user_auth_accounts table to keep login lookups fast.

WITH latest_credentials AS (
  SELECT DISTINCT ON (uc."submissionId")
    uc."submissionId",
    uc.username,
    uc."createdAt"
  FROM user_credentials uc
  ORDER BY uc."submissionId", uc."createdAt" DESC
)
INSERT INTO user_auth_accounts ("authUserId", username, email, "submissionId", "updatedAt")
SELECT
  s."userId",
  lc.username,
  s.email,
  s.id,
  NOW()
FROM submissions s
JOIN latest_credentials lc ON lc."submissionId" = s.id
WHERE s."userId" IS NOT NULL
ON CONFLICT ("authUserId") DO UPDATE
SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  "submissionId" = EXCLUDED."submissionId",
  "updatedAt" = NOW();

-- Inspect rows missing a mapping (e.g. no credential record found)
SELECT s.id AS "submissionIdWithoutAccount", s.email, s."userId"
FROM submissions s
LEFT JOIN user_auth_accounts uaa ON uaa."authUserId" = s."userId"
WHERE s."userId" IS NOT NULL AND uaa."authUserId" IS NULL;
