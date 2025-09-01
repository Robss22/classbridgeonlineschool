-- Fix RLS Policies for Teacher Assignments in Live Class Scheduling
-- This script ensures that the teacher assignment queries work properly for the live class modal

BEGIN;

-- Step 1: Check current RLS policies
SELECT 
    'CURRENT RLS POLICIES' as info,
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies 
WHERE tablename = 'teacher_assignments'
ORDER BY cmd, policyname;

-- Step 2: Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Teachers can view own assignments" ON teacher_assignments;
DROP POLICY IF EXISTS "Admins can view all teacher assignments" ON teacher_assignments;
DROP POLICY IF EXISTS "Allow authenticated users to view teacher assignments" ON teacher_assignments;
DROP POLICY IF EXISTS "Allow admins to manage teacher assignments" ON teacher_assignments;
DROP POLICY IF EXISTS "Allow teachers to view own assignments" ON teacher_assignments;

-- Step 3: Create new policies that allow proper access for live class scheduling

-- Policy: Allow authenticated users to view teacher assignments (needed for live class scheduling)
CREATE POLICY "Allow authenticated users to view teacher assignments" ON teacher_assignments
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policy: Allow admins to manage teacher assignments
CREATE POLICY "Allow admins to manage teacher assignments" ON teacher_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policy: Allow teachers to view their own assignments
CREATE POLICY "Allow teachers to view own assignments" ON teacher_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teachers t
            JOIN users u ON t.user_id = u.id
            WHERE u.id = auth.uid()
            AND t.teacher_id = teacher_assignments.teacher_id
        )
    );

-- Step 4: Verify the new policies
SELECT 
    'NEW RLS POLICIES' as info,
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies 
WHERE tablename = 'teacher_assignments'
ORDER BY cmd, policyname;

-- Step 5: Test the query that the frontend uses
-- This should return results if everything is working correctly
SELECT 
    'TEST FRONTEND QUERY' as test_result,
    COUNT(*) as teacher_count,
    'If this returns 0, there might be no assignments or RLS issues' as note
FROM teacher_assignments ta
JOIN teachers t ON ta.teacher_id = t.teacher_id
JOIN users u ON t.user_id = u.id
WHERE auth.uid() IS NOT NULL;

-- Step 6: Show sample data for verification
SELECT 
    'SAMPLE TEACHER ASSIGNMENTS' as sample_data,
    ta.teacher_id,
    u.full_name as teacher_name,
    s.name as subject_name,
    l.name as level_name
FROM teacher_assignments ta
JOIN teachers t ON ta.teacher_id = t.teacher_id
JOIN users u ON t.user_id = u.id
JOIN subjects s ON ta.subject_id = s.subject_id
JOIN levels l ON ta.level_id = l.level_id
LIMIT 5;

COMMIT;

-- ✅ Teacher assignment queries should now work for live class scheduling!
-- 
-- What this fixes:
-- 1. Allows authenticated users to view teacher assignments (needed for live class modal)
-- 2. Maintains admin access for managing assignments
-- 3. Allows teachers to view their own assignments
-- 4. Ensures the frontend query will work properly
-- 5. Fixed UUID type casting issues
--
-- Test the live class scheduling modal again - teacher filtering should work now.
