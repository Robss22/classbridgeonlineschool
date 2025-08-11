-- Description: Add timestamp columns to live_classes table
-- Date: August 10, 2025
-- Author: System Administrator

-- Migration
BEGIN;

-- Add timestamp columns
ALTER TABLE live_classes 
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verify columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'live_classes'
AND column_name IN ('started_at', 'ended_at');

COMMIT;
