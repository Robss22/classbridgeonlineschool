-- Debug script to understand teacher data structure
-- Run these queries in your Supabase SQL editor

-- 1. Check users table for teachers
SELECT id, email, full_name, role, status 
FROM users 
WHERE role = 'teacher';

-- 2. Check teachers table
SELECT teacher_id, user_id, bio, program_id 
FROM teachers;

-- 3. Check if there are any users with role 'teacher' that don't have corresponding entries in teachers table
SELECT u.id, u.email, u.full_name, u.role, t.teacher_id
FROM users u
LEFT JOIN teachers t ON u.id = t.user_id
WHERE u.role = 'teacher';

-- 4. Check the teachers_with_users view definition (if possible)
-- This might not work depending on your permissions, but worth trying
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'teachers_with_users';

-- 5. Manual join to see what the view should return
SELECT 
    t.teacher_id,
    t.user_id,
    t.bio,
    t.program_id,
    u.email,
    u.full_name,
    u.first_name,
    u.last_name,
    u.phone,
    u.status,
    u.role
FROM teachers t
INNER JOIN users u ON t.user_id = u.id
WHERE u.role = 'teacher'; 