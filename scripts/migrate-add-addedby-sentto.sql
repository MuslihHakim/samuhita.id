-- Migration: Add addedBy and sentTo columns to submissions table
-- Purpose: Align database schema with Admin Dashboard filters and CSV import/export
-- Safe to run multiple times due to IF NOT EXISTS clauses

ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS "addedBy" TEXT,
ADD COLUMN IF NOT EXISTS "sentTo" TEXT;

-- Verification: ensure columns exist
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'submissions' AND column_name IN ('addedBy', 'sentTo')
ORDER BY column_name;

