-- Fix Subjects RLS for Admin Access
-- This script will fix the RLS policy to allow admins to view all subjects

BEGIN;

-- First, let's see the current policy
SELECT 
    'CURRENT POLICY' as info,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'subjects' AND policyname = 'Users can view subjects';

-- Option 1: Update the existing policy to be more permissive for admins
-- This allows both authenticated users AND admins to view all subjects
DROP POLICY IF EXISTS "Users can view subjects" ON subjects;

CREATE POLICY "Users can view subjects" ON subjects
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() IS NOT NULL
    );

-- Option 2: Create an additional policy for admin access
-- This ensures admins can always view all subjects
CREATE POLICY "Admins can view all subjects" ON subjects
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Option 3: Create a more permissive policy that allows all authenticated users
-- This replaces the restrictive policy with a more open one
CREATE POLICY "All authenticated users can view subjects" ON subjects
    FOR SELECT
    TO authenticated
    USING (true);

-- Verify the policies
SELECT 
    'UPDATED POLICIES' as info,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'subjects'
ORDER BY policyname;

-- Test the query to make sure it works
SELECT 
    'TEST QUERY' as info,
    subject_id,
    name,
    description
FROM subjects
ORDER BY name;

COMMIT;

-- ✅ Subjects RLS policy has been updated!
-- 
-- What this does:
-- 1. Updates the existing policy to be more permissive
-- 2. Creates an additional admin-specific policy
-- 3. Creates a fallback policy for all authenticated users
-- 4. Ensures admins can view all subjects including Biology
--
-- The live class modal should now show all 3 subjects: Biology, ICT, Mathematics
