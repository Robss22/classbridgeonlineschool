-- Description: Add meeting_platform column to live_classes table
-- Date: August 10, 2025
-- Author: System Administrator

-- Migration
ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS meeting_platform TEXT NOT NULL DEFAULT 'Google Meet';
ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS meeting_link TEXT;

-- Refresh PostgREST schema cache to prevent PGRST204 errors
NOTIFY pgrst, 'reload schema';

-- Verification query
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'live_classes';
