-- Description: Add missing updated_at column to live_classes table and refresh schema cache
-- Date: January 15, 2025
-- Author: System Administrator

-- Add the updated_at column if it doesn't exist
ALTER TABLE live_classes 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_live_classes_updated_at ON live_classes;
CREATE TRIGGER update_live_classes_updated_at
    BEFORE UPDATE ON live_classes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Refresh PostgREST schema cache to prevent PGRST204 errors
NOTIFY pgrst, 'reload schema';

-- Verification query
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'live_classes' 
AND column_name = 'updated_at';
