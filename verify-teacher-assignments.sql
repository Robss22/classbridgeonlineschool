-- Verify Teacher Assignments for Live Class Scheduling
-- This script helps verify that teachers are properly assigned to levels and subjects
-- Run this in your Supabase SQL Editor to check the current state

-- 1. Check all teacher assignments
SELECT 
    'ALL TEACHER ASSIGNMENTS' as info,
    ta.teacher_id,
    u.full_name as teacher_name,
    u.email as teacher_email,
    s.name as subject_name,
    l.name as level_name,
    p.name as program_name,
    ta.assigned_at
FROM teacher_assignments ta
JOIN teachers t ON ta.teacher_id = t.teacher_id
JOIN users u ON t.user_id = u.id
JOIN subjects s ON ta.subject_id = s.subject_id
JOIN levels l ON ta.level_id = l.level_id
JOIN programs p ON ta.program_id = p.program_id
ORDER BY u.full_name, s.name, l.name;

-- 2. Check for teachers without assignments
SELECT 
    'TEACHERS WITHOUT ASSIGNMENTS' as issue,
    t.teacher_id,
    u.full_name as teacher_name,
    u.email as teacher_email,
    'This teacher has no assignments' as problem
FROM teachers t
JOIN users u ON t.user_id = u.id
LEFT JOIN teacher_assignments ta ON t.teacher_id = ta.teacher_id
WHERE ta.teacher_id IS NULL
ORDER BY u.full_name;

-- 3. Check for orphaned assignments (teachers that don't exist)
SELECT 
    'ORPHANED ASSIGNMENTS' as issue,
    ta.teacher_id,
    'This assignment references a non-existent teacher' as problem
FROM teacher_assignments ta
LEFT JOIN teachers t ON ta.teacher_id = t.teacher_id
WHERE t.teacher_id IS NULL;

-- 4. Summary by level and subject
SELECT 
    'ASSIGNMENTS BY LEVEL AND SUBJECT' as summary,
    l.name as level_name,
    s.name as subject_name,
    COUNT(ta.teacher_id) as teacher_count,
    STRING_AGG(u.full_name, ', ') as assigned_teachers
FROM levels l
CROSS JOIN subjects s
LEFT JOIN teacher_assignments ta ON l.level_id = ta.level_id AND s.subject_id = ta.subject_id
LEFT JOIN teachers t ON ta.teacher_id = t.teacher_id
LEFT JOIN users u ON t.user_id = u.id
GROUP BY l.level_id, l.name, s.subject_id, s.name
ORDER BY l.name, s.name;

-- 5. Check for duplicate assignments
SELECT 
    'DUPLICATE ASSIGNMENTS' as issue,
    ta.teacher_id,
    ta.subject_id,
    ta.level_id,
    COUNT(*) as assignment_count,
    'This teacher has multiple assignments for the same subject and level' as problem
FROM teacher_assignments ta
GROUP BY ta.teacher_id, ta.subject_id, ta.level_id
HAVING COUNT(*) > 1
ORDER BY ta.teacher_id;

-- 6. Test the exact query used in the frontend
-- Replace 'your-level-id' and 'your-subject-id' with actual UUIDs to test
SELECT 
    'FRONTEND QUERY TEST' as test,
    ta.teacher_id,
    t.teacher_id as teacher_table_id,
    u.id as user_id,
    u.first_name,
    u.last_name,
    u.email,
    ta.subject_id,
    ta.level_id
FROM teacher_assignments ta
JOIN teachers t ON ta.teacher_id = t.teacher_id
JOIN users u ON t.user_id = u.id
WHERE ta.level_id = 'your-level-id'  -- Replace with actual level_id
  AND ta.subject_id = 'your-subject-id'  -- Replace with actual subject_id
ORDER BY u.first_name, u.last_name;

-- 7. Get sample level and subject IDs for testing
SELECT 
    'SAMPLE LEVELS AND SUBJECTS FOR TESTING' as info,
    l.level_id,
    l.name as level_name,
    s.subject_id,
    s.name as subject_name
FROM levels l
CROSS JOIN subjects s
LIMIT 10;

-- 8. Check RLS policies on teacher_assignments table
SELECT 
    'RLS POLICIES ON TEACHER_ASSIGNMENTS' as info,
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies 
WHERE tablename = 'teacher_assignments'
ORDER BY cmd, policyname;

-- ✅ Use this script to verify your teacher assignments are working correctly!
-- 
-- Expected results:
-- 1. All teachers should have assignments (no "TEACHERS WITHOUT ASSIGNMENTS")
-- 2. No orphaned assignments (no "ORPHANED ASSIGNMENTS")
-- 3. No duplicate assignments (no "DUPLICATE ASSIGNMENTS")
-- 4. Each level-subject combination should have at least one teacher assigned
-- 5. RLS policies should allow SELECT operations for authenticated users
