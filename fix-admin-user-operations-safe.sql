-- Fix Admin User Operations (Safe Version)
-- This script updates RLS policies to allow admin users to perform operations on other users
-- Uses helper functions to avoid infinite recursion

BEGIN;

-- Step 1: Create a helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_current_user_admin() 
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- Direct query without triggering RLS
    SELECT role INTO v_role
    FROM public.users
    WHERE id = auth.uid()::text;
    
    RETURN v_role = 'admin';
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop existing restrictive policies
DROP POLICY IF EXISTS "users_update_own_profile" ON users;
DROP POLICY IF EXISTS "users_delete_authenticated" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

-- Step 3: Create new policies that allow admin operations

-- Policy for updating users (allow admins to update any user, users to update themselves)
CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (
        -- Allow users to update their own profile
        (auth.uid()::text) = (id::text)
        OR
        -- Allow admins to update any user
        is_current_user_admin()
    );

-- Policy for deleting users (allow admins to delete any user)
CREATE POLICY "users_delete_policy" ON users
    FOR DELETE USING (
        -- Allow admins to delete any user
        is_current_user_admin()
    );

-- Step 4: Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_current_user_admin() TO authenticated;

-- Step 5: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Step 6: Verify the new policies
SELECT 
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies 
WHERE tablename = 'users' AND cmd IN ('UPDATE', 'DELETE')
ORDER BY cmd, policyname;

-- Step 7: Test admin operations
-- This query should return the current user's role to verify admin access
SELECT 
    'CURRENT USER INFO' as info,
    id,
    email,
    role,
    is_current_user_admin() as is_admin,
    CASE 
        WHEN is_current_user_admin() THEN '✅ Admin - Can perform operations on other users'
        ELSE '❌ Not Admin - Limited to own profile'
    END as admin_status
FROM users 
WHERE id = auth.uid()::text;

COMMIT;

-- ✅ Admin user operations should now work safely!
-- 
-- What this fixes:
-- 1. Admins can now update any user's status (activate/deactivate)
-- 2. Admins can now delete any user
-- 3. Regular users can still only update their own profiles
-- 4. Uses helper function to avoid infinite recursion
-- 5. Maintains security while allowing admin functionality
--
-- Test the deactivate/activate functionality again - it should work now.
