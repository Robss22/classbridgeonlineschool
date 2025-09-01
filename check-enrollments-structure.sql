-- Check enrollments table structure and relationships

-- Check enrollments table structure
SELECT 'ENROLLMENTS COLUMNS' as info, 
       column_name, 
       data_type,
       is_nullable
FROM information_schema.columns 
WHERE table_name = 'enrollments' 
ORDER BY ordinal_position;

-- Check enrollments table data
SELECT 'ENROLLMENTS COUNT' as info, COUNT(*) as count FROM enrollments;

-- Check enrollments by status
SELECT 'ENROLLMENTS BY STATUS' as info, 
       status, 
       COUNT(*) as count 
FROM enrollments 
GROUP BY status;

-- Check sample enrollments
SELECT 'SAMPLE ENROLLMENTS' as info,
       e.id,
       e.user_id,
       e.level_id,
       e.subject_id,
       e.status,
       e.created_at
FROM enrollments e
LIMIT 5;

-- Check if enrollments have level_id and subject_id
SELECT 'ENROLLMENTS WITH LEVELS AND SUBJECTS' as info,
       COUNT(*) as total_enrollments,
       COUNT(CASE WHEN level_id IS NOT NULL THEN 1 END) as with_level_id,
       COUNT(CASE WHEN subject_id IS NOT NULL THEN 1 END) as with_subject_id,
       COUNT(CASE WHEN level_id IS NOT NULL AND subject_id IS NOT NULL THEN 1 END) as with_both
FROM enrollments;

-- Check foreign key constraints
SELECT 'FOREIGN KEY CONSTRAINTS' as info,
       tc.constraint_name,
       tc.table_name,
       kcu.column_name,
       ccu.table_name AS foreign_table_name,
       ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'enrollments';

-- Try to join enrollments with users, levels, and subjects
SELECT 'ENROLLMENTS JOIN TEST' as info,
       e.id as enrollment_id,
       e.user_id,
       u.full_name as student_name,
       u.email as student_email,
       e.level_id,
       l.name as level_name,
       e.subject_id,
       s.name as subject_name,
       e.status
FROM enrollments e
LEFT JOIN users u ON e.user_id = u.id
LEFT JOIN levels l ON e.level_id = l.level_id
LEFT JOIN subjects s ON e.subject_id = s.subject_id
LIMIT 5;
