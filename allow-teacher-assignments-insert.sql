-- Allow INSERT operations on teacher_assignments table
-- This script will create a policy that allows authenticated users to insert records

-- First, check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'teacher_assignments';

-- Drop any existing INSERT policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON teacher_assignments;
DROP POLICY IF EXISTS "Enable insert for admins and authenticated users" ON teacher_assignments;

-- Create a simple INSERT policy that allows all authenticated users
CREATE POLICY "Allow insert for authenticated users" ON teacher_assignments
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Enable RLS if not already enabled
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'teacher_assignments' AND cmd = 'INSERT'; 