-- VeriWeb Database Setup Script
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/erdtyrhjktnewrvyuwqv/sql

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "fullName" TEXT NOT NULL,
  email TEXT NOT NULL,
  "phoneNumber" TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'registered')),
  "userId" UUID
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
  "aktaKelahiranPhotoUrl" TEXT
);

-- Create admin_users table for separate admin authentication
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL
);

-- Enable Row Level Security
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_email ON submissions(email);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions("userId");
CREATE INDEX IF NOT EXISTS idx_cv_data_user_id ON cv_data("userId");

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('cv-photos', 'cv-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Allow public read cv photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert cv photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their photos" ON storage.objects;

-- Storage policies
CREATE POLICY "Allow public read cv photos" ON storage.objects FOR SELECT USING (bucket_id = 'cv-photos');
CREATE POLICY "Allow authenticated insert cv photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cv-photos');
CREATE POLICY "Allow users to update their photos" ON storage.objects FOR UPDATE USING (bucket_id = 'cv-photos');
CREATE POLICY "Allow users to delete their photos" ON storage.objects FOR DELETE USING (bucket_id = 'cv-photos');

-- Ensure default admin account uses latest secure password (bcrypt hash of adminnew123)
UPDATE admin_users
SET "passwordHash" = '$2b$10$/dAyUTIaICyjCGCN4syZmu.8sBx1eumuSfufOnXtreWbA1qgSJppu'
WHERE username = 'admin';
