-- Fix Admin Permissions for Users Table
-- This script will update RLS policies to allow admins to manage users

-- First, let's check current RLS policies on users table
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
WHERE tablename = 'users';

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

-- Create new comprehensive policies for users table with proper type casting

-- 1. Read Policy: Users can read their own profile, admins can read all
CREATE POLICY "users_read_policy" ON users
    FOR SELECT
    USING (
        auth.uid()::text = id::text
        OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- 2. Insert Policy: Admins can create users, users can create their own profile
CREATE POLICY "users_insert_policy" ON users
    FOR INSERT
    WITH CHECK (
        auth.uid()::text = id::text
        OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- 3. Update Policy: Users can update their own profile, admins can update any user
CREATE POLICY "users_update_policy" ON users
    FOR UPDATE
    USING (
        auth.uid()::text = id::text
        OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    )
    WITH CHECK (
        auth.uid()::text = id::text
        OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- 4. Delete Policy: Only admins can delete users
CREATE POLICY "users_delete_policy" ON users
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Verify the policies were created
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
WHERE tablename = 'users'
ORDER BY policyname;

-- Test query to verify admin can read all users
SELECT 
    'Admin permissions test' as test_type,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'teacher' THEN 1 END) as teacher_count,
    COUNT(CASE WHEN role = 'student' THEN 1 END) as student_count
FROM users;
