-- Create user_credentials table to store generated login credentials
CREATE TABLE IF NOT EXISTS user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "submissionId" UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
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

-- Create user_auth_accounts table for username lookups without paging auth users
CREATE TABLE IF NOT EXISTS user_auth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "authUserId" UUID NOT NULL UNIQUE,
  username TEXT NOT NULL,
  "usernameLower" TEXT GENERATED ALWAYS AS (lower(username)) STORED,
  email TEXT NOT NULL,
  "submissionId" UUID REFERENCES submissions(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for user_auth_accounts table
ALTER TABLE user_auth_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role read user auth accounts" ON user_auth_accounts;
DROP POLICY IF EXISTS "Service role insert user auth accounts" ON user_auth_accounts;
DROP POLICY IF EXISTS "Service role update user auth accounts" ON user_auth_accounts;
DROP POLICY IF EXISTS "Service role delete user auth accounts" ON user_auth_accounts;

-- Create policies for user_auth_accounts (service role only)
CREATE POLICY "Service role read user auth accounts" ON user_auth_accounts
  FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Service role insert user auth accounts" ON user_auth_accounts
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role update user auth accounts" ON user_auth_accounts
  FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role delete user auth accounts" ON user_auth_accounts
  FOR DELETE USING (auth.role() = 'service_role');

-- Create indexes for user_auth_accounts
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_auth_accounts_username_lower ON user_auth_accounts("usernameLower");
CREATE INDEX IF NOT EXISTS idx_user_auth_accounts_submission_id ON user_auth_accounts("submissionId");
CREATE INDEX IF NOT EXISTS idx_user_auth_accounts_created_at ON user_auth_accounts("createdAt");

-- Query to verify the table was created successfully
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_credentials'
ORDER BY ordinal_position;

SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_auth_accounts'
ORDER BY ordinal_position;

-- Add Supabase auth linkage to submissions for efficient user lookups
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS "userId" UUID;

CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions("userId");

-- Add profession tracking for submissions
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS "profession" TEXT;

-- Add placement tracking for submissions
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS "placement" TEXT;

-- Add coordinator tracking for submissions
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS "coordinator" TEXT;

-- Session storage for admin dashboard authentication
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token_hash ON admin_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- Add signature columns to cv_data
ALTER TABLE cv_data
ADD COLUMN IF NOT EXISTS "signatureOriginalUrl" TEXT,
ADD COLUMN IF NOT EXISTS "signatureTransparentUrl" TEXT,
ADD COLUMN IF NOT EXISTS "signatureStatus" TEXT,
ADD COLUMN IF NOT EXISTS "signatureJobId" UUID,
ADD COLUMN IF NOT EXISTS "signatureError" TEXT,
ADD COLUMN IF NOT EXISTS "signatureUpdatedAt" TIMESTAMP WITH TIME ZONE;

-- Signature processing jobs table
CREATE TABLE IF NOT EXISTS signature_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  status TEXT NOT NULL,
  "originalPath" TEXT NOT NULL,
  "processedPath" TEXT,
  "originalFileName" TEXT,
  "mimeType" TEXT,
  error TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE signature_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manage signature jobs" ON signature_jobs;

CREATE POLICY "Service role manage signature jobs" ON signature_jobs
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_signature_jobs_user_id ON signature_jobs("userId");

-- Add profession to cv_data to align with admin submissions
ALTER TABLE cv_data
ADD COLUMN IF NOT EXISTS "profession" TEXT;

-- Backfill profession from legacy positionApply if missing
UPDATE cv_data
SET "profession" = COALESCE("profession", NULLIF("positionApply", ''))
WHERE ("positionApply" IS NOT NULL AND "positionApply" <> '')
  AND ("profession" IS NULL OR "profession" = '');

-- Add gender field to cv_data
ALTER TABLE cv_data
ADD COLUMN IF NOT EXISTS "gender" TEXT;

-- Ensure default admin account uses latest secure password (bcrypt hash of adminnew123)
UPDATE admin_users
SET "passwordHash" = '$2b$10$/dAyUTIaICyjCGCN4syZmu.8sBx1eumuSfufOnXtreWbA1qgSJppu'
WHERE username = 'admin';

-- Add addedBy and sentTo tracking for submissions (align with Admin Dashboard)
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS "addedBy" TEXT,
ADD COLUMN IF NOT EXISTS "sentTo" TEXT;

-- Verify the new columns exist
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'submissions' AND column_name IN ('addedBy', 'sentTo')
ORDER BY column_name;
