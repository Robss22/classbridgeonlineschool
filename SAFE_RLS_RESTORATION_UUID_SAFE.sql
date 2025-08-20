-- SAFE RLS RESTORATION FOR CLASSBRIDGE ONLINE SCHOOL (UUID-SAFE VERSION)
-- This script restores Row Level Security safely after the emergency fix
-- UUID-SAFE: Properly handles UUID columns without type conversion errors
-- Run this AFTER the EMERGENCY_RLS_FIX.sql script has been executed

BEGIN;

-- Step 1: Create safe RLS policies for users table with UUID-safe handling
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (
        (auth.uid()::text) = (id::text) OR 
        (auth.uid()::text) = (COALESCE(auth_user_id::text, ''))
    );

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (
        (auth.uid()::text) = (id::text) OR 
        (auth.uid()::text) = (COALESCE(auth_user_id::text, ''))
    );

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        is_user_admin(auth.uid())
    );

CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (
        is_user_admin(auth.uid())
    );

CREATE POLICY "Teachers can view students" ON users
    FOR SELECT USING (
        role = 'student' AND is_user_teacher(auth.uid())
    );

CREATE POLICY "Allow authenticated users to insert" ON users
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can delete own profile" ON users
    FOR DELETE USING (
        (auth.uid()::text) = (id::text) OR 
        (auth.uid()::text) = (COALESCE(auth_user_id::text, ''))
    );

CREATE POLICY "Admins can delete any user" ON users
    FOR DELETE USING (
        is_user_admin(auth.uid())
    );

-- Step 2: Create safe RLS policies for applications table with UUID-safe handling
CREATE POLICY "Users can view own applications" ON applications
    FOR SELECT USING (
        (auth.uid()::text) = (COALESCE(user_id::text, ''))
    );

CREATE POLICY "Admins can view all applications" ON applications
    FOR SELECT USING (
        is_user_admin(auth.uid())
    );

CREATE POLICY "Users can create applications" ON applications
    FOR INSERT WITH CHECK (
        (auth.uid()::text) = (COALESCE(user_id::text, ''))
    );

CREATE POLICY "Admins can update applications" ON applications
    FOR UPDATE USING (
        is_user_admin(auth.uid())
    );

-- Step 3: Create safe RLS policies for enrollments table with UUID-safe handling
CREATE POLICY "Users can view own enrollments" ON enrollments
    FOR SELECT USING (
        (auth.uid()::text) = (COALESCE(student_id::text, ''))
    );

CREATE POLICY "Teachers can view student enrollments" ON enrollments
    FOR SELECT USING (
        is_user_teacher(auth.uid())
    );

CREATE POLICY "Admins can view all enrollments" ON enrollments
    FOR SELECT USING (
        is_user_admin(auth.uid())
    );

-- Step 4: Create safe RLS policies for live_classes table with UUID-safe handling
CREATE POLICY "Users can view live classes" ON live_classes
    FOR SELECT USING (
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Teachers can manage their live classes" ON live_classes
    FOR ALL USING (
        (auth.uid()::text) = (COALESCE(teacher_id::text, '')) AND is_user_teacher(auth.uid())
    );

CREATE POLICY "Admins can manage all live classes" ON live_classes
    FOR ALL USING (
        is_user_admin(auth.uid())
    );

-- Step 5: Create safe RLS policies for resources table with UUID-safe handling
CREATE POLICY "Users can view resources" ON resources
    FOR SELECT USING (
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Teachers can manage their resources" ON resources
    FOR ALL USING (
        (auth.uid()::text) = (COALESCE(teacher_id::text, '')) AND is_user_teacher(auth.uid())
    );

CREATE POLICY "Admins can manage all resources" ON resources
    FOR ALL USING (
        is_user_admin(auth.uid())
    );

-- Step 6: Create safe RLS policies for assessments table with UUID-safe handling
CREATE POLICY "Users can view assessments" ON assessments
    FOR SELECT USING (
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Teachers can manage their assessments" ON assessments
    FOR ALL USING (
        (auth.uid()::text) = (COALESCE(teacher_id::text, '')) AND is_user_teacher(auth.uid())
    );

CREATE POLICY "Admins can manage all assessments" ON assessments
    FOR ALL USING (
        is_user_admin(auth.uid())
    );

-- Step 7: Create safe RLS policies for timetables table with UUID-safe handling
CREATE POLICY "Users can view timetables" ON timetables
    FOR SELECT USING (
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Teachers can manage their timetables" ON timetables
    FOR ALL USING (
        (auth.uid()::text) = (COALESCE(user_id::text, '')) AND is_user_teacher(auth.uid())
    );

CREATE POLICY "Admins can manage all timetables" ON timetables
    FOR ALL USING (
        is_user_admin(auth.uid())
    );

-- Step 8: Create safe RLS policies for other tables with UUID-safe handling
CREATE POLICY "Users can view programs" ON programs
    FOR SELECT USING (
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Admins can manage programs" ON programs
    FOR ALL USING (
        is_user_admin(auth.uid())
    );

CREATE POLICY "Users can view levels" ON levels
    FOR SELECT USING (
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Admins can manage levels" ON levels
    FOR ALL USING (
        is_user_admin(auth.uid())
    );

CREATE POLICY "Users can view subjects" ON subjects
    FOR SELECT USING (
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Admins can manage subjects" ON subjects
    FOR ALL USING (
        is_user_admin(auth.uid())
    );

CREATE POLICY "Users can view notifications" ON notifications
    FOR SELECT USING (
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can manage own notifications" ON notifications
    FOR ALL USING (
        (auth.uid()::text) = (COALESCE(user_id::text, ''))
    );

CREATE POLICY "Admins can manage all notifications" ON notifications
    FOR ALL USING (
        is_user_admin(auth.uid())
    );

-- Step 9: Enable RLS on tables with safe policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 10: Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Step 11: Verify RLS is properly configured
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ENABLED (SECURE)'
        ELSE '❌ RLS DISABLED (INSECURE)'
    END as status
FROM pg_tables 
WHERE tablename IN (
    'users', 'applications', 'enrollments', 'live_classes',
    'resources', 'assessments', 'timetables', 'programs',
    'levels', 'subjects', 'notifications'
)
ORDER BY tablename;

-- Step 12: Verify policies are created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    cmd
FROM pg_policies 
WHERE tablename IN (
    'users', 'applications', 'enrollments', 'live_classes',
    'resources', 'assessments', 'timetables', 'programs',
    'levels', 'subjects', 'notifications'
)
ORDER BY tablename, policyname;

COMMIT;

-- ✅ SECURITY RESTORED SUCCESSFULLY!
-- Your application now has proper RLS policies without infinite recursion
-- All UUID type casting issues have been resolved
-- Test authentication and user management to ensure everything works
