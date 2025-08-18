-- Fix RLS policies for levels table
-- This script will ensure that levels can be read by all users (including anonymous users for the apply page)

-- First, check if RLS is enabled on levels table
SELECT schemaname, tablename, rowsecurity 
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

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'levels';

-- Test the policies by running a simple select
SELECT COUNT(*) as level_count FROM levels;
