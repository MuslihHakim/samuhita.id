-- Test basic database operations
-- Check if RLS is enabled and working
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('submissions', 'admin_users', 'user_credentials');

-- Check if policies exist
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('submissions', 'admin_users', 'user_credentials');

-- Test if we can insert into submissions table
-- This simulates what your app does
BEGIN;
INSERT INTO submissions ("fullName", email, "phoneNumber", status)
VALUES ('Test User', 'test@example.com', '1234567890', 'pending')
ON CONFLICT DO NOTHING;
ROLLBACK;

-- Test if we can query admin_users table
SELECT COUNT(*) FROM admin_users;

-- Check if there are any blocking issues with user_credentials table
SELECT COUNT(*) FROM user_credentials;

-- Check recent submissions to see if data is flowing
SELECT "fullName", email, status, "createdAt"
FROM submissions
ORDER BY "createdAt" DESC
LIMIT 5;

-- Check the structure of submissions table to ensure it has all required columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'submissions' AND table_schema = 'public'
ORDER BY ordinal_position;