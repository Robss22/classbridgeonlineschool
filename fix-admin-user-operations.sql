-- Fix Admin User Operations
-- This script updates RLS policies to allow admin users to perform operations on other users

BEGIN;

-- Step 1: Drop existing restrictive policies
DROP POLICY IF EXISTS "users_update_own_profile" ON users;
DROP POLICY IF EXISTS "users_delete_authenticated" ON users;

-- Step 2: Create new policies that allow admin operations

-- Policy for updating users (allow admins to update any user, users to update themselves)
CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (
        -- Allow users to update their own profile
        (auth.uid()::text) = (id::text)
        OR
        -- Allow admins to update any user
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Policy for deleting users (allow admins to delete any user)
CREATE POLICY "users_delete_policy" ON users
    FOR DELETE USING (
        -- Allow admins to delete any user
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Step 3: Verify the new policies
SELECT 
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies 
WHERE tablename = 'users' AND cmd IN ('UPDATE', 'DELETE')
ORDER BY cmd, policyname;

-- Step 4: Test admin operations
-- This query should return the current user's role to verify admin access
SELECT 
    'CURRENT USER INFO' as info,
    id,
    email,
    role,
    CASE 
        WHEN role = 'admin' THEN '✅ Admin - Can perform operations on other users'
        ELSE '❌ Not Admin - Limited to own profile'
    END as admin_status
FROM users 
WHERE id = auth.uid()::text;

COMMIT;

-- ✅ Admin user operations should now work!
-- 
-- What this fixes:
-- 1. Admins can now update any user's status (activate/deactivate)
-- 2. Admins can now delete any user
-- 3. Regular users can still only update their own profiles
-- 4. Maintains security while allowing admin functionality
--
-- Test the deactivate/activate functionality again - it should work now.
