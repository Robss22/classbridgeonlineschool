-- Diagnostic Script for Teacher Students View Issue
-- Run this in your Supabase SQL Editor to identify the problem

-- Step 1: Check if teachers exist and have assignments
SELECT 
    'TEACHER ASSIGNMENTS CHECK' as info,
    COUNT(*) as total_assignments,
    COUNT(DISTINCT ta.teacher_id) as unique_teachers,
    COUNT(DISTINCT ta.level_id) as unique_levels,
    COUNT(DISTINCT ta.subject_id) as unique_subjects
FROM teacher_assignments ta;

-- Step 2: Check specific teacher assignments
SELECT 
    'TEACHER ASSIGNMENTS DETAIL' as info,
    ta.teacher_id,
    u.full_name as teacher_name,
    u.email as teacher_email,
    l.name as level_name,
    s.name as subject_name,
    ta.assigned_at
FROM teacher_assignments ta
JOIN teachers t ON ta.teacher_id = t.teacher_id
JOIN users u ON t.user_id = u.id
JOIN levels l ON ta.level_id = l.level_id
JOIN subjects s ON ta.subject_id = s.subject_id
ORDER BY u.full_name, l.name, s.name;

-- Step 3: Check if students are enrolled
SELECT 
    'STUDENT ENROLLMENTS CHECK' as info,
    COUNT(*) as total_enrollments,
    COUNT(DISTINCT e.user_id) as unique_students,
    COUNT(DISTINCT e.level_id) as unique_levels,
    COUNT(DISTINCT e.subject_id) as unique_subjects
FROM enrollments e
WHERE e.status = 'active';

-- Step 4: Check student enrollments by level
SELECT 
    'STUDENT ENROLLMENTS BY LEVEL' as info,
    l.name as level_name,
    COUNT(e.user_id) as student_count,
    STRING_AGG(u.full_name, ', ') as student_names
FROM enrollments e
JOIN users u ON e.user_id = u.id
JOIN levels l ON e.level_id = l.level_id
WHERE e.status = 'active'
GROUP BY l.level_id, l.name
ORDER BY l.name;

-- Step 5: Check RLS policies
SELECT 
    'RLS POLICIES CHECK' as info,
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('enrollments', 'users', 'teacher_assignments')
ORDER BY tablename, policyname;
