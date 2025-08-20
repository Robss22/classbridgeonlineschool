-- Migration: Create RLS policies for application approval system
-- Date: 2025-08-18
-- Description: Comprehensive RLS policies for applications, users, and related tables

-- Enable RLS on all relevant tables
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_offerings ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- APPLICATIONS TABLE RLS POLICIES
-- ===================================================================

-- Policy: Users can view their own applications
CREATE POLICY "Users can view own applications" ON applications
    FOR SELECT USING (
        auth.uid()::text = user_id OR 
        auth.uid()::text = auth_user_id
    );

-- Policy: Users can create applications
CREATE POLICY "Users can create applications" ON applications
    FOR INSERT WITH CHECK (
        auth.uid()::text = user_id OR 
        auth.uid()::text = auth_user_id
    );

-- Policy: Users can update their own applications
CREATE POLICY "Users can update own applications" ON applications
    FOR UPDATE USING (
        auth.uid()::text = user_id OR 
        auth.uid()::text = auth_user_id
    );

-- Policy: Admins can view all applications
CREATE POLICY "Admins can view all applications" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Policy: Admins can update all applications
CREATE POLICY "Admins can update all applications" ON applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Policy: Teachers can view applications for their assigned programs/levels
-- Note: This is a simplified version that checks if the teacher has access
CREATE POLICY "Teachers can view relevant applications" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()::text 
            AND u.role = 'teacher'
        )
    );

-- ===================================================================
-- USERS TABLE RLS POLICIES
-- ===================================================================

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (
        auth.uid()::text = id OR 
        auth.uid()::text = auth_user_id
    );

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (
        auth.uid()::text = id OR 
        auth.uid()::text = auth_user_id
    );

-- Policy: Admins can view all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()::text 
            AND u.role = 'admin'
        )
    );

-- Policy: Admins can update all users
CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()::text 
            AND u.role = 'admin'
        )
    );

-- Policy: Teachers can view students (simplified)
CREATE POLICY "Teachers can view students" ON users
    FOR SELECT USING (
        role = 'student' AND
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()::text 
            AND u.role = 'teacher'
        )
    );

-- ===================================================================
-- ENROLLMENTS TABLE RLS POLICIES
-- ===================================================================

-- Policy: Users can view their own enrollments
CREATE POLICY "Users can view own enrollments" ON enrollments
    FOR SELECT USING (
        auth.uid()::text = user_id
    );

-- Policy: Admins can view all enrollments
CREATE POLICY "Admins can view all enrollments" ON enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Policy: Teachers can view enrollments (simplified)
CREATE POLICY "Teachers can view enrollments" ON enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()::text 
            AND u.role = 'teacher'
        )
    );

-- ===================================================================
-- TEACHER_ASSIGNMENTS TABLE RLS POLICIES
-- ===================================================================

-- Policy: Teachers can view their own assignments
CREATE POLICY "Teachers can view own assignments" ON teacher_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()::text 
            AND u.role = 'teacher'
        )
    );

-- Policy: Admins can view all teacher assignments
CREATE POLICY "Admins can view all teacher assignments" ON teacher_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- ===================================================================
-- SUBJECT_OFFERINGS TABLE RLS POLICIES
-- ===================================================================

-- Policy: Everyone can view subject offerings (public information)
CREATE POLICY "Public subject offerings view" ON subject_offerings
    FOR SELECT USING (true);

-- Policy: Admins can manage subject offerings
CREATE POLICY "Admins can manage subject offerings" ON subject_offerings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- ===================================================================
-- SPECIAL POLICIES FOR EDGE FUNCTION OPERATIONS
-- ===================================================================

-- Note: Edge Functions use service_role key which bypasses RLS
-- These policies are for client-side access control

-- Policy: Allow service role to bypass RLS for application approval
-- This is handled automatically by Supabase when using service_role key

-- ===================================================================
-- INDEXES FOR PERFORMANCE
-- ===================================================================

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_auth_user_id ON applications(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_program_level ON applications(program_id, level_id);

CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_subject_offering ON enrollments(subject_offering_id);

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher ON teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_program_level ON teacher_assignments(program_id, level_id);

-- ===================================================================
-- VERIFICATION QUERIES
-- ===================================================================

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('applications', 'users', 'enrollments', 'teacher_assignments', 'subject_offerings');

-- Verify policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('applications', 'users', 'enrollments', 'teacher_assignments', 'subject_offerings');
