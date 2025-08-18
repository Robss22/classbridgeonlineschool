-- Fix RLS policies for programs table
-- This script will ensure that programs can be read by all users (including anonymous users for the apply page)

-- First, check if RLS is enabled on programs table
SELECT schemaname, tablename, rowsecurity 
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

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'programs';

-- Test the policies by running a simple select
SELECT COUNT(*) as program_count FROM programs;
