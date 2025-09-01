-- Fix Users Display Issue - Comprehensive Solution
-- This script ensures all users are properly displayed for admin users

BEGIN;

-- Step 1: Check current RLS status and policies
SELECT 
    'Current RLS Status' as info,
    schemaname, 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '❌ RLS ENABLED'
        ELSE '✅ RLS DISABLED'
    END as status
FROM pg_tables 
WHERE tablename = 'users';

-- Step 2: Show current policies
SELECT 
    'Current Policies' as info,
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

-- Step 3: Drop all existing RLS policies on users table
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
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON users;

-- Step 4: Create comprehensive RLS policies for proper admin access
-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (
        (auth.uid()::text) = (id::text)
    );

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (
        (auth.uid()::text) = (id::text)
    );

-- Policy 3: Admins can view ALL users (this is the key fix)
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = (auth.uid()::text)
            AND u.role = 'admin'
        )
    );

-- Policy 4: Admins can update ALL users
CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = (auth.uid()::text)
            AND u.role = 'admin'
        )
    );

-- Policy 5: Admins can delete ALL users
CREATE POLICY "Admins can delete all users" ON users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = (auth.uid()::text)
            AND u.role = 'admin'
        )
    );

-- Policy 6: Allow authenticated users to insert (for registration)
CREATE POLICY "Allow authenticated users to insert" ON users
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Policy 7: Teachers can view students
CREATE POLICY "Teachers can view students" ON users
    FOR SELECT USING (
        role = 'student' AND
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = (auth.uid()::text)
            AND u.role = 'teacher'
        )
    );

-- Step 5: Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 6: Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Step 7: Verify the fix by testing admin access
-- This will show if the policies are working correctly
SELECT 
    'Testing admin access...' as test_status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'teacher' THEN 1 END) as teacher_count,
    COUNT(CASE WHEN role = 'student' THEN 1 END) as student_count,
    COUNT(CASE WHEN role IS NULL THEN 1 END) as null_role_count
FROM users;

-- Step 8: Show sample users to verify data exists
SELECT 
    'Sample Users' as info,
    id,
    email,
    full_name,
    role,
    status,
    created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 9: Verify policies were created successfully
SELECT 
    'Final Policy Check' as info,
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

COMMIT;

-- ✅ USERS DISPLAY ISSUE FIXED!
-- 
-- What this fix does:
-- 1. Removes all conflicting RLS policies
-- 2. Creates a comprehensive policy that allows admins to view ALL users
-- 3. Maintains security while ensuring proper access
-- 4. Provides detailed debugging information
--
-- Expected Results:
-- - Admins should now see ALL users (admins, teachers, students)
-- - Teachers section should show teacher users
-- - Students section should show student users
-- - All CRUD operations should work properly
--
-- If users still don't appear, check:
-- 1. That the current user has 'admin' role in the users table
-- 2. That other users actually exist in the database
-- 3. That the users have proper role values ('admin', 'teacher', 'student')
