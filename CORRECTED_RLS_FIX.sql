-- CORRECTED RLS FIX FOR APPLICATIONS TABLE
-- This script properly handles existing policies and creates new ones

-- Step 1: Drop ALL existing policies on applications table
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

-- Step 2: Create the essential policies with unique names
-- Policy 1: Allow ANYONE to submit applications (for apply page)
CREATE POLICY "Allow applications submission" ON applications
    FOR INSERT 
    TO public
    WITH CHECK (true);

-- Policy 2: Allow admins to view all applications
CREATE POLICY "Admins can view applications" ON applications
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
CREATE POLICY "Admins can update applications" ON applications
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
CREATE POLICY "Admins can delete applications" ON applications
    FOR DELETE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Step 3: Verify the policies were created
SELECT 'Applications policies:' as info, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'applications'
ORDER BY policyname;

-- Step 4: Check RLS status
SELECT 'RLS Status:' as info, schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'applications';
