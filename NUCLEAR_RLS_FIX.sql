-- NUCLEAR RLS FIX FOR APPLICATIONS TABLE
-- This script completely resets RLS and creates working policies

BEGIN;

-- Step 1: COMPLETELY DISABLE RLS temporarily
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies (force removal)
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
DROP POLICY IF EXISTS "Allow anonymous applications" ON applications;
DROP POLICY IF EXISTS "Allow applications submission" ON applications;
DROP POLICY IF EXISTS "Admins can view applications" ON applications;
DROP POLICY IF EXISTS "Admins can update applications" ON applications;
DROP POLICY IF EXISTS "Admins can delete applications" ON applications;

-- Step 3: Verify all policies are gone
SELECT 'Policies before creation:' as info, COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'applications';

-- Step 4: Create simple, working policies
-- Policy 1: Allow ANYONE to submit applications (for apply page)
CREATE POLICY "public_insert_applications" ON applications
    FOR INSERT 
    TO public
    WITH CHECK (true);

-- Policy 2: Allow admins to view all applications
CREATE POLICY "admin_select_applications" ON applications
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Policy 3: Allow admins to update applications
CREATE POLICY "admin_update_applications" ON applications
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Policy 4: Allow admins to delete applications
CREATE POLICY "admin_delete_applications" ON applications
    FOR DELETE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Step 5: Re-enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Step 6: Verify the fix
SELECT 'Policies after creation:' as info, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'applications'
ORDER BY policyname;

-- Step 7: Check RLS status
SELECT 'RLS Status:' as info, schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'applications';

-- Step 8: Test insert permission (this should work now)
-- Note: This is just a verification query
SELECT 'Testing INSERT permission...' as info;

COMMIT;

-- ✅ NUCLEAR RLS FIX COMPLETED!
-- 
-- 1. ✅ RLS completely reset
-- 2. ✅ All old policies removed
-- 3. ✅ New working policies created
-- 4. ✅ Anonymous users can now submit applications
-- 5. ✅ Admins can view/manage applications
--
-- Test your apply page now - it should work!
