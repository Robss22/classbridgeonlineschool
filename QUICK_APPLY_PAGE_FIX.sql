-- QUICK FIX FOR APPLY PAGE - Allow Anonymous Applications
-- Run this in your Supabase SQL editor

BEGIN;

-- Step 1: Temporarily disable RLS to clean up
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "Allow anonymous applications" ON applications;
DROP POLICY IF EXISTS "Users can view own applications" ON applications;
DROP POLICY IF EXISTS "Users can create applications" ON applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON applications;
DROP POLICY IF EXISTS "Allow applications submission" ON applications;
DROP POLICY IF EXISTS "Admin only - view applications" ON applications;
DROP POLICY IF EXISTS "Admin only - create applications" ON applications;
DROP POLICY IF EXISTS "Admin only - update applications" ON applications;
DROP POLICY IF EXISTS "Admin only - delete applications" ON applications;
DROP POLICY IF EXISTS "public_insert_applications" ON applications;
DROP POLICY IF EXISTS "admin_select_applications" ON applications;
DROP POLICY IF EXISTS "admin_update_applications" ON applications;
DROP POLICY IF EXISTS "admin_delete_applications" ON applications;

-- Step 3: Create simple, working policies
-- MOST IMPORTANT: Allow anyone to submit applications
CREATE POLICY "allow_public_submissions" ON applications
    FOR INSERT 
    TO public
    WITH CHECK (true);

-- Allow admins to view all applications
CREATE POLICY "admin_view_all" ON applications
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::uuid = auth.uid()::uuid 
            AND users.role = 'admin'
        )
    );

-- Allow admins to update applications
CREATE POLICY "admin_update_all" ON applications
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::uuid = auth.uid()::uuid 
            AND users.role = 'admin'
        )
    );

-- Allow admins to delete applications
CREATE POLICY "admin_delete_all" ON applications
    FOR DELETE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::uuid = auth.uid()::uuid 
            AND users.role = 'admin'
        )
    );

-- Step 4: Re-enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify the policies are created
-- Check RLS status
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    'RLS Status' as info
FROM pg_tables 
WHERE tablename = 'applications';

-- Check policies separately
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    'Policy Details' as info
FROM pg_policies 
WHERE tablename = 'applications'
ORDER BY policyname;

COMMIT;
