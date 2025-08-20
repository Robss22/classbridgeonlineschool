-- Fix Infinite Recursion in Users Table RLS Policies
-- This script fixes the infinite recursion issue caused by RLS policies
-- that reference the users table within their own policy definitions

BEGIN;

-- First, let's see what policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Teachers can view students" ON users;

-- Create a function to check if a user is an admin without causing recursion
CREATE OR REPLACE FUNCTION is_user_admin(p_user_id UUID) 
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- Use a direct query to avoid RLS recursion
    SELECT role INTO v_role
    FROM public.users
    WHERE id = p_user_id::text;
    
    RETURN v_role = 'admin';
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if a user is a teacher without causing recursion
CREATE OR REPLACE FUNCTION is_user_teacher(p_user_id UUID) 
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- Use a direct query to avoid RLS recursion
    SELECT role INTO v_role
    FROM public.users
    WHERE id = p_user_id::text;
    
    RETURN v_role = 'teacher';
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new, safe RLS policies

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

-- Policy: Admins can view all users (using function to avoid recursion)
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        is_user_admin(auth.uid())
    );

-- Policy: Admins can update all users (using function to avoid recursion)
CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (
        is_user_admin(auth.uid())
    );

-- Policy: Teachers can view students (using function to avoid recursion)
CREATE POLICY "Teachers can view students" ON users
    FOR SELECT USING (
        role = 'student' AND is_user_teacher(auth.uid())
    );

-- Policy: Allow authenticated users to insert (for registration)
CREATE POLICY "Allow authenticated users to insert" ON users
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Policy: Allow users to delete their own profile
CREATE POLICY "Users can delete own profile" ON users
    FOR DELETE USING (
        (auth.uid()::text) = id OR 
        (auth.uid()::text) = auth_user_id
    );

-- Policy: Admins can delete any user
CREATE POLICY "Admins can delete any user" ON users
    FOR DELETE USING (
        is_user_admin(auth.uid())
    );

-- Grant necessary permissions to the functions
GRANT EXECUTE ON FUNCTION is_user_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_teacher(UUID) TO authenticated;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the new policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

COMMIT;
