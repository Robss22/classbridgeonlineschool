-- Fix RLS Policies for Teacher Students View
-- This script ensures teachers can view students enrolled in their assigned levels and subjects

BEGIN;

-- Step 1: Check current RLS status
SELECT 
    'CURRENT RLS STATUS' as info,
    schemaname, 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED'
    END as status
FROM pg_tables 
WHERE tablename IN ('enrollments', 'users', 'teacher_assignments')
ORDER BY tablename;

-- Step 2: Drop existing restrictive policies that might block teacher access
DROP POLICY IF EXISTS "Teachers can view enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Teachers can view students" ON users;
DROP POLICY IF EXISTS "Teachers can view enrollments for their levels" ON enrollments;
DROP POLICY IF EXISTS "Students can view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON enrollments;
DROP POLICY IF EXISTS "Teachers can view student profiles" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Teachers can view own assignments" ON teacher_assignments;
DROP POLICY IF EXISTS "Admins can view all teacher assignments" ON teacher_assignments;

-- Step 3: Create new policies for enrollments table with proper UUID handling
-- Policy: Teachers can view enrollments for their assigned levels
CREATE POLICY "Teachers can view enrollments for their levels" ON enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teacher_assignments ta
            JOIN teachers t ON ta.teacher_id = t.teacher_id
            WHERE t.user_id::text = auth.uid()::text
            AND ta.level_id = enrollments.level_id
        )
    );

-- Policy: Students can view their own enrollments
CREATE POLICY "Students can view own enrollments" ON enrollments
    FOR SELECT USING (
        user_id::text = auth.uid()::text
    );

-- Policy: Admins can view all enrollments
CREATE POLICY "Admins can view all enrollments" ON enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Step 4: Create policies for users table to allow teachers to view student profiles
-- Policy: Teachers can view student profiles for their assigned levels
CREATE POLICY "Teachers can view student profiles" ON users
    FOR SELECT USING (
        role = 'student' AND
        EXISTS (
            SELECT 1 FROM enrollments e
            JOIN teacher_assignments ta ON e.level_id = ta.level_id
            JOIN teachers t ON ta.teacher_id = t.teacher_id
            WHERE t.user_id::text = auth.uid()::text
            AND e.user_id::text = users.id::text
        )
    );

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (
        id::text = auth.uid()::text
    );

-- Policy: Admins can view all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id::text = auth.uid()::text 
            AND u.role = 'admin'
        )
    );

-- Step 5: Ensure teacher_assignments has proper policies
-- Policy: Teachers can view their own assignments
CREATE POLICY "Teachers can view own assignments" ON teacher_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teachers t
            WHERE t.teacher_id = teacher_assignments.teacher_id
            AND t.user_id::text = auth.uid()::text
        )
    );

-- Policy: Admins can view all teacher assignments
CREATE POLICY "Admins can view all teacher assignments" ON teacher_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Step 6: Enable RLS on all tables
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;

-- Step 7: Verify the new policies
SELECT 
    'NEW RLS POLICIES' as info,
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('enrollments', 'users', 'teacher_assignments')
ORDER BY tablename, policyname;

-- Step 8: Test query to verify teacher can see students
-- This will show what a teacher would see (replace with actual teacher_id)
SELECT 
    'TEST QUERY - TEACHER STUDENTS VIEW' as info,
    'Run this with a teacher user to test access' as note;

-- Example test query (uncomment and modify with actual teacher_id):
/*
SELECT 
    e.user_id,
    u.full_name,
    u.email,
    u.phone,
    l.name as level_name,
    s.name as subject_name
FROM enrollments e
JOIN users u ON e.user_id = u.id
JOIN levels l ON e.level_id = l.level_id
JOIN subjects s ON e.subject_id = s.subject_id
JOIN teacher_assignments ta ON e.level_id = ta.level_id
JOIN teachers t ON ta.teacher_id = t.teacher_id
WHERE t.user_id::text = 'YOUR_TEACHER_USER_ID_HERE'
AND e.status = 'active'
ORDER BY u.full_name;
*/

COMMIT;

-- ✅ RLS POLICIES UPDATED SUCCESSFULLY!
-- 
-- What this script does:
-- 1. Drops restrictive policies that were blocking teacher access
-- 2. Creates new policies that allow teachers to view students in their assigned levels
-- 3. Ensures students can still view their own enrollments
-- 4. Allows admins to view all data
-- 5. Enables RLS on all relevant tables
-- 6. FIXED: Proper UUID/text type casting to prevent operator errors
--
-- Teachers should now be able to see students enrolled in their assigned levels and subjects!
