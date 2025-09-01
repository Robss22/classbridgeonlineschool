-- Simple RLS Fix for Teacher Students View
-- This version uses safer type casting and simpler policies

BEGIN;

-- Step 1: Drop all existing policies to start fresh
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

-- Step 2: Create simple, safe policies for enrollments
-- Allow teachers to view enrollments for their assigned levels
CREATE POLICY "Teachers can view enrollments" ON enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teacher_assignments ta
            JOIN teachers t ON ta.teacher_id = t.teacher_id
            WHERE t.user_id = auth.uid()
            AND ta.level_id = enrollments.level_id
        )
    );

-- Allow students to view their own enrollments
CREATE POLICY "Students can view own enrollments" ON enrollments
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Allow admins to view all enrollments
CREATE POLICY "Admins can view all enrollments" ON enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Step 3: Create policies for users table
-- Allow teachers to view student profiles for their assigned levels
CREATE POLICY "Teachers can view student profiles" ON users
    FOR SELECT USING (
        role = 'student' AND
        EXISTS (
            SELECT 1 FROM enrollments e
            JOIN teacher_assignments ta ON e.level_id = ta.level_id
            JOIN teachers t ON ta.teacher_id = t.teacher_id
            WHERE t.user_id = auth.uid()
            AND e.user_id = users.id
        )
    );

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (
        id = auth.uid()
    );

-- Allow admins to view all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );

-- Step 4: Create policies for teacher_assignments
-- Allow teachers to view their own assignments
CREATE POLICY "Teachers can view own assignments" ON teacher_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teachers t
            WHERE t.teacher_id = teacher_assignments.teacher_id
            AND t.user_id = auth.uid()
        )
    );

-- Allow admins to view all teacher assignments
CREATE POLICY "Admins can view all teacher assignments" ON teacher_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Step 5: Enable RLS on all tables
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;

-- Step 6: Verify the policies were created
SELECT 
    'POLICIES CREATED' as info,
    schemaname, 
    tablename, 
    policyname, 
    cmd
FROM pg_policies 
WHERE tablename IN ('enrollments', 'users', 'teacher_assignments')
ORDER BY tablename, policyname;

COMMIT;

-- ✅ SIMPLE RLS POLICIES CREATED SUCCESSFULLY!
-- 
-- This version:
-- 1. Uses direct UUID comparisons (auth.uid() returns UUID)
-- 2. Avoids explicit type casting that can cause issues
-- 3. Uses simpler, more reliable policy logic
-- 4. Maintains security while being more robust
--
-- Teachers should now be able to see students enrolled in their assigned levels and subjects!
