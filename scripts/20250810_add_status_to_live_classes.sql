-- Description: Add status column to live_classes table
-- Date: August 10, 2025
-- Author: System Administrator

-- Migration
-- First, create an enum type for the status if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'live_class_status') THEN
        CREATE TYPE live_class_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');
    END IF;
END$$;

-- Add status column with enum type and default value
ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS status live_class_status NOT NULL DEFAULT 'scheduled';

-- Refresh PostgREST schema cache to prevent PGRST204 errors
NOTIFY pgrst, 'reload schema';

-- Verification query
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'live_classes';
