-- Simple diagnostic to check each table individually

-- Check enrollments table
SELECT 'ENROLLMENTS TABLE' as info, COUNT(*) as count FROM enrollments;

-- Check levels table  
SELECT 'LEVELS TABLE' as info, COUNT(*) as count FROM levels;

-- Check subjects table
SELECT 'SUBJECTS TABLE' as info, COUNT(*) as count FROM subjects;

-- Check teacher_assignments table
SELECT 'TEACHER_ASSIGNMENTS TABLE' as info, COUNT(*) as count FROM teacher_assignments;

-- Check teachers table
SELECT 'TEACHERS TABLE' as info, COUNT(*) as count FROM teachers;

-- Check users table
SELECT 'USERS TABLE' as info, COUNT(*) as count FROM users;
