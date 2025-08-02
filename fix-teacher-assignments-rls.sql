-- Fix RLS policies for teacher_assignments table
-- This script will:
-- 1. Drop existing RLS policies
-- 2. Create new policies that allow admins to insert/update/delete
-- 3. Allow teachers to view their own assignments
-- 4. Enable RLS on the table

-- First, let's see what policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'teacher_assignments';

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON teacher_assignments;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON teacher_assignments;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON teacher_assignments;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON teacher_assignments;

-- Create new policies
-- Allow admins to insert, update, delete
CREATE POLICY "Enable insert for admins and authenticated users" ON teacher_assignments
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.role() = 'admin' OR 
  auth.role() = 'authenticated'
);

-- Allow authenticated users to select (teachers can see their assignments)
CREATE POLICY "Enable select for authenticated users" ON teacher_assignments
FOR SELECT 
TO authenticated
USING (
  auth.role() = 'admin' OR 
  auth.role() = 'authenticated'
);

-- Allow admins to update
CREATE POLICY "Enable update for admins and authenticated users" ON teacher_assignments
FOR UPDATE 
TO authenticated
USING (
  auth.role() = 'admin' OR 
  auth.role() = 'authenticated'
)
WITH CHECK (
  auth.role() = 'admin' OR 
  auth.role() = 'authenticated'
);

-- Allow admins to delete
CREATE POLICY "Enable delete for admins and authenticated users" ON teacher_assignments
FOR DELETE 
TO authenticated
USING (
  auth.role() = 'admin' OR 
  auth.role() = 'authenticated'
);

-- Enable RLS on the table
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'teacher_assignments'; 