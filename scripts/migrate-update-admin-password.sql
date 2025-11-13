-- Update admin password to the new secure value.
-- Run this after deploying code changes to ensure the seeded admin account uses the updated password.
-- The hash was generated with bcrypt (10 rounds) from plaintext adminnew123

update admin_users
set "passwordHash" = '$2b$10$/dAyUTIaICyjCGCN4syZmu.8sBx1eumuSfufOnXtreWbA1qgSJppu'
where username = 'admin';
