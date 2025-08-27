-- Create the offering_papers table manually
-- Run this in your Supabase SQL Editor

-- Create junction table for multiple papers per offering
CREATE TABLE IF NOT EXISTS offering_papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offering_id UUID NOT NULL REFERENCES subject_offerings(id) ON DELETE CASCADE,
    paper_id UUID NOT NULL REFERENCES subject_papers(paper_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination
    UNIQUE(offering_id, paper_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_offering_papers_offering_id ON offering_papers(offering_id);
CREATE INDEX IF NOT EXISTS idx_offering_papers_paper_id ON offering_papers(paper_id);

-- Add comment
COMMENT ON TABLE offering_papers IS 'Junction table linking subject offerings to multiple papers';

-- Verify the table was created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'offering_papers' 
ORDER BY ordinal_position;
