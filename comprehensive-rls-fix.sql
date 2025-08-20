-- Comprehensive RLS Fix for Applications Table

-- Step 1: Temporarily disable RLS to clean up policies
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow anonymous applications" ON applications;
DROP POLICY IF EXISTS "Users can view own applications" ON applications;
DROP POLICY IF EXISTS "Users can create applications" ON applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON applications;
DROP POLICY IF EXISTS "Allow applications submission" ON applications;
DROP POLICY IF EXISTS "Admin only - view applications" ON applications;
DROP POLICY IF EXISTS "Admin only - create applications" ON applications;
DROP POLICY IF EXISTS "Admin only - update applications" ON applications;
DROP POLICY IF EXISTS "Admin only - delete applications" ON applications;

-- Step 3: Create new, properly structured policies

-- Allow public (anonymous) users to insert applications
CREATE POLICY "Allow anonymous submissions" ON applications
    FOR INSERT 
    TO public
    WITH CHECK (true);

-- Allow authenticated users to view their own applications
CREATE POLICY "Users can view own applications" ON applications
    FOR SELECT 
    USING (
        (auth.uid()::text = user_id) OR 
        (auth.uid()::text = auth_user_id)
    );

-- Allow admins to view all applications
CREATE POLICY "Admins can view all applications" ON applications
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Allow admins to update applications
CREATE POLICY "Admins can update applications" ON applications
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Step 4: Re-enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify the setup
SELECT 'RLS Status:' as info, schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'applications';

SELECT 'Current Policies:' as info, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'applications'
ORDER BY policyname;
