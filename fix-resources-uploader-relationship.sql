-- Fix Resources Uploader Relationship
-- This script checks and fixes the relationship between resources.uploaded_by and users table

-- Step 1: Check current table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'resources'
AND column_name = 'uploaded_by';

-- Step 2: Check if there's a foreign key constraint
SELECT 
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
AND tc.table_name = 'resources'
AND kcu.column_name = 'uploaded_by';

-- Step 3: Check sample data to see what's in uploaded_by
SELECT 
    resource_id,
    title,
    uploaded_by,
    CASE 
        WHEN u.id IS NOT NULL THEN 'User exists in users table'
        WHEN t.teacher_id IS NOT NULL THEN 'User exists in teachers_with_users table'
        ELSE 'User NOT found in either table'
    END as user_status,
    u.full_name as user_full_name,
    u.email as user_email,
    t.full_name as teacher_full_name,
    t.email as teacher_email
FROM resources r
LEFT JOIN users u ON r.uploaded_by = u.auth_user_id
LEFT JOIN teachers_with_users t ON r.uploaded_by = t.auth_user_id
LIMIT 10;

-- Step 4: Add foreign key constraint if it doesn't exist
-- Note: The resources table has relationships to both users.auth_user_id and teachers_with_users.auth_user_id
-- This is a complex relationship that allows resources to be uploaded by either regular users or teachers

-- To add constraints (uncomment if needed):
-- ALTER TABLE resources 
-- ADD CONSTRAINT fk_resources_uploaded_by_users 
-- FOREIGN KEY (uploaded_by) REFERENCES users(auth_user_id);

-- ALTER TABLE resources 
-- ADD CONSTRAINT fk_resources_uploaded_by_teachers 
-- FOREIGN KEY (uploaded_by) REFERENCES teachers_with_users(auth_user_id);

-- Step 5: Check if there are any orphaned resources (uploaded_by values that don't exist in either table)
SELECT 
    r.resource_id,
    r.title,
    r.uploaded_by
FROM resources r
LEFT JOIN users u ON r.uploaded_by = u.auth_user_id
LEFT JOIN teachers_with_users t ON r.uploaded_by = t.auth_user_id
WHERE u.id IS NULL AND t.teacher_id IS NULL
AND r.uploaded_by IS NOT NULL;

-- Step 6: Update the query to use proper join syntax
-- The current query should work, but let's verify the data structure
SELECT 
    r.resource_id,
    r.title,
    r.uploaded_by,
    u.id as user_id,
    u.full_name as user_full_name,
    u.email as user_email,
    t.teacher_id,
    t.full_name as teacher_full_name,
    t.email as teacher_email
FROM resources r
LEFT JOIN users u ON r.uploaded_by = u.auth_user_id
LEFT JOIN teachers_with_users t ON r.uploaded_by = t.auth_user_id
LIMIT 5;
