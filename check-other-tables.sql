-- Check if other tables exist

-- Check if enrollments table exists
SELECT 'ENROLLMENTS EXISTS' as info, 
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enrollments') as exists;

-- Check if levels table exists  
SELECT 'LEVELS EXISTS' as info, 
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'levels') as exists;

-- Check if subjects table exists
SELECT 'SUBJECTS EXISTS' as info, 
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subjects') as exists;

-- Check if teacher_assignments table exists
SELECT 'TEACHER_ASSIGNMENTS EXISTS' as info, 
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teacher_assignments') as exists;

-- Check if teachers table exists
SELECT 'TEACHERS EXISTS' as info, 
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teachers') as exists;

-- If levels table exists, show its structure
SELECT 'LEVELS COLUMNS' as info, 
       column_name, 
       data_type 
FROM information_schema.columns 
WHERE table_name = 'levels' 
ORDER BY ordinal_position;

-- If subjects table exists, show its structure
SELECT 'SUBJECTS COLUMNS' as info, 
       column_name, 
       data_type 
FROM information_schema.columns 
WHERE table_name = 'subjects' 
ORDER BY ordinal_position;

-- If teachers table exists, show its structure
SELECT 'TEACHERS COLUMNS' as info, 
       column_name, 
       data_type 
FROM information_schema.columns 
WHERE table_name = 'teachers' 
ORDER BY ordinal_position;

-- If teacher_assignments table exists, show its structure
SELECT 'TEACHER_ASSIGNMENTS COLUMNS' as info, 
       column_name, 
       data_type 
FROM information_schema.columns 
WHERE table_name = 'teacher_assignments' 
ORDER BY ordinal_position;
