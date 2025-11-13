-- Add Working Contract fields to process_data
-- Run this in Supabase SQL Editor

-- 1) Add columns if they don't exist
ALTER TABLE process_data
  ADD COLUMN IF NOT EXISTS contract_approval_date DATE,
  ADD COLUMN IF NOT EXISTS contract_start_date DATE,
  ADD COLUMN IF NOT EXISTS contract_end_date DATE,
  ADD COLUMN IF NOT EXISTS contract_document_url TEXT;

-- 2) Quick check
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'process_data' AND column_name LIKE 'contract_%'
ORDER BY column_name;
