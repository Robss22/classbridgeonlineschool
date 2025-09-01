-- Debug script to check teacher assignment issues
-- Run this in your Supabase SQL Editor to diagnose the problem

-- 1. Check all users with role 'teacher'
SELECT 
    'USERS TABLE' as source,
    id as user_id,
    email,
    full_name,
    role,
    status
FROM users 
WHERE role = 'teacher'
ORDER BY full_name;

-- 2. Check all records in teachers table
SELECT 
    'TEACHERS TABLE' as source,
    teacher_id,
    user_id,
    program_id,
    bio
FROM teachers
ORDER BY teacher_id;

-- 3. Check for teachers without teacher records
SELECT 
    'MISSING TEACHER RECORDS' as issue,
    u.id as user_id,
    u.email,
    u.full_name,
    'This teacher user has no corresponding record in teachers table' as problem
FROM users u
LEFT JOIN teachers t ON u.id = t.user_id
WHERE u.role = 'teacher' AND t.teacher_id IS NULL
ORDER BY u.full_name;

-- 4. Check for orphaned teacher records
SELECT 
    'ORPHANED TEACHER RECORDS' as issue,
    t.teacher_id,
    t.user_id,
    'This teacher record has no corresponding user' as problem
FROM teachers t
LEFT JOIN users u ON t.user_id = u.id
WHERE u.id IS NULL
ORDER BY t.teacher_id;

-- 5. Show the complete picture
SELECT 
    'COMPLETE TEACHER DATA' as summary,
    u.id as user_id,
    u.email,
    u.full_name,
    u.role,
    u.status,
    t.teacher_id,
    CASE 
        WHEN t.teacher_id IS NOT NULL THEN '✅ Has teacher record'
        ELSE '❌ Missing teacher record'
    END as teacher_record_status
FROM users u
LEFT JOIN teachers t ON u.id = t.user_id
WHERE u.role = 'teacher'
ORDER BY u.full_name;
