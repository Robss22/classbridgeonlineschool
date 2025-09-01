-- Fix missing teacher records
-- This script creates teacher records for any users with role 'teacher' 
-- who don't have corresponding records in the teachers table

BEGIN;

-- 1. Create teacher records for missing teachers
INSERT INTO teachers (teacher_id, user_id, program_id, bio, created_at)
SELECT 
    gen_random_uuid() as teacher_id,
    u.id as user_id,
    NULL as program_id,
    NULL as bio,
    NOW() as created_at
FROM users u
LEFT JOIN teachers t ON u.id = t.user_id
WHERE u.role = 'teacher' AND t.teacher_id IS NULL;

-- 2. Show the results
SELECT 
    'FIXED TEACHER RECORDS' as result,
    COUNT(*) as records_created
FROM users u
LEFT JOIN teachers t ON u.id = t.user_id
WHERE u.role = 'teacher' AND t.teacher_id IS NULL;

-- 3. Verify all teachers now have records
SELECT 
    'VERIFICATION' as check_type,
    u.id as user_id,
    u.email,
    u.full_name,
    t.teacher_id,
    CASE 
        WHEN t.teacher_id IS NOT NULL THEN '✅ Fixed - Has teacher record'
        ELSE '❌ Still missing teacher record'
    END as status
FROM users u
LEFT JOIN teachers t ON u.id = t.user_id
WHERE u.role = 'teacher'
ORDER BY u.full_name;

COMMIT;

-- ✅ All missing teacher records should now be created!
-- Try assigning subjects to teachers again - the error should be resolved.
