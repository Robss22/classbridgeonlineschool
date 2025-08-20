-- SAFE RLS RESTORATION FOR CLASSBRIDGE ONLINE SCHOOL
-- This script restores Row Level Security safely after the emergency fix
-- Run this AFTER the EMERGENCY_RLS_FIX.sql script has been executed

BEGIN;

-- Step 1: Create safe RLS policies for users table
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (
        (auth.uid()::text) = id OR 
        (auth.uid()::text) = auth_user_id
    );

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (
        (auth.uid()::text) = id OR 
        (auth.uid()::text) = auth_user_id
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
        (auth.uid()::text) = id OR 
        (auth.uid()::text) = auth_user_id
    );

CREATE POLICY "Admins can delete any user" ON users
    FOR DELETE USING (
        is_user_admin(auth.uid())
    );

-- Step 2: Create safe RLS policies for applications table
CREATE POLICY "Users can view own applications" ON applications
    FOR SELECT USING (
        (auth.uid()::text) = user_id
    );

CREATE POLICY "Admins can view all applications" ON applications
    FOR SELECT USING (
        is_user_admin(auth.uid())
    );

CREATE POLICY "Users can create applications" ON applications
    FOR INSERT WITH CHECK (
        (auth.uid()::text) = user_id
    );

CREATE POLICY "Admins can update applications" ON applications
    FOR UPDATE USING (
        is_user_admin(auth.uid())
    );

-- Step 3: Create safe RLS policies for enrollments table
CREATE POLICY "Users can view own enrollments" ON enrollments
    FOR SELECT USING (
        (auth.uid()::text) = student_id
    );

CREATE POLICY "Teachers can view student enrollments" ON enrollments
    FOR SELECT USING (
        is_user_teacher(auth.uid())
    );

CREATE POLICY "Admins can view all enrollments" ON enrollments
    FOR SELECT USING (
        is_user_admin(auth.uid())
    );

-- Step 4: Create safe RLS policies for live_classes table
CREATE POLICY "Users can view live classes" ON live_classes
    FOR SELECT USING (
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Teachers can manage their live classes" ON live_classes
    FOR ALL USING (
        (auth.uid()::text) = teacher_id AND is_user_teacher(auth.uid())
    );

CREATE POLICY "Admins can manage all live classes" ON live_classes
    FOR ALL USING (
        is_user_admin(auth.uid())
    );

-- Step 5: Create safe RLS policies for resources table
CREATE POLICY "Users can view resources" ON resources
    FOR SELECT USING (
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Teachers can manage their resources" ON resources
    FOR ALL USING (
        (auth.uid()::text) = teacher_id AND is_user_teacher(auth.uid())
    );

CREATE POLICY "Admins can manage all resources" ON resources
    FOR ALL USING (
        is_user_admin(auth.uid())
    );

-- Step 6: Create safe RLS policies for assessments table
CREATE POLICY "Users can view assessments" ON assessments
    FOR SELECT USING (
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Teachers can manage their assessments" ON assessments
    FOR ALL USING (
        (auth.uid()::text) = teacher_id AND is_user_teacher(auth.uid())
    );

CREATE POLICY "Admins can manage all assessments" ON assessments
    FOR ALL USING (
        is_user_admin(auth.uid())
    );

-- Step 7: Create safe RLS policies for timetables table
CREATE POLICY "Users can view timetables" ON timetables
    FOR SELECT USING (
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Teachers can manage their timetables" ON timetables
    FOR ALL USING (
        (auth.uid()::text) = teacher_id AND is_user_teacher(auth.uid())
    );

CREATE POLICY "Admins can manage all timetables" ON timetables
    FOR ALL USING (
        is_user_admin(auth.uid())
    );

-- Step 8: Enable RLS on tables with safe policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;

-- Step 9: Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Step 10: Verify RLS is properly configured
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
    'resources', 'assessments', 'timetables'
)
ORDER BY tablename;

-- Step 11: Verify policies are created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    cmd
FROM pg_policies 
WHERE tablename IN (
    'users', 'applications', 'enrollments', 'live_classes',
    'resources', 'assessments', 'timetables'
)
ORDER BY tablename, policyname;

COMMIT;

-- ✅ SECURITY RESTORED SUCCESSFULLY!
-- Your application now has proper RLS policies without infinite recursion
-- Test authentication and user management to ensure everything works
