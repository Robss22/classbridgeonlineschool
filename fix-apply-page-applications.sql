-- Fix Apply Page Applications RLS Policy
-- This script allows anonymous users to submit applications while maintaining admin access

BEGIN;

-- =============================================
-- STEP 1: Drop Existing Problematic Policies
-- =============================================

-- Drop all existing policies on applications table
DROP POLICY IF EXISTS "Admins can view all applications" ON applications;
DROP POLICY IF EXISTS "Admins can manage applications" ON applications;
DROP POLICY IF EXISTS "Admin only - view applications" ON applications;
DROP POLICY IF EXISTS "Admin only - create applications" ON applications;
DROP POLICY IF EXISTS "Admin only - update applications" ON applications;
DROP POLICY IF EXISTS "Admin only - delete applications" ON applications;
DROP POLICY IF EXISTS "Users can view own applications" ON applications;
DROP POLICY IF EXISTS "Users can create applications" ON applications;
DROP POLICY IF EXISTS "Users can update own applications" ON applications;
DROP POLICY IF EXISTS "Users can delete own applications" ON applications;

-- =============================================
-- STEP 2: Create New RLS Policies
-- =============================================

-- Policy 1: Allow anonymous users to INSERT applications (for apply page)
CREATE POLICY "Allow anonymous applications" ON applications
    FOR INSERT 
    TO public
    WITH CHECK (true);

-- Policy 2: Allow admins to view all applications
CREATE POLICY "Admins can view all applications" ON applications
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Policy 3: Allow admins to update all applications
CREATE POLICY "Admins can update all applications" ON applications
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Policy 4: Allow admins to delete all applications
CREATE POLICY "Admins can delete all applications" ON applications
    FOR DELETE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- =============================================
-- STEP 3: Ensure RLS is Enabled
-- =============================================

-- Make sure RLS is enabled on applications table
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 4: Verify Policies
-- =============================================

-- Check that policies were created successfully
SELECT 'Applications policies:' as info, schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'applications'
ORDER BY policyname;

-- Check RLS status
SELECT 'RLS Status:' as info, schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'applications';

COMMIT;

-- ✅ APPLY PAGE APPLICATIONS FIXED!
-- 
-- 1. ✅ Anonymous users can now submit applications
-- 2. ✅ Admins can view, update, and delete all applications
-- 3. ✅ RLS is properly configured for security
--
-- Test:
-- - Visit /apply and submit an application (should work)
-- - Visit /admin/applications to see submitted applications (admin only)
