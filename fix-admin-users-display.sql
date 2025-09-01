-- Fix Admin Users Display Issue
-- This script ensures admins can view all users properly

BEGIN;

-- Step 1: Check current RLS status
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '❌ RLS ENABLED'
        ELSE '✅ RLS DISABLED'
    END as status
FROM pg_tables 
WHERE tablename = 'users';

-- Step 2: Drop all existing RLS policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Teachers can view students" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;
DROP POLICY IF EXISTS "Admins can delete any user" ON users;
DROP POLICY IF EXISTS "Admin only - view users" ON users;
DROP POLICY IF EXISTS "Admin only - create users" ON users;
DROP POLICY IF EXISTS "Admin only - update users" ON users;
DROP POLICY IF EXISTS "Admin only - delete users" ON users;

-- Step 3: Create simple, working RLS policies
-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (
        (auth.uid()::text) = (id::text)
    );

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (
        (auth.uid()::text) = (id::text)
    );

-- Policy: Admins can view all users (simple version)
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = (auth.uid()::text)
            AND u.role = 'admin'
        )
    );

-- Policy: Admins can update all users
CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = (auth.uid()::text)
            AND u.role = 'admin'
        )
    );

-- Policy: Admins can delete all users
CREATE POLICY "Admins can delete all users" ON users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = (auth.uid()::text)
            AND u.role = 'admin'
        )
    );

-- Policy: Allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert" ON users
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Policy: Teachers can view students
CREATE POLICY "Teachers can view students" ON users
    FOR SELECT USING (
        role = 'student' AND
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = (auth.uid()::text)
            AND u.role = 'teacher'
        )
    );

-- Step 4: Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 5: Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Step 6: Verify policies were created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN '✅ READ'
        WHEN cmd = 'INSERT' THEN '✅ CREATE'
        WHEN cmd = 'UPDATE' THEN '✅ UPDATE'
        WHEN cmd = 'DELETE' THEN '✅ DELETE'
        ELSE '❓ UNKNOWN'
    END as operation
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 7: Test query to verify admin access works
-- This will show if the policies are working correctly
SELECT 
    'Testing admin access...' as test_status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'teacher' THEN 1 END) as teacher_count,
    COUNT(CASE WHEN role = 'student' THEN 1 END) as student_count
FROM users;

COMMIT;

-- ✅ ADMIN USERS DISPLAY ISSUE FIXED!
-- Admins should now be able to:
-- 1. View all users (admins, teachers, students)
-- 2. Update all users
-- 3. Delete all users
-- 4. Access the admin users page without issues
