-- Fix enrollments table by populating level_id and subject_id

-- First, let's see what we're working with
SELECT 'CURRENT ENROLLMENTS STATE' as info,
       COUNT(*) as total_enrollments,
       COUNT(CASE WHEN level_id IS NOT NULL THEN 1 END) as with_level_id,
       COUNT(CASE WHEN subject_id IS NOT NULL THEN 1 END) as with_subject_id,
       COUNT(CASE WHEN level_id IS NOT NULL AND subject_id IS NOT NULL THEN 1 END) as with_both
FROM enrollments;

-- Update enrollments to set level_id from users table
UPDATE enrollments 
SET level_id = u.level_id
FROM users u
WHERE enrollments.user_id = u.id 
  AND enrollments.level_id IS NULL 
  AND u.level_id IS NOT NULL;

-- Check what subjects the teacher is assigned to teach
SELECT 'TEACHER ASSIGNMENTS FOR RMATOVU' as info,
       ta.assignment_id,
       ta.teacher_id,
       ta.level_id,
       l.name as level_name,
       ta.subject_id,
       s.name as subject_name,
       ta.academic_year
FROM teacher_assignments ta
JOIN teachers t ON ta.teacher_id = t.teacher_id
JOIN users u ON t.user_id = u.id
LEFT JOIN levels l ON ta.level_id = l.level_id
LEFT JOIN subjects s ON ta.subject_id = s.subject_id
WHERE u.email = 'rmatovu@classbridge.ac.ug';

-- For now, let's assign all students to Mathematics subject (since we know it exists)
-- You can modify this to assign different subjects to different students
UPDATE enrollments 
SET subject_id = 'fa6707f1-d811-4c86-b615-5e5392f41015'  -- Mathematics subject ID
WHERE subject_id IS NULL;

-- Verify the fix worked
SELECT 'ENROLLMENTS AFTER FIX' as info,
       COUNT(*) as total_enrollments,
       COUNT(CASE WHEN level_id IS NOT NULL THEN 1 END) as with_level_id,
       COUNT(CASE WHEN subject_id IS NOT NULL THEN 1 END) as with_subject_id,
       COUNT(CASE WHEN level_id IS NOT NULL AND subject_id IS NOT NULL THEN 1 END) as with_both
FROM enrollments;

-- Show sample enrollments after fix
SELECT 'SAMPLE ENROLLMENTS AFTER FIX' as info,
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
