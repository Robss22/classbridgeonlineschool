-- Add paper_id column to subject_offerings table
-- This allows linking specific papers to subject offerings

ALTER TABLE subject_offerings 
ADD COLUMN paper_id UUID REFERENCES subject_papers(paper_id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_subject_offerings_paper_id ON subject_offerings(paper_id);

-- Add comment to document the change
COMMENT ON COLUMN subject_offerings.paper_id IS 'Optional reference to a specific paper for this subject offering. Some subjects have multiple papers offered in different classes.';
