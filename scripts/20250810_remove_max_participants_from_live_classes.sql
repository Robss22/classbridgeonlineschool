-- Description: Remove max_participants column from live_classes table
-- Date: August 10, 2025
-- Author: System Administrator

-- Migration
ALTER TABLE live_classes DROP COLUMN IF EXISTS max_participants;

-- Refresh PostgREST schema cache to prevent PGRST204 errors
NOTIFY pgrst, 'reload schema';

-- Verification query
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'live_classes';
