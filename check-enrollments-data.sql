-- Check enrollments data with correct column names
-- This will help us understand why no students are being displayed

-- Check total enrollments
SELECT 'ENROLLMENTS COUNT' as info, COUNT(*) as count FROM enrollments;

-- Check active enrollments
SELECT 'ACTIVE ENROLLMENTS' as info, COUNT(*) as count 
FROM enrollments WHERE status = 'active';

-- Check enrollments for S4 Mathematics (using correct column names)
SELECT 'ENROLLMENTS FOR S4 MATHEMATICS' as info,
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
JOIN levels l ON e.level_id = l.level_id
JOIN subjects s ON e.subject_id = s.subject_id
WHERE l.name = 'S4' AND s.name = 'Mathematics';

-- Check all active enrollments
SELECT 'ALL ACTIVE ENROLLMENTS' as info,
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
JOIN levels l ON e.level_id = l.level_id
JOIN subjects s ON e.subject_id = s.subject_id
WHERE e.status = 'active'
ORDER BY l.name, s.name, u.full_name;

-- Check what levels exist
SELECT 'AVAILABLE LEVELS' as info,
       level_id,
       name
FROM levels
ORDER BY name;

-- Check what subjects exist
SELECT 'AVAILABLE SUBJECTS' as info,
       subject_id,
       name
FROM subjects
ORDER BY name;

-- Check teacher assignments for rmatovu@classbridge.ac.ug
SELECT 'TEACHER ASSIGNMENTS FOR RMATOVU' as info,
       ta.teacher_id,
       t.user_id,
       u.full_name as teacher_name,
       u.email as teacher_email,
       ta.level_id,
       l.name as level_name,
       ta.subject_id,
       s.name as subject_name
FROM teacher_assignments ta
JOIN teachers t ON ta.teacher_id = t.teacher_id
JOIN users u ON t.user_id = u.id
JOIN levels l ON ta.level_id = l.level_id
JOIN subjects s ON ta.subject_id = s.subject_id
WHERE u.email = 'rmatovu@classbridge.ac.ug';

-- Check if there are any students at all
SELECT 'STUDENTS BY ROLE' as info,
       role,
       COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;

-- Show sample students
SELECT 'SAMPLE STUDENTS' as info,
       id,
       full_name,
       email,
       role
FROM users
WHERE role = 'student'
LIMIT 5;
