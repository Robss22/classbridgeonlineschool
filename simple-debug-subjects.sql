-- Simple Debug Script - Run each section separately

-- 1. Basic subjects query
SELECT 
    'BASIC SUBJECTS QUERY' as info,
    subject_id,
    name,
    description
FROM subjects;

-- 2. Count subjects
SELECT 
    'SUBJECT COUNT' as info,
    COUNT(*) as total_subjects
FROM subjects;

-- 3. Check if table exists and has data
SELECT 
    'TABLE INFO' as info,
    COUNT(*) as row_count
FROM information_schema.tables 
WHERE table_name = 'subjects';

-- 4. Check RLS status
SELECT 
    'RLS STATUS' as info,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'subjects';

-- 5. Check for any policies
SELECT 
    'POLICIES COUNT' as info,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'subjects';
