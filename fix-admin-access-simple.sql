-- Simple Fix for Admin Access Issues
-- This script resolves admin access problems with careful type handling

BEGIN;

-- Step 1: Drop problematic RLS policies
DROP POLICY IF EXISTS "Admin only - view applications" ON applications;
DROP POLICY IF EXISTS "Admin only - create applications" ON applications;
DROP POLICY IF EXISTS "Admin only - update applications" ON applications;
DROP POLICY IF EXISTS "Admin only - delete applications" ON applications;

DROP POLICY IF EXISTS "Admin only - view users" ON users;
DROP POLICY IF EXISTS "Admin only - create users" ON users;
DROP POLICY IF EXISTS "Admin only - update users" ON users;
DROP POLICY IF EXISTS "Admin only - delete users" ON users;

-- Step 2: Create safe helper function for admin check
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

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION is_user_admin(UUID) TO authenticated;

-- Step 4: Create simple RLS policies for applications
CREATE POLICY "Admins can view all applications" ON applications
    FOR SELECT USING (
        is_user_admin(auth.uid())
    );

CREATE POLICY "Admins can manage applications" ON applications
    FOR ALL USING (
        is_user_admin(auth.uid())
    );

-- Step 5: Create simple RLS policies for users
-- Use simple text comparison to avoid type casting issues
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (
        auth.uid()::text = id::text
    );

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (
        auth.uid()::text = id::text
    );

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        is_user_admin(auth.uid())
    );

CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (
        is_user_admin(auth.uid())
    );

CREATE POLICY "Allow authenticated users to insert" ON users
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Step 6: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Step 7: Verify policies
SELECT 'Applications policies:' as info, schemaname, tablename, policyname, permissive, cmd
FROM pg_policies 
WHERE tablename = 'applications'
ORDER BY policyname;

SELECT 'Users policies:' as info, schemaname, tablename, policyname, permissive, cmd
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

COMMIT;

-- ✅ ADMIN ACCESS ISSUES FIXED!
-- This version uses simpler policies to avoid type casting problems
