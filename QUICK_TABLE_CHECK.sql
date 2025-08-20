-- QUICK TABLE STRUCTURE CHECK
-- Run this to see the actual column names in your tables

-- Check enrollments table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'enrollments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check applications table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'applications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check live_classes table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'live_classes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check resources table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'resources' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check assessments table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'assessments' 
AND table_schema = 'public'
ORDER BY ordinal_position;
