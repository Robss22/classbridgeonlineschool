-- SAFE NUCLEAR FIX: Complete RLS Disable (Only Existing Tables)
-- This will completely disable all RLS on tables that actually exist

BEGIN;

-- Step 1: Check which tables exist first
SELECT 
    'EXISTING TABLES CHECK' as info,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('users', 'enrollments', 'teacher_assignments', 'applications', 'live_classes', 'resources', 'assessments', 'timetables', 'notifications')
AND schemaname = 'public'
ORDER BY tablename;

-- Step 2: Safely disable RLS only on existing tables
-- We'll use conditional logic to avoid errors

DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Check and disable RLS on users
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
    ) INTO table_exists;
    
    IF table_exists THEN
        ALTER TABLE users DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS on users table';
    END IF;

    -- Check and disable RLS on enrollments
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'enrollments'
    ) INTO table_exists;
    
    IF table_exists THEN
        ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS on enrollments table';
    END IF;

    -- Check and disable RLS on teacher_assignments
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'teacher_assignments'
    ) INTO table_exists;
    
    IF table_exists THEN
        ALTER TABLE teacher_assignments DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS on teacher_assignments table';
    END IF;

    -- Check and disable RLS on applications
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'applications'
    ) INTO table_exists;
    
    IF table_exists THEN
        ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS on applications table';
    END IF;

    -- Check and disable RLS on live_classes
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'live_classes'
    ) INTO table_exists;
    
    IF table_exists THEN
        ALTER TABLE live_classes DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS on live_classes table';
    END IF;

    -- Check and disable RLS on resources
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'resources'
    ) INTO table_exists;
    
    IF table_exists THEN
        ALTER TABLE resources DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS on resources table';
    END IF;

    -- Check and disable RLS on assessments
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'assessments'
    ) INTO table_exists;
    
    IF table_exists THEN
        ALTER TABLE assessments DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS on assessments table';
    END IF;

    -- Check and disable RLS on timetables
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'timetables'
    ) INTO table_exists;
    
    IF table_exists THEN
        ALTER TABLE timetables DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS on timetables table';
    END IF;

    -- Check and disable RLS on notifications
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'notifications'
    ) INTO table_exists;
    
    IF table_exists THEN
        ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS on notifications table';
    END IF;

END $$;

-- Step 3: Drop ALL policies from ALL tables (safe approach)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies from users table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON users';
        RAISE NOTICE 'Dropped policy % on users table', policy_record.policyname;
    END LOOP;

    -- Drop all policies from enrollments table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'enrollments' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON enrollments';
        RAISE NOTICE 'Dropped policy % on enrollments table', policy_record.policyname;
    END LOOP;

    -- Drop all policies from teacher_assignments table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'teacher_assignments' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON teacher_assignments';
        RAISE NOTICE 'Dropped policy % on teacher_assignments table', policy_record.policyname;
    END LOOP;

    -- Drop all policies from applications table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'applications' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON applications';
        RAISE NOTICE 'Dropped policy % on applications table', policy_record.policyname;
    END LOOP;

    -- Drop all policies from live_classes table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'live_classes' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON live_classes';
        RAISE NOTICE 'Dropped policy % on live_classes table', policy_record.policyname;
    END LOOP;

    -- Drop all policies from resources table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'resources' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON resources';
        RAISE NOTICE 'Dropped policy % on resources table', policy_record.policyname;
    END LOOP;

    -- Drop all policies from assessments table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'assessments' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON assessments';
        RAISE NOTICE 'Dropped policy % on assessments table', policy_record.policyname;
    END LOOP;

    -- Drop all policies from timetables table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'timetables' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON timetables';
        RAISE NOTICE 'Dropped policy % on timetables table', policy_record.policyname;
    END LOOP;

    -- Drop all policies from notifications table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'notifications' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON notifications';
        RAISE NOTICE 'Dropped policy % on notifications table', policy_record.policyname;
    END LOOP;

END $$;

-- Step 4: Drop helper functions to avoid any issues
DROP FUNCTION IF EXISTS is_admin(UUID);
DROP FUNCTION IF EXISTS is_teacher(UUID);
DROP FUNCTION IF EXISTS is_student(UUID);

-- Step 5: Verify RLS is completely disabled
SELECT 
    'FINAL RLS STATUS CHECK' as info,
    schemaname, 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '❌ RLS STILL ENABLED'
        ELSE '✅ RLS DISABLED'
    END as status
FROM pg_tables 
WHERE tablename IN ('users', 'enrollments', 'teacher_assignments', 'applications', 'live_classes', 'resources', 'assessments', 'timetables', 'notifications')
AND schemaname = 'public'
ORDER BY tablename;

-- Step 6: Test basic access
SELECT 
    'BASIC ACCESS TEST' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM users WHERE id = auth.uid()) 
        THEN '✅ SUCCESS - User can access own profile'
        ELSE '❌ FAILED - User still cannot access profile'
    END as test_result;

-- Step 7: Show current user info
SELECT 
    'CURRENT USER INFO' as info,
    auth.uid() as user_id,
    (SELECT email FROM users WHERE id = auth.uid()) as user_email,
    (SELECT role FROM users WHERE id = auth.uid()) as user_role;

COMMIT;

-- ✅ SAFE NUCLEAR FIX APPLIED!
-- 
-- What this does:
-- 1. ✅ Checks which tables exist before trying to modify them
-- 2. ✅ Safely disables RLS only on existing tables
-- 3. ✅ Drops ALL policies from ALL existing tables
-- 4. ✅ Removes ALL helper functions
-- 5. ✅ Eliminates ALL possible sources of infinite recursion
--
-- ⚠️ WARNING: This makes your database completely open (no security)
-- This is a temporary measure to get your application working
-- You should re-enable security once the app is stable
--
-- The infinite recursion should now be completely eliminated!
-- Your application should work immediately.
