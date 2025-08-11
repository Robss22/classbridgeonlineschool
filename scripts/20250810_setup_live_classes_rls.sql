-- Description: Set up RLS policies for live_classes table
-- Date: August 10, 2025
-- Author: System Administrator

-- Migration
BEGIN;

-- Enable RLS on live_classes table
ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON live_classes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON live_classes;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON live_classes;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON live_classes;

-- Create policies
-- Read policy: Teachers can read their own classes, admins can read all
CREATE POLICY "Enable read access for authenticated users" ON live_classes
    FOR SELECT
    USING (
        (auth.uid() IN (SELECT user_id FROM teachers WHERE teacher_id = live_classes.teacher_id))
        OR 
        (auth.uid() IN (SELECT user_id FROM admins))
    );

-- Insert policy: Teachers can create their own classes, admins can create for any teacher
CREATE POLICY "Enable insert for authenticated users" ON live_classes
    FOR INSERT
    WITH CHECK (
        (auth.uid() IN (SELECT user_id FROM teachers WHERE teacher_id = live_classes.teacher_id))
        OR 
        (auth.uid() IN (SELECT user_id FROM admins))
    );

-- Update policy: Teachers can update their own classes, admins can update any
CREATE POLICY "Enable update for authenticated users" ON live_classes
    FOR UPDATE
    USING (
        (auth.uid() IN (SELECT user_id FROM teachers WHERE teacher_id = live_classes.teacher_id))
        OR 
        (auth.uid() IN (SELECT user_id FROM admins))
    )
    WITH CHECK (
        (auth.uid() IN (SELECT user_id FROM teachers WHERE teacher_id = live_classes.teacher_id))
        OR 
        (auth.uid() IN (SELECT user_id FROM admins))
    );

-- Delete policy: Teachers can delete their own classes, admins can delete any
CREATE POLICY "Enable delete for authenticated users" ON live_classes
    FOR DELETE
    USING (
        (auth.uid() IN (SELECT user_id FROM teachers WHERE teacher_id = live_classes.teacher_id))
        OR 
        (auth.uid() IN (SELECT user_id FROM admins))
    );

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'live_classes';

COMMIT;
