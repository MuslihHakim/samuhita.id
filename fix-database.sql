-- First, drop the problematic user_credentials table if it exists
DROP TABLE IF EXISTS user_credentials CASCADE;

-- Recreate user_credentials table WITHOUT foreign key constraint temporarily
CREATE TABLE IF NOT EXISTS user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "submissionId" UUID NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "viewedByAdmin" BOOLEAN DEFAULT FALSE,
  "viewedAt" TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security for user_credentials table
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read credentials" ON user_credentials;
DROP POLICY IF EXISTS "Allow public insert credentials" ON user_credentials;

-- Create policies for user_credentials
CREATE POLICY "Allow public read credentials" ON user_credentials FOR SELECT USING (true);
CREATE POLICY "Allow public insert credentials" ON user_credentials FOR INSERT WITH CHECK (true);

-- Create indexes for user_credentials
CREATE INDEX IF NOT EXISTS idx_user_credentials_submission_id ON user_credentials("submissionId");
CREATE INDEX IF NOT EXISTS idx_user_credentials_created_at ON user_credentials("createdAt");

-- Check if submissions table exists and has the right structure
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'submissions'
) as submissions_table_exists;

-- Check submissions table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'submissions' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check admin_users table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'admin_users'
) as admin_users_table_exists;

-- Check admin_users table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'admin_users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test basic queries
SELECT 'submissions count:' as info, COUNT(*) as count FROM submissions
UNION ALL
SELECT 'admin_users count:' as info, COUNT(*) as count FROM admin_users
UNION ALL
SELECT 'user_credentials count:' as info, COUNT(*) as count FROM user_credentials;