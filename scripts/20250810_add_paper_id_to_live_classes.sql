-- Description: Add paper_id column to live_classes table
-- Date: August 10, 2025
-- Author: System Administrator

-- Migration
-- Add paper_id column with foreign key reference to papers table
ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS paper_id UUID REFERENCES papers(paper_id);

-- Refresh PostgREST schema cache to prevent PGRST204 errors
NOTIFY pgrst, 'reload schema';

-- Verification query
SELECT column_name, data_type, is_nullable, udt_name
FROM information_schema.columns 
WHERE table_name = 'live_classes';
