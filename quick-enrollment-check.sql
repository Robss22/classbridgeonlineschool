-- Quick check for enrollments data
-- This will help us understand the current state

-- Check if enrollments table has any data
SELECT 'TOTAL ENROLLMENTS' as info, COUNT(*) as count FROM enrollments;

-- Check enrollments by status
SELECT 'ENROLLMENTS BY STATUS' as info, 
       status, 
       COUNT(*) as count 
FROM enrollments 
GROUP BY status;

-- Show all enrollments (if any exist)
SELECT 'ALL ENROLLMENTS' as info,
       e.id,
       e.user_id,
       u.full_name as student_name,
       u.email as student_email,
       e.level_id,
       e.subject_id,
       e.status,
       e.created_at
FROM enrollments e
LEFT JOIN users u ON e.user_id = u.id
ORDER BY e.created_at DESC
LIMIT 10;

-- Check if levels table has data
SELECT 'LEVELS COUNT' as info, COUNT(*) as count FROM levels;

-- Check if subjects table has data  
SELECT 'SUBJECTS COUNT' as info, COUNT(*) as count FROM subjects;

-- Show sample levels
SELECT 'SAMPLE LEVELS' as info,
       level_id,
       name
FROM levels
LIMIT 5;

-- Show sample subjects
SELECT 'SAMPLE SUBJECTS' as info,
       subject_id,
       name
FROM subjects
LIMIT 5;
