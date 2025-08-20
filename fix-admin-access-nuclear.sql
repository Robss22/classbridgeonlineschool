-- Nuclear Option: Complete RLS Reset for Admin Access
-- This script completely disables RLS temporarily and then re-enables it with clean policies
-- Use this if you're getting policy conflicts or want a completely fresh start

BEGIN;

-- Step 1: Completely disable RLS on both tables to clear all policies
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies (they should be gone now, but just in case)
DROP POLICY IF EXISTS "Admin only - view applications" ON applications;
DROP POLICY IF EXISTS "Admin only - create applications" ON applications;
DROP POLICY IF EXISTS "Admin only - update applications" ON applications;
DROP POLICY IF EXISTS "Admin only - delete applications" ON applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON applications;
DROP POLICY IF EXISTS "Admins can create applications" ON applications;
DROP POLICY IF EXISTS "Admins can update all applications" ON applications;
DROP POLICY IF EXISTS "Admins can delete applications" ON applications;
DROP POLICY IF EXISTS "Users can view own applications" ON applications;
DROP POLICY IF EXISTS "Users can create applications" ON applications;
DROP POLICY IF EXISTS "Users can update own applications" ON applications;
DROP POLICY IF EXISTS "Users can delete own applications" ON applications;

DROP POLICY IF EXISTS "Admin only - view users" ON users;
DROP POLICY IF EXISTS "Admin only - create users" ON users;
DROP POLICY IF EXISTS "Admin only - update users" ON users;
DROP POLICY IF EXISTS "Admin only - delete users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can create users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;
DROP POLICY IF EXISTS "Teachers can view students" ON users;

-- Step 3: Create safe helper function for admin check
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

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION is_user_admin(UUID) TO authenticated;

-- Step 5: Create clean, simple RLS policies for applications
CREATE POLICY "Admins can view all applications" ON applications
    FOR SELECT USING (
        is_user_admin(auth.uid())
    );

CREATE POLICY "Admins can manage applications" ON applications
    FOR ALL USING (
        is_user_admin(auth.uid())
    );

-- Step 6: Create clean, simple RLS policies for users
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

-- Step 7: Re-enable RLS with the new policies
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 8: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Step 9: Verify policies were created successfully
SELECT 'Applications policies:' as info, schemaname, tablename, policyname, permissive, cmd
FROM pg_policies 
WHERE tablename = 'applications'
ORDER BY policyname;

SELECT 'Users policies:' as info, schemaname, tablename, policyname, permissive, cmd
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 10: Verify RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED'
    END as status
FROM pg_tables 
WHERE tablename IN ('applications', 'users')
ORDER BY tablename;

COMMIT;

-- ✅ NUCLEAR OPTION COMPLETED!
-- This approach completely resets RLS and creates clean policies
-- No policy conflicts should occur now
