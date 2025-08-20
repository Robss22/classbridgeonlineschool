-- Migration: Create simplified RLS policies for application approval system
-- Date: 2025-08-18
-- Description: Basic RLS policies for core tables with proper UUID handling

-- Enable RLS on core tables
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- APPLICATIONS TABLE RLS POLICIES
-- ===================================================================

-- Policy: Users can view their own applications
CREATE POLICY "Users can view own applications" ON applications
    FOR SELECT USING (
        (auth.uid()::text) = user_id OR 
        (auth.uid()::text) = auth_user_id
    );

-- Policy: Users can create applications
CREATE POLICY "Users can create applications" ON applications
    FOR INSERT WITH CHECK (
        (auth.uid()::text) = user_id OR 
        (auth.uid()::text) = auth_user_id
    );

-- Policy: Users can update their own applications
CREATE POLICY "Users can update own applications" ON applications
    FOR UPDATE USING (
        (auth.uid()::text) = user_id OR 
        (auth.uid()::text) = auth_user_id
    );

-- Policy: Admins can view all applications
CREATE POLICY "Admins can view all applications" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = (auth.uid()::text)
            AND users.role = 'admin'
        )
    );

-- Policy: Admins can update all applications
CREATE POLICY "Admins can update all applications" ON applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = (auth.uid()::text)
            AND users.role = 'admin'
        )
    );

-- Policy: Teachers can view applications
CREATE POLICY "Teachers can view applications" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = (auth.uid()::text)
            AND u.role = 'teacher'
        )
    );

-- ===================================================================
-- USERS TABLE RLS POLICIES
-- ===================================================================

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (
        (auth.uid()::text) = id OR 
        (auth.uid()::text) = auth_user_id
    );

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (
        (auth.uid()::text) = id OR 
        (auth.uid()::text) = auth_user_id
    );

-- Policy: Admins can view all users
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

-- ===================================================================
-- BASIC INDEXES FOR PERFORMANCE
-- ===================================================================

-- Create basic indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_auth_user_id ON applications(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
