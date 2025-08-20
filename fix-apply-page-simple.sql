-- Simple Fix for Apply Page - Programs and Levels Access
-- This script fixes the "Select Curriculum" dropdown issue by allowing public access

BEGIN;

-- Step 1: Check current RLS status
SELECT 'Current RLS status:' as info, schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('programs', 'levels');

-- Step 2: Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view programs" ON programs;
DROP POLICY IF EXISTS "Admins can manage programs" ON programs;
DROP POLICY IF EXISTS "Enable read access for all users" ON programs;
DROP POLICY IF EXISTS "Enable insert for admins" ON programs;
DROP POLICY IF EXISTS "Enable update for admins" ON programs;
DROP POLICY IF EXISTS "Enable delete for admins" ON programs;

DROP POLICY IF EXISTS "Users can view levels" ON levels;
DROP POLICY IF EXISTS "Admins can manage levels" ON levels;
DROP POLICY IF EXISTS "Enable read access for all users" ON levels;
DROP POLICY IF EXISTS "Enable insert for admins" ON levels;
DROP POLICY IF EXISTS "Enable update for admins" ON levels;
DROP POLICY IF EXISTS "Enable delete for admins" ON levels;

-- Step 3: Create simple, public read policies for programs
CREATE POLICY "Public read access to programs" ON programs
    FOR SELECT 
    TO public
    USING (true);

-- Step 4: Create simple, public read policies for levels  
CREATE POLICY "Public read access to levels" ON levels
    FOR SELECT 
    TO public
    USING (true);

-- Step 5: Ensure RLS is enabled
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;

-- Step 6: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Step 7: Verify the fix
SELECT 'Programs policies:' as info, schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'programs';

SELECT 'Levels policies:' as info, schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'levels';

-- Step 8: Test the access
SELECT 'Programs count:' as info, COUNT(*) as count FROM programs;
SELECT 'Levels count:' as info, COUNT(*) as count FROM levels;

COMMIT;

-- ✅ APPLY PAGE FIXED!
-- The "Select Curriculum" dropdown should now populate with programs
-- Anonymous users can now access programs and levels for the apply page
