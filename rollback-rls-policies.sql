-- Rollback RLS Policies (Emergency Backup)
-- Use this only if you need to revert the RLS changes

BEGIN;

-- Step 1: Drop all RLS policies
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

-- Step 2: Disable RLS temporarily (allows all access)
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop helper functions
DROP FUNCTION IF EXISTS is_admin(UUID);
DROP FUNCTION IF EXISTS is_teacher(UUID);
DROP FUNCTION IF EXISTS is_student(UUID);

-- Step 4: Verify RLS is disabled
SELECT 
    'RLS STATUS AFTER ROLLBACK' as info,
    schemaname, 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '❌ RLS STILL ENABLED'
        ELSE '✅ RLS DISABLED (UNSECURE)'
    END as status
FROM pg_tables 
WHERE tablename IN ('enrollments', 'users', 'teacher_assignments')
ORDER BY tablename;

COMMIT;

-- ⚠️ WARNING: RLS IS NOW DISABLED - ALL DATA IS ACCESSIBLE TO ALL USERS!
-- 
-- This is a temporary emergency measure. You should:
-- 1. Fix the infinite recursion issue
-- 2. Re-enable RLS with proper policies
-- 3. Test thoroughly before going to production
--
-- To re-enable RLS safely, run the permanent fix script again.
