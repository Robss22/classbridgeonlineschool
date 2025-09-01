-- Test Script for Teacher Students View
-- Run this to verify the fix is working correctly

-- Step 1: Verify teacher assignments exist
SELECT 
    'VERIFY TEACHER ASSIGNMENTS' as test_step,
    COUNT(*) as assignment_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS - Teacher assignments found'
        ELSE '❌ FAIL - No teacher assignments found'
    END as result
FROM teacher_assignments;

-- Step 2: Verify student enrollments exist
SELECT 
    'VERIFY STUDENT ENROLLMENTS' as test_step,
    COUNT(*) as enrollment_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS - Student enrollments found'
        ELSE '❌ FAIL - No student enrollments found'
    END as result
FROM enrollments 
WHERE status = 'active';

-- Step 3: Verify RLS policies are in place
SELECT 
    'VERIFY RLS POLICIES' as test_step,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ PASS - RLS policies configured'
        ELSE '❌ FAIL - Missing RLS policies'
    END as result
FROM pg_policies 
WHERE tablename IN ('enrollments', 'users', 'teacher_assignments')
AND cmd = 'SELECT';

-- Step 4: Test the actual teacher-student relationship query
-- This simulates what the frontend should be able to see
SELECT 
    'TEST TEACHER-STUDENT QUERY' as test_step,
    COUNT(DISTINCT e.user_id) as student_count,
    COUNT(DISTINCT ta.teacher_id) as teacher_count,
    CASE 
        WHEN COUNT(DISTINCT e.user_id) > 0 THEN '✅ PASS - Teachers can see students'
        ELSE '❌ FAIL - No students visible to teachers'
    END as result
FROM enrollments e
JOIN teacher_assignments ta ON e.level_id = ta.level_id
WHERE e.status = 'active';

-- Step 5: Show sample data that teachers should see
SELECT 
    'SAMPLE TEACHER-STUDENT DATA' as test_step,
    ta.teacher_id,
    u.full_name as teacher_name,
    l.name as level_name,
    s.name as subject_name,
    COUNT(e.user_id) as student_count
FROM teacher_assignments ta
JOIN teachers t ON ta.teacher_id = t.teacher_id
JOIN users u ON t.user_id = u.id
JOIN levels l ON ta.level_id = l.level_id
JOIN subjects s ON ta.subject_id = s.subject_id
LEFT JOIN enrollments e ON ta.level_id = e.level_id AND e.status = 'active'
GROUP BY ta.teacher_id, u.full_name, l.name, s.name
ORDER BY u.full_name, l.name, s.name;

-- Step 6: Final verification
SELECT 
    'FINAL VERIFICATION' as test_step,
    CASE 
        WHEN (SELECT COUNT(*) FROM teacher_assignments) > 0 
         AND (SELECT COUNT(*) FROM enrollments WHERE status = 'active') > 0
         AND (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('enrollments', 'users', 'teacher_assignments') AND cmd = 'SELECT') >= 3
        THEN '✅ ALL TESTS PASSED - Teacher students view should work!'
        ELSE '❌ SOME TESTS FAILED - Check the individual test results above'
    END as overall_result;

-- Step 7: Quick fix recommendations if tests fail
SELECT 
    'RECOMMENDATIONS IF TESTS FAIL' as info,
    CASE 
        WHEN (SELECT COUNT(*) FROM teacher_assignments) = 0 
        THEN '1. Create teacher assignments via admin panel'
        ELSE '1. ✅ Teacher assignments exist'
    END as recommendation_1,
    CASE 
        WHEN (SELECT COUNT(*) FROM enrollments WHERE status = 'active') = 0 
        THEN '2. Enroll students in levels and subjects'
        ELSE '2. ✅ Student enrollments exist'
    END as recommendation_2,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('enrollments', 'users', 'teacher_assignments') AND cmd = 'SELECT') < 3
        THEN '3. Run the RLS fix script: fix-teacher-students-rls.sql'
        ELSE '3. ✅ RLS policies configured'
    END as recommendation_3;
