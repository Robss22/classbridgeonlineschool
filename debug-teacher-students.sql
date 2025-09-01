-- DEBUG: Check Teacher Students Data
-- This script will help us understand why students aren't being displayed

-- Step 1: Check teacher assignments
SELECT 
    'TEACHER ASSIGNMENTS' as info,
    COUNT(*) as total_assignments
FROM teacher_assignments;

SELECT 
    'TEACHER ASSIGNMENTS DETAIL' as info,
    ta.teacher_id,
    u.full_name as teacher_name,
    u.email as teacher_email,
    ta.level_id,
    l.name as level_name,
    ta.subject_id,
    s.name as subject_name
FROM teacher_assignments ta
LEFT JOIN users u ON ta.teacher_id = u.id
LEFT JOIN levels l ON ta.level_id = l.id
LEFT JOIN subjects s ON ta.subject_id = s.id
ORDER BY u.full_name, l.name, s.name;

-- Step 2: Check enrollments
SELECT 
    'ENROLLMENTS' as info,
    COUNT(*) as total_enrollments,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_enrollments
FROM enrollments;

SELECT 
    'ENROLLMENTS DETAIL' as info,
    e.user_id,
    u.full_name as student_name,
    u.email as student_email,
    u.role as student_role,
    e.level_id,
    l.name as level_name,
    e.subject_id,
    s.name as subject_name,
    e.status
FROM enrollments e
LEFT JOIN users u ON e.user_id = u.id
LEFT JOIN levels l ON e.level_id = l.id
LEFT JOIN subjects s ON e.subject_id = s.id
WHERE e.status = 'active'
ORDER BY u.full_name, l.name, s.name;

-- Step 3: Check users by role
SELECT 
    'USERS BY ROLE' as info,
    role,
    COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;

-- Step 4: Check specific teacher (rmatovu@classbridge.ac.ug)
SELECT 
    'SPECIFIC TEACHER ASSIGNMENTS' as info,
    u.id as teacher_id,
    u.full_name as teacher_name,
    u.email as teacher_email,
    ta.level_id,
    l.name as level_name,
    ta.subject_id,
    s.name as subject_name
FROM users u
LEFT JOIN teacher_assignments ta ON u.id = ta.teacher_id
LEFT JOIN levels l ON ta.level_id = l.id
LEFT JOIN subjects s ON ta.subject_id = s.id
WHERE u.email = 'rmatovu@classbridge.ac.ug';

-- Step 5: Check students for teacher's assigned levels/subjects
WITH teacher_levels AS (
    SELECT DISTINCT level_id, subject_id
    FROM teacher_assignments ta
    JOIN users u ON ta.teacher_id = u.id
    WHERE u.email = 'rmatovu@classbridge.ac.ug'
)
SELECT 
    'STUDENTS FOR TEACHER' as info,
    e.user_id,
    u.full_name as student_name,
    u.email as student_email,
    e.level_id,
    l.name as level_name,
    e.subject_id,
    s.name as subject_name,
    e.status
FROM enrollments e
JOIN users u ON e.user_id = u.id
JOIN levels l ON e.level_id = l.id
JOIN subjects s ON e.subject_id = s.id
JOIN teacher_levels tl ON e.level_id = tl.level_id AND e.subject_id = tl.subject_id
WHERE e.status = 'active' AND u.role = 'student'
ORDER BY u.full_name, l.name, s.name;

-- Step 6: Check if levels and subjects tables exist and have data
SELECT 
    'LEVELS' as info,
    COUNT(*) as total_levels
FROM levels;

SELECT 
    'SUBJECTS' as info,
    COUNT(*) as total_subjects
FROM subjects;

-- Step 7: Show sample data from all relevant tables
SELECT 
    'SAMPLE LEVELS' as info,
    id,
    name
FROM levels
LIMIT 5;

SELECT 
    'SAMPLE SUBJECTS' as info,
    id,
    name
FROM subjects
LIMIT 5;
