-- Create Test Users for Different Roles
-- This script creates sample users to test the users management system

BEGIN;

-- Check if test users already exist
SELECT 
    'Checking existing users...' as info,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'teacher' THEN 1 END) as teacher_count,
    COUNT(CASE WHEN role = 'student' THEN 1 END) as student_count
FROM users;

-- Create test admin user (if doesn't exist)
INSERT INTO users (id, email, full_name, role, phone, status)
VALUES (
    gen_random_uuid(),
    'testadmin@classbridge.ac.ug',
    'Test Admin User',
    'admin',
    '+256123456789',
    'active'
) ON CONFLICT (email) DO NOTHING;

-- Create test teacher users (if don't exist)
INSERT INTO users (id, email, full_name, role, phone, status)
VALUES 
    (gen_random_uuid(), 'teacher1@classbridge.ac.ug', 'John Smith', 'teacher', '+256123456790', 'active'),
    (gen_random_uuid(), 'teacher2@classbridge.ac.ug', 'Sarah Johnson', 'teacher', '+256123456791', 'active'),
    (gen_random_uuid(), 'teacher3@classbridge.ac.ug', 'Michael Brown', 'teacher', '+256123456792', 'active')
ON CONFLICT (email) DO NOTHING;

-- Create test student users (if don't exist)
INSERT INTO users (id, email, full_name, role, phone, status)
VALUES 
    (gen_random_uuid(), 'student1@classbridge.ac.ug', 'Alice Wilson', 'student', '+256123456793', 'active'),
    (gen_random_uuid(), 'student2@classbridge.ac.ug', 'Bob Davis', 'student', '+256123456794', 'active'),
    (gen_random_uuid(), 'student3@classbridge.ac.ug', 'Carol Miller', 'student', '+256123456795', 'active'),
    (gen_random_uuid(), 'student4@classbridge.ac.ug', 'David Garcia', 'student', '+256123456796', 'active'),
    (gen_random_uuid(), 'student5@classbridge.ac.ug', 'Emma Taylor', 'student', '+256123456797', 'active')
ON CONFLICT (email) DO NOTHING;

-- Verify the test users were created
SELECT 
    'Test users created successfully!' as info,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'teacher' THEN 1 END) as teacher_count,
    COUNT(CASE WHEN role = 'student' THEN 1 END) as student_count
FROM users;

-- Show all users for verification
SELECT 
    'All Users' as info,
    id,
    email,
    full_name,
    role,
    status,
    created_at
FROM users 
ORDER BY role, created_at;

COMMIT;

-- ✅ Test users created!
-- 
-- Expected Results:
-- - 1+ admin users
-- - 3+ teacher users  
-- - 5+ student users
-- - All users should be visible in the admin interface
--
-- Next Steps:
-- 1. Refresh the users management page
-- 2. Check that all user types are displayed
-- 3. Test CRUD operations on different user types
