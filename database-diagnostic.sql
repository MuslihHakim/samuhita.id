-- Check all tables in the database
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if submissions table exists and its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'submissions' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if admin_users table exists and its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'admin_users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if user_credentials table exists and its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_credentials' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check RLS policies status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('submissions', 'admin_users', 'user_credentials');

-- Check for any foreign key constraints
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('user_credentials', 'submissions', 'admin_users');

-- Test basic query on submissions table
SELECT COUNT(*) as submission_count FROM submissions;

-- Test basic query on admin_users table
SELECT COUNT(*) as admin_count FROM admin_users;