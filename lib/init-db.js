// This file contains the SQL script to initialize the database
// Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/erdtyrhjktnewrvyuwqv/sql

export const initDatabaseSQL = `
-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "fullName" TEXT NOT NULL,
  email TEXT NOT NULL,
  "phoneNumber" TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'registered', 'PreScreening', 'MCU', 'Interview', 'Contract', 'Visa', 'Depart')),
  "userId" UUID,
  "addedBy" TEXT,
  "sentTo" TEXT,
  "coordinator" TEXT,
  "profession" TEXT,
  "placement" TEXT
);

-- Create cv_data table with all CV fields
CREATE TABLE IF NOT EXISTS cv_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Personal Details
  "positionApply" TEXT,
  name TEXT,
  "fatherName" TEXT,
  "motherName" TEXT,
  height TEXT,
  weight TEXT,
  "maritalStatus" TEXT,
  "placeOfBirth" TEXT,
  "dateOfBirth" DATE,
  address TEXT,
  religion TEXT,
  citizenship TEXT,
  "idnPassportNo" TEXT,
  "issueDate" DATE,
  "issuedBy" TEXT,
  "expDate" DATE,
  "mobileNo" TEXT,
  email TEXT,
  
  -- Emergency Contact
  "emergencyContactName" TEXT,
  "emergencyContactNumber" TEXT,
  "emergencyContactRelation" TEXT,
  "emergencyContactAddress" TEXT,
  
  -- Education Details (JSON array)
  education JSONB DEFAULT '[]'::jsonb,
  
  -- Work Experience (JSON array)
  "workExperience" JSONB DEFAULT '[]'::jsonb,
  
  -- Languages & Computer Skills (JSON array)
  languages JSONB DEFAULT '[]'::jsonb,
  "computerSkills" TEXT,
  
  -- Skill Information (JSON object)
  skills JSONB DEFAULT '{}'::jsonb,
  
  -- Photo URLs (stored in Supabase Storage)
  "photoUrl" TEXT,
  "fullBodyPhotoUrl" TEXT,
  "passportPhotoUrl" TEXT,
  "paklaringPhotoUrl" TEXT,
  "ktpPhotoUrl" TEXT,
  "kartuKeluargaPhotoUrl" TEXT,
  "skckPhotoUrl" TEXT,
  "aktaKelahiranPhotoUrl" TEXT,

  -- Signature Assets
  "signatureOriginalUrl" TEXT,
  "signatureTransparentUrl" TEXT,
  "signatureStatus" TEXT,
  "signatureJobId" UUID,
  "signatureError" TEXT,
  "signatureUpdatedAt" TIMESTAMP WITH TIME ZONE
);

-- Create admin_users table for separate admin authentication
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL
);

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

-- Create process_data table for user processing information
CREATE TABLE IF NOT EXISTS process_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- MCU Data
  "mcu_tanggal" DATE,
  "mcu_status" TEXT CHECK (mcu_status IN ('Fit', 'Unfit', 'Fit With Note')),
  "mcu_note" TEXT,
  "mcu_document_url" TEXT,

  -- Interview Data
  "interview_tanggal" DATE,
  "interview_score_bahasa" TEXT CHECK (interview_score_bahasa IN ('Basic', 'Good', 'Expert')),
  "interview_score_keahlian" TEXT CHECK (interview_score_keahlian IN ('Basic', 'Good', 'Expert')),

  -- Visa Data
  "visa_tanggal_terbit" DATE,
  "visa_lokasi_penerbitan" TEXT,
  "visa_no_referensi" TEXT,
  "visa_document_url" TEXT,

  -- Keberangkatan Data
  "keberangkatan_tanggal" DATE,
  "keberangkatan_bandara_asal" TEXT,
  "keberangkatan_bandara_tujuan" TEXT,
  "keberangkatan_no_tiket" TEXT,

  -- Working Contract
  contract_approval_date DATE,
  contract_start_date DATE,
  contract_end_date DATE,
  contract_document_url TEXT
);

-- Signature processing jobs
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

-- Enable Row Level Security
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_auth_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read" ON submissions;
DROP POLICY IF EXISTS "Allow public insert" ON submissions;
DROP POLICY IF EXISTS "Allow public update" ON submissions;
DROP POLICY IF EXISTS "Allow public delete" ON submissions;

DROP POLICY IF EXISTS "Users can read own CV" ON cv_data;
DROP POLICY IF EXISTS "Users can insert own CV" ON cv_data;
DROP POLICY IF EXISTS "Users can update own CV" ON cv_data;

DROP POLICY IF EXISTS "Allow public read admin" ON admin_users;
DROP POLICY IF EXISTS "Allow public insert admin" ON admin_users;

DROP POLICY IF EXISTS "Allow public read credentials" ON user_credentials;
DROP POLICY IF EXISTS "Allow public insert credentials" ON user_credentials;
DROP POLICY IF EXISTS "Service role read user auth accounts" ON user_auth_accounts;
DROP POLICY IF EXISTS "Service role insert user auth accounts" ON user_auth_accounts;
DROP POLICY IF EXISTS "Service role update user auth accounts" ON user_auth_accounts;
DROP POLICY IF EXISTS "Service role delete user auth accounts" ON user_auth_accounts;
DROP POLICY IF EXISTS "Allow public read process_data" ON process_data;
DROP POLICY IF EXISTS "Allow public insert process_data" ON process_data;
DROP POLICY IF EXISTS "Allow public update process_data" ON process_data;
DROP POLICY IF EXISTS "Service role manage signature jobs" ON signature_jobs;

-- Create policies for submissions (public access for admin)
CREATE POLICY "Allow public read" ON submissions FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON submissions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON submissions FOR DELETE USING (true);

-- Create policies for cv_data (public for now, will be restricted later)
CREATE POLICY "Users can read own CV" ON cv_data FOR SELECT USING (true);
CREATE POLICY "Users can insert own CV" ON cv_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own CV" ON cv_data FOR UPDATE USING (true);

-- Create policies for admin_users
CREATE POLICY "Allow public read admin" ON admin_users FOR SELECT USING (true);
CREATE POLICY "Allow public insert admin" ON admin_users FOR INSERT WITH CHECK (true);

-- Create policies for user_credentials
CREATE POLICY "Allow public read credentials" ON user_credentials FOR SELECT USING (true);
CREATE POLICY "Allow public insert credentials" ON user_credentials FOR INSERT WITH CHECK (true);

-- Create policies for user_auth_accounts (service role only)
CREATE POLICY "Service role read user auth accounts" ON user_auth_accounts
  FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Service role insert user auth accounts" ON user_auth_accounts
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role update user auth accounts" ON user_auth_accounts
  FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role delete user auth accounts" ON user_auth_accounts
  FOR DELETE USING (auth.role() = 'service_role');

-- Create policies for process_data
CREATE POLICY "Allow public read process_data" ON process_data FOR SELECT USING (true);
CREATE POLICY "Allow public insert process_data" ON process_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update process_data" ON process_data FOR UPDATE USING (true);

CREATE POLICY "Service role manage signature jobs" ON signature_jobs
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Add new columns to existing submissions table
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS "userId" UUID,
ADD COLUMN IF NOT EXISTS "addedBy" TEXT,
ADD COLUMN IF NOT EXISTS "sentTo" TEXT,
ADD COLUMN IF NOT EXISTS "coordinator" TEXT,
ADD COLUMN IF NOT EXISTS "profession" TEXT,
ADD COLUMN IF NOT EXISTS "placement" TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_email ON submissions(email);
CREATE INDEX IF NOT EXISTS idx_submissions_phone ON submissions("phoneNumber");
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions("userId");
CREATE INDEX IF NOT EXISTS idx_cv_data_user_id ON cv_data("userId");
CREATE INDEX IF NOT EXISTS idx_user_credentials_submission_id ON user_credentials("submissionId");
CREATE INDEX IF NOT EXISTS idx_user_credentials_created_at ON user_credentials("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_auth_accounts_username_lower ON user_auth_accounts("usernameLower");
CREATE INDEX IF NOT EXISTS idx_user_auth_accounts_submission_id ON user_auth_accounts("submissionId");
CREATE INDEX IF NOT EXISTS idx_user_auth_accounts_created_at ON user_auth_accounts("createdAt");
CREATE INDEX IF NOT EXISTS idx_process_data_user_id ON process_data("userId");
CREATE INDEX IF NOT EXISTS idx_process_data_created_at ON process_data("createdAt");
CREATE INDEX IF NOT EXISTS idx_signature_jobs_user_id ON signature_jobs("userId");

-- Create admin_sessions table for secure admin authentication
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

-- Create unique indexes to prevent duplicates and improve validation performance
-- Note: If there are existing duplicates, these will need to be cleaned up first
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_email_unique ON submissions(email);
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_phone_unique ON submissions("phoneNumber");

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('cv-photos', 'cv-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Allow public read cv photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert cv photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert cv photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their photos" ON storage.objects;

-- Storage policies - Updated to be more permissive for file uploads
CREATE POLICY "Allow public read cv photos" ON storage.objects FOR SELECT USING (bucket_id = 'cv-photos');
CREATE POLICY "Allow public insert cv photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cv-photos');
CREATE POLICY "Allow users to update their photos" ON storage.objects FOR UPDATE USING (bucket_id = 'cv-photos');
CREATE POLICY "Allow users to delete their photos" ON storage.objects FOR DELETE USING (bucket_id = 'cv-photos');
`;

console.log('Database initialization SQL ready. Use this in your setup endpoint.');
