-- ========================================
-- CREATE PROCESS_DATA TABLE FOR ADMIN PROCESS FEATURE
-- ========================================
-- Run this SQL script in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql

-- Create process_data table for user processing information
CREATE TABLE IF NOT EXISTS process_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Pre-Screening Data
  "prescreen_tanggal" DATE,
  "prescreen_interviewer" TEXT,
  "prescreen_bahasa_inggris" TEXT CHECK (prescreen_bahasa_inggris IN ('Bad', 'Fair', 'Good', 'Excellent')),
  "prescreen_finansial" TEXT CHECK (prescreen_finansial IN ('Kurang', 'Cukup', 'Baik')),

  -- MCU Data
  "mcu_tanggal" DATE,
  "mcu_status" TEXT CHECK (mcu_status IN ('Fit', 'Unfit', 'Fit With Note')),
  "mcu_note" TEXT,
  "mcu_document_url" TEXT,

  -- Interview Data
  "interview_tanggal" DATE,
  "interview_score_bahasa" TEXT CHECK (interview_score_bahasa IN ('Basic', 'Good', 'Expert')),
  "interview_score_keahlian" TEXT CHECK (interview_score_keahlian IN ('Basic', 'Good', 'Expert')),
  "interview_status" TEXT CHECK (interview_status IN ('Fail', 'Pass')),

  -- Visa Data
  "visa_tanggal_terbit" DATE,
  "visa_lokasi_penerbitan" TEXT,
  "visa_no_referensi" TEXT,
  "visa_document_url" TEXT,

  -- Keberangkatan Data
  "keberangkatan_tanggal" DATE,
  "keberangkatan_bandara_asal" TEXT,
  "keberangkatan_bandara_tujuan" TEXT,
  "keberangkatan_no_tiket" TEXT
  ,
  -- Working Contract
  contract_approval_date DATE,
  contract_start_date DATE,
  contract_end_date DATE,
  contract_document_url TEXT
);

-- Enable Row Level Security
ALTER TABLE process_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read process_data" ON process_data;
DROP POLICY IF EXISTS "Allow public insert process_data" ON process_data;
DROP POLICY IF EXISTS "Allow public update process_data" ON process_data;

-- Create policies for process_data
CREATE POLICY "Allow public read process_data" ON process_data FOR SELECT USING (true);
CREATE POLICY "Allow public insert process_data" ON process_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update process_data" ON process_data FOR UPDATE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_process_data_user_id ON process_data("userId");
CREATE INDEX IF NOT EXISTS idx_process_data_created_at ON process_data("createdAt");

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ process_data table created successfully!';
  RAISE NOTICE '✅ RLS policies created for process_data!';
  RAISE NOTICE '✅ Indexes created for process_data!';
  RAISE NOTICE '';
  RAISE NOTICE 'The Process feature is now ready to use! 🎉';
END $$;
