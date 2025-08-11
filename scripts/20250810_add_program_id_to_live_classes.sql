-- Description: Add program_id column to live_classes table
-- Date: August 10, 2025
-- Author: System Administrator

-- Migration
-- Add program_id column with foreign key reference to programs table
ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(program_id) NOT NULL;

-- Refresh PostgREST schema cache to prevent PGRST204 errors
NOTIFY pgrst, 'reload schema';

-- Verification query
SELECT column_name, data_type, is_nullable, udt_name
FROM information_schema.columns 
WHERE table_name = 'live_classes';
