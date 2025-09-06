-- Description: Add 'missed' status to live_class_status enum
-- Date: January 15, 2025
-- Author: System Administrator

-- Add 'missed' to the existing enum type
ALTER TYPE live_class_status ADD VALUE IF NOT EXISTS 'missed';

-- Refresh PostgREST schema cache to prevent PGRST204 errors
NOTIFY pgrst, 'reload schema';

-- Verification query
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'live_class_status')
ORDER BY enumsortorder;
