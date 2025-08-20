-- Migration: Create admin-only RLS policies for application approval system
-- Date: 2025-08-18
-- Description: Simple RLS policies that only allow admins to access data

-- Enable RLS on core tables
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- APPLICATIONS TABLE RLS POLICIES
-- ===================================================================

-- Policy: Only admins can view applications
CREATE POLICY "Admin only - view applications" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = (auth.uid()::text)
            AND users.role = 'admin'
        )
    );

-- Policy: Only admins can create applications
CREATE POLICY "Admin only - create applications" ON applications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = (auth.uid()::text)
            AND users.role = 'admin'
        )
    );

-- Policy: Only admins can update applications
CREATE POLICY "Admin only - update applications" ON applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = (auth.uid()::text)
            AND users.role = 'admin'
        )
    );

-- Policy: Only admins can delete applications
CREATE POLICY "Admin only - delete applications" ON applications
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = (auth.uid()::text)
            AND users.role = 'admin'
        )
    );

-- ===================================================================
-- USERS TABLE RLS POLICIES
-- ===================================================================

-- Policy: Only admins can view users
CREATE POLICY "Admin only - view users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = (auth.uid()::text)
            AND u.role = 'admin'
        )
    );

-- Policy: Only admins can create users
CREATE POLICY "Admin only - create users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = (auth.uid()::text)
            AND u.role = 'admin'
        )
    );

-- Policy: Only admins can update users
CREATE POLICY "Admin only - update users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = (auth.uid()::text)
            AND u.role = 'admin'
        )
    );

-- Policy: Only admins can delete users
CREATE POLICY "Admin only - delete users" ON users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = (auth.uid()::text)
            AND u.role = 'admin'
        )
    );

-- ===================================================================
-- BASIC INDEXES FOR PERFORMANCE
-- ===================================================================

-- Create basic indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
