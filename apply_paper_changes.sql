-- Apply paper_id column to subject_offerings table
-- Run this script manually in your Supabase SQL editor

-- Add paper_id column to subject_offerings table
ALTER TABLE subject_offerings 
ADD COLUMN IF NOT EXISTS paper_id UUID REFERENCES subject_papers(paper_id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_subject_offerings_paper_id ON subject_offerings(paper_id);

-- Add comment to document the change
COMMENT ON COLUMN subject_offerings.paper_id IS 'Optional reference to a specific paper for this subject offering. Some subjects have multiple papers offered in different classes.';

-- Verify the change
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'subject_offerings' 
AND column_name = 'paper_id';
