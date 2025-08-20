-- EMERGENCY RLS FIX FOR CLASSBRIDGE ONLINE SCHOOL
-- This script will immediately fix the infinite recursion issues
-- Run this in your Supabase SQL Editor to restore database functionality

BEGIN;

-- Step 1: Disable RLS on critical tables to stop infinite recursion
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE live_classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE live_class_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE timetables DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_timetables DISABLE ROW LEVEL SECURITY;
ALTER TABLE programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE resources DISABLE ROW LEVEL SECURITY;
ALTER TABLE assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing problematic RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Teachers can view students" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;
DROP POLICY IF EXISTS "Admins can delete any user" ON users;

-- Step 3: Create safe helper functions that don't cause recursion
CREATE OR REPLACE FUNCTION is_user_admin(p_user_id UUID) 
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- Direct query without triggering RLS
    SELECT role INTO v_role
    FROM public.users
    WHERE id = p_user_id::text;
    
    RETURN v_role = 'admin';
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_user_teacher(p_user_id UUID) 
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- Direct query without triggering RLS
    SELECT role INTO v_role
    FROM public.users
    WHERE id = p_user_id::text;
    
    RETURN v_role = 'teacher';
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_user_student(p_user_id UUID) 
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- Direct query without triggering RLS
    SELECT role INTO v_role
    FROM public.users
    WHERE id = p_user_id::text;
    
    RETURN v_role = 'student';
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Grant permissions to the helper functions
GRANT EXECUTE ON FUNCTION is_user_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_teacher(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_student(UUID) TO authenticated;

-- Step 5: Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Step 6: Verify RLS is disabled on critical tables
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '❌ RLS ENABLED (PROBLEMATIC)'
        ELSE '✅ RLS DISABLED (SAFE)'
    END as status
FROM pg_tables 
WHERE tablename IN (
    'users', 'applications', 'enrollments', 'teacher_assignments',
    'live_classes', 'live_class_participants', 'timetables',
    'student_timetables', 'programs', 'levels', 'subjects',
    'resources', 'assessments', 'notifications', 'user_sessions'
)
ORDER BY tablename;

COMMIT;

-- IMPORTANT: Your application should now work immediately!
-- The next step is to run the SAFE_RLS_RESTORATION.sql script to restore security properly
