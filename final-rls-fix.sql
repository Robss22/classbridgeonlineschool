-- Final Fix for Applications Table RLS Based on Actual Structure

-- Step 1: Temporarily disable RLS
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "allow_anonymous_submissions" ON applications;
DROP POLICY IF EXISTS "public_insert" ON applications;
DROP POLICY IF EXISTS "admins_select" ON applications;
DROP POLICY IF EXISTS "admins_update" ON applications;
DROP POLICY IF EXISTS "Allow anonymous applications" ON applications;
DROP POLICY IF EXISTS "Allow anonymous submissions" ON applications;
DROP POLICY IF EXISTS "Users can view own applications" ON applications;
DROP POLICY IF EXISTS "Users can create applications" ON applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON applications;
DROP POLICY IF EXISTS "Allow applications submission" ON applications;
DROP POLICY IF EXISTS "Admin only - view applications" ON applications;
DROP POLICY IF EXISTS "Admin only - create applications" ON applications;
DROP POLICY IF EXISTS "Admin only - update applications" ON applications;
DROP POLICY IF EXISTS "Admin only - delete applications" ON applications;

-- Step 3: Create new simplified policies

-- MOST IMPORTANT: Allow public submissions without any restrictions
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

-- Allow students to view their own applications once authenticated
CREATE POLICY "students_view_own" ON applications
    FOR SELECT 
    TO authenticated
    USING (user_id::uuid = auth.uid()::uuid);

-- Step 4: Re-enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Step 5: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON applications TO authenticated;
GRANT INSERT ON applications TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Step 6: Verify the setup
SELECT 'RLS Status:'::text as info, 
       schemaname, 
       tablename, 
       rowsecurity 
FROM pg_tables 
WHERE tablename = 'applications';

SELECT 'Current Policies:'::text as info, 
       policyname, 
       permissive, 
       roles, 
       cmd 
FROM pg_policies 
WHERE tablename = 'applications'
ORDER BY policyname;
