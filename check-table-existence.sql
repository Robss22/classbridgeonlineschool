-- Check if tables exist and their structure

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

-- Check users table structure
SELECT 'USERS COLUMNS' as info, 
       column_name, 
       data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Try to count enrollments with error handling
DO $$
BEGIN
    RAISE NOTICE 'ENROLLMENTS COUNT: %', (SELECT COUNT(*) FROM enrollments);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ENROLLMENTS TABLE ERROR: %', SQLERRM;
END $$;

-- Try to count levels with error handling  
DO $$
BEGIN
    RAISE NOTICE 'LEVELS COUNT: %', (SELECT COUNT(*) FROM levels);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'LEVELS TABLE ERROR: %', SQLERRM;
END $$;

-- Try to count subjects with error handling
DO $$
BEGIN
    RAISE NOTICE 'SUBJECTS COUNT: %', (SELECT COUNT(*) FROM subjects);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'SUBJECTS TABLE ERROR: %', SQLERRM;
END $$;
