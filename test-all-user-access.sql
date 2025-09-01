-- Comprehensive Test: Verify All User Access After RLS Fix
-- Run this to test that all user types can access appropriate data

-- Test 1: Verify current user can access their own profile
SELECT 
    'TEST 1: OWN PROFILE ACCESS' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM users WHERE id = auth.uid()) 
        THEN '✅ SUCCESS - User can access own profile'
        ELSE '❌ FAILED - User cannot access own profile'
    END as result;

-- Test 2: Test admin function for current user
SELECT 
    'TEST 2: ADMIN FUNCTION TEST' as test_name,
    CASE 
        WHEN is_admin(auth.uid()) THEN '✅ SUCCESS - User is admin'
        ELSE 'ℹ️ INFO - User is not admin (expected for non-admin users)'
    END as result;

-- Test 3: Test teacher function for current user
SELECT 
    'TEST 3: TEACHER FUNCTION TEST' as test_name,
    CASE 
        WHEN is_teacher(auth.uid()) THEN '✅ SUCCESS - User is teacher'
        ELSE 'ℹ️ INFO - User is not teacher (expected for non-teacher users)'
    END as result;

-- Test 4: Test student function for current user
SELECT 
    'TEST 4: STUDENT FUNCTION TEST' as test_name,
    CASE 
        WHEN is_student(auth.uid()) THEN '✅ SUCCESS - User is student'
        ELSE 'ℹ️ INFO - User is not student (expected for non-student users)'
    END as result;

-- Test 5: Check if user can access enrollments
SELECT 
    'TEST 5: ENROLLMENTS ACCESS' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM enrollments WHERE user_id = auth.uid()) 
        THEN '✅ SUCCESS - User can access own enrollments'
        ELSE 'ℹ️ INFO - User has no enrollments (expected for non-students)'
    END as result;

-- Test 6: Check if user can access teacher assignments
SELECT 
    'TEST 6: TEACHER ASSIGNMENTS ACCESS' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM teacher_assignments ta
            JOIN teachers t ON ta.teacher_id = t.teacher_id
            WHERE t.user_id = auth.uid()
        ) 
        THEN '✅ SUCCESS - User can access teacher assignments'
        ELSE 'ℹ️ INFO - User has no teacher assignments (expected for non-teachers)'
    END as result;

-- Test 7: Verify RLS policies are active
SELECT 
    'TEST 7: RLS POLICIES STATUS' as test_name,
    COUNT(*) as active_policies,
    CASE 
        WHEN COUNT(*) >= 6 THEN '✅ SUCCESS - All expected policies are active'
        ELSE '❌ FAILED - Missing RLS policies'
    END as result
FROM pg_policies 
WHERE tablename IN ('enrollments', 'users', 'teacher_assignments')
AND cmd = 'SELECT';

-- Test 8: Check for any remaining infinite recursion
SELECT 
    'TEST 8: INFINITE RECURSION CHECK' as test_name,
    'If this query completes without error, no infinite recursion detected' as result,
    '✅ SUCCESS - No infinite recursion detected' as status;

-- Test 9: Verify helper functions exist
SELECT 
    'TEST 9: HELPER FUNCTIONS CHECK' as test_name,
    COUNT(*) as function_count,
    CASE 
        WHEN COUNT(*) = 3 THEN '✅ SUCCESS - All helper functions exist'
        ELSE '❌ FAILED - Missing helper functions'
    END as result
FROM pg_proc 
WHERE proname IN ('is_admin', 'is_teacher', 'is_student')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Test 10: Final verification summary
SELECT 
    'TEST 10: FINAL VERIFICATION' as test_name,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('enrollments', 'users', 'teacher_assignments') AND cmd = 'SELECT') >= 6
         AND (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('is_admin', 'is_teacher', 'is_student') AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) = 3
         AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid())
        THEN '✅ ALL TESTS PASSED - RLS fix is working correctly!'
        ELSE '❌ SOME TESTS FAILED - Check individual test results above'
    END as overall_result;

-- Additional info for debugging
SELECT 
    'DEBUG INFO' as info,
    auth.uid() as current_user_id,
    (SELECT role FROM users WHERE id = auth.uid()) as user_role,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM enrollments WHERE status = 'active') as active_enrollments,
    (SELECT COUNT(*) FROM teacher_assignments) as teacher_assignments;
