-- CLEANUP DUPLICATE POLICIES
-- This script removes duplicate policies and keeps only the working ones

BEGIN;

-- Step 1: Drop the duplicate/old policies
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

-- Step 2: Keep only the working policies we created
-- (These should remain: users_delete_authenticated, users_insert_authenticated, 
-- users_select_all_authenticated, users_update_own_profile)

-- Step 3: Verify the final policy setup
SELECT 
    policyname,
    cmd,
    permissive,
    CASE 
        WHEN policyname IN ('users_select_all_authenticated', 'users_insert_authenticated', 
                           'users_update_own_profile', 'users_delete_authenticated') 
        THEN '✅ KEEPING'
        ELSE '❌ SHOULD BE DROPPED'
    END as status
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 4: Test that users are accessible
SELECT 
    'FINAL TEST - Users Accessible' as info,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'teacher' THEN 1 END) as teacher_count,
    COUNT(CASE WHEN role = 'student' THEN 1 END) as student_count
FROM users;

-- Step 5: Refresh schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ✅ CLEANUP COMPLETE!
-- 
-- What this does:
-- 1. Removes duplicate policies that might cause conflicts
-- 2. Keeps only the 4 working policies we created
-- 3. Verifies that users are still accessible
-- 4. Refreshes the schema cache
--
-- Expected Result:
-- - Only 4 policies should remain
-- - All users should be accessible
-- - Login should work without errors
--
-- Next Steps:
-- 1. Run this cleanup script
-- 2. Try logging in again
-- 3. The user-friendly error should be gone
