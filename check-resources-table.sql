-- Check resources table structure and data

-- Check if resources table exists
SELECT 'RESOURCES TABLE EXISTS' as info,
       EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' 
         AND table_name = 'resources'
       ) as table_exists;

-- Check resources table structure
SELECT 'RESOURCES COLUMNS' as info,
       column_name,
       data_type,
       is_nullable
FROM information_schema.columns
WHERE table_name = 'resources'
ORDER BY ordinal_position;

-- Check if there are any resources in the table
SELECT 'RESOURCES COUNT' as info,
       COUNT(*) as total_resources
FROM resources;

-- Check sample resources data
SELECT 'SAMPLE RESOURCES' as info,
       id,
       title,
       subject_id,
       program_id,
       created_at
FROM resources
LIMIT 5;

-- Check if there are resources for the specific program_id
SELECT 'PROGRAM RESOURCES' as info,
       COUNT(*) as resources_for_program
FROM resources
WHERE program_id = '0e5fac6d-a1cc-4666-b82c-8cf1c47ec385';

-- Check if there are any resources at all
SELECT 'ANY RESOURCES' as info,
       COUNT(*) as total,
       COUNT(DISTINCT program_id) as programs_with_resources,
       COUNT(DISTINCT subject_id) as subjects_with_resources
FROM resources;
