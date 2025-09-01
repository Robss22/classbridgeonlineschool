-- Check what levels and subjects are available

-- Check levels table
SELECT 'LEVELS COUNT' as info, COUNT(*) as count FROM levels;

-- Show available levels
SELECT 'AVAILABLE LEVELS' as info,
       level_id,
       name,
       description
FROM levels
ORDER BY name;

-- Check subjects table
SELECT 'SUBJECTS COUNT' as info, COUNT(*) as count FROM subjects;

-- Show available subjects
SELECT 'AVAILABLE SUBJECTS' as info,
       subject_id,
       name
FROM subjects
ORDER BY name;

-- Check teacher assignments to see what combinations exist
SELECT 'TEACHER ASSIGNMENTS' as info,
       ta.assignment_id,
       ta.teacher_id,
       ta.level_id,
       l.name as level_name,
       ta.subject_id,
       s.name as subject_name,
       ta.academic_year
FROM teacher_assignments ta
LEFT JOIN levels l ON ta.level_id = l.level_id
LEFT JOIN subjects s ON ta.subject_id = s.subject_id
ORDER BY l.name, s.name;

-- Check if students have level_id in users table
SELECT 'STUDENTS WITH LEVELS IN USERS' as info,
       COUNT(*) as total_students,
       COUNT(CASE WHEN level_id IS NOT NULL THEN 1 END) as with_level_id,
       COUNT(CASE WHEN level_id IS NULL THEN 1 END) as without_level_id
FROM users
WHERE role = 'student';

-- Show students and their current level_id (if any)
SELECT 'STUDENT LEVEL ASSIGNMENTS' as info,
       id,
       full_name,
       email,
       level_id,
       CASE 
           WHEN level_id IS NOT NULL THEN (SELECT name FROM levels WHERE level_id = users.level_id)
           ELSE 'No level assigned'
       END as level_name
FROM users
WHERE role = 'student'
ORDER BY full_name;
