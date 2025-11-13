const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

const createTablesSQL = `
-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "fullName" TEXT NOT NULL,
  email TEXT NOT NULL,
  "phoneNumber" TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'registered', 'MCU', 'Interview', 'Visa', 'Depart')),
  "userId" UUID
);

-- Create cv_data table with all CV fields
CREATE TABLE IF NOT EXISTS cv_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  "paklaringPhotoUrl" TEXT
);

-- Enable Row Level Security
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_data ENABLE ROW LEVEL SECURITY;

-- Create policies for submissions (public access for admin)
CREATE POLICY IF NOT EXISTS "Allow public read" ON submissions FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow public insert" ON submissions FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow public update" ON submissions FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Allow public delete" ON submissions FOR DELETE USING (true);

-- Create policies for cv_data (users can only access their own data)
CREATE POLICY IF NOT EXISTS "Users can read own CV" ON cv_data FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY IF NOT EXISTS "Users can insert own CV" ON cv_data FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY IF NOT EXISTS "Users can update own CV" ON cv_data FOR UPDATE USING (auth.uid() = "userId");

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_email ON submissions(email);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions("userId");
CREATE INDEX IF NOT EXISTS idx_cv_data_user_id ON cv_data("userId");

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('cv-photos', 'cv-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY IF NOT EXISTS "Allow public read cv photos" ON storage.objects FOR SELECT USING (bucket_id = 'cv-photos');
CREATE POLICY IF NOT EXISTS "Allow authenticated insert cv photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cv-photos' AND auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Allow users to update their photos" ON storage.objects FOR UPDATE USING (bucket_id = 'cv-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY IF NOT EXISTS "Allow users to delete their photos" ON storage.objects FOR DELETE USING (bucket_id = 'cv-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
`

async function initDatabase() {
  try {
    console.log('Creating database tables...')
    
    // Execute SQL using Supabase's RPC or directly via SQL Editor
    // Note: This requires the SQL to be run manually in Supabase SQL Editor
    // or using a Supabase Edge Function
    
    console.log('\n==============================================')
    console.log('PLEASE RUN THIS SQL IN SUPABASE SQL EDITOR:')
    console.log('==============================================\n')
    console.log(createTablesSQL)
    console.log('\n==============================================')
    console.log('Go to: https://supabase.com/dashboard/project/erdtyrhjktnewrvyuwqv/sql')
    console.log('Paste the SQL above and click "Run"')
    console.log('==============================================\n')
    
    // Test connection
    const { data, error } = await supabaseAdmin.from('submissions').select('count').single()
    if (error && !error.message.includes('does not exist')) {
      console.log('✓ Connected to Supabase successfully')
    } else if (error) {
      console.log('⚠ Tables not created yet. Please run the SQL above in Supabase.')
    } else {
      console.log('✓ Database tables already exist!')
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

initDatabase()
