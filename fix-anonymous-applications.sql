-- Fix for allowing anonymous applications
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow anonymous applications" ON applications;

-- Create new policy to allow anonymous applications
CREATE POLICY "Allow anonymous applications" ON applications
    FOR INSERT 
    TO public
    WITH CHECK (true);

-- Verify RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'applications';

-- Verify policies
SELECT policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'applications'
ORDER BY policyname;
