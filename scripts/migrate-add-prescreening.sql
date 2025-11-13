-- Add pre-screening and interview status fields to process_data
ALTER TABLE process_data
ADD COLUMN IF NOT EXISTS prescreen_tanggal DATE;

ALTER TABLE process_data
ADD COLUMN IF NOT EXISTS prescreen_interviewer TEXT;

ALTER TABLE process_data
ADD COLUMN IF NOT EXISTS prescreen_bahasa_inggris TEXT CHECK (prescreen_bahasa_inggris IN ('Bad', 'Fair', 'Good', 'Excellent'));

ALTER TABLE process_data
ADD COLUMN IF NOT EXISTS prescreen_finansial TEXT CHECK (prescreen_finansial IN ('Kurang', 'Cukup', 'Baik'));

ALTER TABLE process_data
ADD COLUMN IF NOT EXISTS interview_status TEXT CHECK (interview_status IN ('Fail', 'Pass'));
