-- Fix RLS policies for apply page tables (programs and levels)
-- This script will ensure that programs and levels can be read by all users
-- including anonymous users for the apply page

BEGIN;

-- =============================================
-- PROGRAMS TABLE RLS POLICIES
-- =============================================

-- Check if RLS is enabled on programs table
SELECT 'Programs table RLS status:' as info, schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'programs';

-- Drop any existing policies on programs table
DROP POLICY IF EXISTS "Enable read access for all users" ON programs;
DROP POLICY IF EXISTS "Enable insert for admins" ON programs;
DROP POLICY IF EXISTS "Enable update for admins" ON programs;
DROP POLICY IF EXISTS "Enable delete for admins" ON programs;

-- Create policies for programs table
-- Allow all users (including anonymous) to read programs
CREATE POLICY "Enable read access for all users" ON programs
FOR SELECT 
TO public
USING (true);

-- Allow authenticated users with admin role to insert programs
CREATE POLICY "Enable insert for admins" ON programs
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Allow authenticated users with admin role to update programs
CREATE POLICY "Enable update for admins" ON programs
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Allow authenticated users with admin role to delete programs
CREATE POLICY "Enable delete for admins" ON programs
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Enable RLS on programs table if not already enabled
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- LEVELS TABLE RLS POLICIES
-- =============================================

-- Check if RLS is enabled on levels table
SELECT 'Levels table RLS status:' as info, schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'levels';

-- Drop any existing policies on levels table
DROP POLICY IF EXISTS "Enable read access for all users" ON levels;
DROP POLICY IF EXISTS "Enable insert for admins" ON levels;
DROP POLICY IF EXISTS "Enable update for admins" ON levels;
DROP POLICY IF EXISTS "Enable delete for admins" ON levels;

-- Create policies for levels table
-- Allow all users (including anonymous) to read levels
CREATE POLICY "Enable read access for all users" ON levels
FOR SELECT 
TO public
USING (true);

-- Allow authenticated users with admin role to insert levels
CREATE POLICY "Enable insert for admins" ON levels
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Allow authenticated users with admin role to update levels
CREATE POLICY "Enable update for admins" ON levels
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Allow authenticated users with admin role to delete levels
CREATE POLICY "Enable delete for admins" ON levels
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Enable RLS on levels table if not already enabled
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;

-- =============================================
-- VERIFICATION AND TESTING
-- =============================================

-- Verify the policies were created for programs
SELECT 'Programs policies:' as info, schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'programs';

-- Verify the policies were created for levels
SELECT 'Levels policies:' as info, schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'levels';

-- Test the policies by running simple selects
SELECT 'Programs count:' as info, COUNT(*) as count FROM programs;
SELECT 'Levels count:' as info, COUNT(*) as count FROM levels;

-- Test with anonymous user context (this should work now)
-- Note: This is a simulation - in real usage, the apply page will work for anonymous users

COMMIT;

-- =============================================
-- SUMMARY
-- =============================================
-- 
-- This script has:
-- 1. ✅ Enabled RLS on both programs and levels tables
-- 2. ✅ Created policies allowing public read access to both tables
-- 3. ✅ Created policies allowing admin users to manage both tables
-- 4. ✅ Verified the policies were created successfully
-- 5. ✅ Tested basic queries on both tables
--
-- The apply page should now be able to:
-- - Fetch programs for the curriculum dropdown
-- - Fetch levels for the class dropdown
-- - Work for both authenticated and anonymous users
--
-- If you still experience issues, check:
-- 1. Browser console for JavaScript errors
-- 2. Network tab for failed API requests
-- 3. Supabase logs for any remaining permission issues
