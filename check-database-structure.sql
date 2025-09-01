-- Check database structure to understand how students are organized

-- Check if enrollments table exists
SELECT 'ENROLLMENTS EXISTS' as info, 
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enrollments') as exists;

-- Check if levels table exists  
SELECT 'LEVELS EXISTS' as info, 
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'levels') as exists;

-- Check if subjects table exists
SELECT 'SUBJECTS EXISTS' as info, 
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subjects') as exists;

-- Check if teachers table exists
SELECT 'TEACHERS EXISTS' as info, 
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teachers') as exists;

-- Check levels table structure (if it exists)
SELECT 'LEVELS COLUMNS' as info, 
       column_name, 
       data_type 
FROM information_schema.columns 
WHERE table_name = 'levels' 
ORDER BY ordinal_position;

-- Check subjects table structure (if it exists)
SELECT 'SUBJECTS COLUMNS' as info, 
       column_name, 
       data_type 
FROM information_schema.columns 
WHERE table_name = 'subjects' 
ORDER BY ordinal_position;

-- Check teachers table structure (if it exists)
SELECT 'TEACHERS COLUMNS' as info, 
       column_name, 
       data_type 
FROM information_schema.columns 
WHERE table_name = 'teachers' 
ORDER BY ordinal_position;

-- Check what levels exist (if levels table exists)
SELECT 'AVAILABLE LEVELS' as info,
       level_id,
       name
FROM levels
ORDER BY name;

-- Check what subjects exist (if subjects table exists)
SELECT 'AVAILABLE SUBJECTS' as info,
       subject_id,
       name
FROM subjects
ORDER BY name;

-- Check how students are assigned to levels (from users table)
SELECT 'STUDENTS WITH LEVELS' as info,
       id,
       full_name,
       email,
       level_id,
       role
FROM users
WHERE role = 'student' AND level_id IS NOT NULL
ORDER BY full_name;

-- Check teacher assignments for rmatovu@classbridge.ac.ug
SELECT 'TEACHER ASSIGNMENTS FOR RMATOVU' as info,
       ta.assignment_id,
       ta.teacher_id,
       ta.level_id,
       ta.subject_id,
       ta.program_id,
       ta.academic_year
FROM teacher_assignments ta
JOIN teachers t ON ta.teacher_id = t.teacher_id
JOIN users u ON t.user_id = u.id
WHERE u.email = 'rmatovu@classbridge.ac.ug';
