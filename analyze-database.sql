-- Database Analysis Script
-- This script analyzes the current database state to understand why only admins are displayed

BEGIN;

-- Step 1: Check table structure
SELECT 
    'Table Structure Analysis' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Step 2: Check RLS status
SELECT 
    'RLS Status' as info,
    schemaname, 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '❌ RLS ENABLED'
        ELSE '✅ RLS DISABLED'
    END as status
FROM pg_tables 
WHERE tablename = 'users';

-- Step 3: Check current RLS policies
SELECT 
    'Current RLS Policies' as info,
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

-- Step 4: Count all users in database (without RLS)
SELECT 
    'Total Users in Database (Raw Count)' as info,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'teacher' THEN 1 END) as teacher_count,
    COUNT(CASE WHEN role = 'student' THEN 1 END) as student_count,
    COUNT(CASE WHEN role IS NULL THEN 1 END) as null_role_count,
    COUNT(CASE WHEN role NOT IN ('admin', 'teacher', 'student') THEN 1 END) as other_roles_count
FROM users;

-- Step 5: Show all users with their details
SELECT 
    'All Users in Database' as info,
    id,
    email,
    full_name,
    role,
    status,
    created_at,
    CASE 
        WHEN role = 'admin' THEN '👑 ADMIN'
        WHEN role = 'teacher' THEN '👨‍🏫 TEACHER'
        WHEN role = 'student' THEN '👨‍🎓 STUDENT'
        WHEN role IS NULL THEN '❓ NO ROLE'
        ELSE '❓ UNKNOWN ROLE'
    END as role_display
FROM users 
ORDER BY role, created_at;

-- Step 6: Check for authentication issues
SELECT 
    'Authentication Check' as info,
    'Current auth.uid()' as check_type,
    auth.uid() as current_user_id;

-- Step 7: Test what the current user can see with RLS
-- This simulates what the admin user would see
SELECT 
    'What Current User Can See (with RLS)' as info,
    COUNT(*) as visible_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as visible_admins,
    COUNT(CASE WHEN role = 'teacher' THEN 1 END) as visible_teachers,
    COUNT(CASE WHEN role = 'student' THEN 1 END) as visible_students
FROM users;

-- Step 8: Check if there are any users with different role values
SELECT 
    'Role Distribution Analysis' as info,
    role,
    COUNT(*) as count,
    CASE 
        WHEN role = 'admin' THEN '✅ Valid Admin'
        WHEN role = 'teacher' THEN '✅ Valid Teacher'
        WHEN role = 'student' THEN '✅ Valid Student'
        WHEN role IS NULL THEN '❌ NULL Role'
        ELSE '❓ Invalid Role'
    END as status
FROM users 
GROUP BY role 
ORDER BY count DESC;

-- Step 9: Check for potential data issues
SELECT 
    'Data Quality Check' as info,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email IS NULL OR email = '' THEN 1 END) as missing_email,
    COUNT(CASE WHEN full_name IS NULL OR full_name = '' THEN 1 END) as missing_name,
    COUNT(CASE WHEN status IS NULL THEN 1 END) as missing_status,
    COUNT(CASE WHEN created_at IS NULL THEN 1 END) as missing_created_at
FROM users;

-- Step 10: Test specific RLS policy behavior
-- This will help us understand why only admins are visible
SELECT 
    'RLS Policy Test - Admin Access' as info,
    'Testing if admin can see all users' as test_description,
    COUNT(*) as total_visible,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as visible_admins,
    COUNT(CASE WHEN role = 'teacher' THEN 1 END) as visible_teachers,
    COUNT(CASE WHEN role = 'student' THEN 1 END) as visible_students
FROM users 
WHERE EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = (auth.uid()::text)
    AND u.role = 'admin'
);

COMMIT;

-- Analysis Summary:
-- 
-- This script will help us understand:
-- 1. What users actually exist in the database
-- 2. What RLS policies are in place
-- 3. Why only admins are being displayed
-- 4. Whether the issue is data-related or policy-related
--
-- Expected findings:
-- - If there are only admin users in the database, that explains the display
-- - If there are other users but they're not visible, it's an RLS policy issue
-- - If RLS is disabled, all users should be visible
-- - If RLS is enabled with wrong policies, only certain users will be visible
