-- Debug Subjects Issue
-- This script will help identify why only 2 subjects are showing in the live class modal

-- Check all subjects in the database
SELECT 
    'ALL SUBJECTS IN DATABASE' as info,
    subject_id,
    name,
    description,
    created_at
FROM subjects
ORDER BY name;

-- Check the total count
SELECT 
    'SUBJECT COUNT SUMMARY' as info,
    COUNT(*) as total_subjects,
    COUNT(DISTINCT name) as unique_subject_names
FROM subjects;

-- Check if there are any subjects with NULL or empty fields
SELECT 
    'SUBJECTS WITH NULL OR EMPTY FIELDS' as info,
    subject_id,
    name,
    description,
    created_at
FROM subjects
WHERE name IS NULL 
   OR name = ''
ORDER BY name;

-- Check if there are any RLS policies that might be filtering subjects
SELECT 
    'SUBJECTS TABLE POLICIES' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'subjects';

-- Test the exact query that the live classes page uses
SELECT 
    'TESTING LIVE CLASSES PAGE QUERY' as info,
    subject_id,
    name,
    description
FROM subjects
ORDER BY name;

-- Check if subjects table has RLS enabled
SELECT 
    'SUBJECTS TABLE RLS STATUS' as info,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'subjects';

-- Check the actual table structure
SELECT 
    'SUBJECTS TABLE STRUCTURE' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'subjects'
ORDER BY ordinal_position;
