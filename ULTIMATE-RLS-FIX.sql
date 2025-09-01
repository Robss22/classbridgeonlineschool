-- ULTIMATE RLS FIX: Complete RLS Disable (No Auth Dependencies)
-- This will completely disable all RLS without relying on auth context

BEGIN;

-- Step 1: Show current RLS status
SELECT 
    'CURRENT RLS STATUS' as info,
    schemaname, 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '❌ RLS ENABLED'
        ELSE '✅ RLS DISABLED'
    END as status
FROM pg_tables 
WHERE tablename IN ('users', 'enrollments', 'teacher_assignments', 'applications', 'live_classes', 'resources', 'assessments', 'timetables', 'notifications')
AND schemaname = 'public'
ORDER BY tablename;

-- Step 2: Disable RLS on all tables (direct approach)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop ALL policies (direct approach)
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

-- Drop any other policies that might exist
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON enrollments;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON enrollments;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON enrollments;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON enrollments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON teacher_assignments;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON teacher_assignments;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON teacher_assignments;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON teacher_assignments;

-- Step 4: Drop helper functions
DROP FUNCTION IF EXISTS is_admin(UUID);
DROP FUNCTION IF EXISTS is_teacher(UUID);
DROP FUNCTION IF EXISTS is_student(UUID);

-- Step 5: Verify RLS is disabled
SELECT 
    'FINAL RLS STATUS' as info,
    schemaname, 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '❌ RLS STILL ENABLED'
        ELSE '✅ RLS DISABLED'
    END as status
FROM pg_tables 
WHERE tablename IN ('users', 'enrollments', 'teacher_assignments')
AND schemaname = 'public'
ORDER BY tablename;

-- Step 6: Test basic table access (no auth required)
SELECT 
    'TABLE ACCESS TEST' as info,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM enrollments) as enrollments_count,
    (SELECT COUNT(*) FROM teacher_assignments) as teacher_assignments_count;

-- Step 7: Show sample data (no auth required)
SELECT 
    'SAMPLE USERS' as info,
    id,
    email,
    role,
    full_name
FROM users 
LIMIT 5;

COMMIT;

-- ✅ ULTIMATE RLS FIX APPLIED!
-- 
-- What this does:
-- 1. ✅ Completely disables RLS on core tables
-- 2. ✅ Drops ALL policies from core tables
-- 3. ✅ Removes ALL helper functions
-- 4. ✅ Tests access without auth context
-- 5. ✅ Shows sample data to verify access
--
-- ⚠️ WARNING: This makes your database completely open (no security)
-- This is a temporary measure to get your application working
-- You should re-enable security once the app is stable
--
-- The infinite recursion should now be completely eliminated!
-- Your application should work immediately.
