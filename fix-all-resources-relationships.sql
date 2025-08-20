-- Comprehensive Fix for Resources Table Relationships
-- This script checks and fixes ALL relationships in the resources table

-- Step 1: Check current table structure
SELECT '=== RESOURCES TABLE STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'resources'
ORDER BY ordinal_position;

-- Step 2: Check all foreign key constraints
SELECT '=== FOREIGN KEY CONSTRAINTS ===' as info;
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
AND tc.table_name = 'resources';

-- Step 3: Check sample data with all joins
SELECT '=== SAMPLE DATA WITH ALL JOINS ===' as info;
SELECT 
    r.resource_id,
    r.title,
    r.uploaded_by,
    r.program_id,
    r.level_id,
    r.subject_id,
    r.paper_id,
    u.id as user_id,
    u.full_name,
    u.first_name,
    u.last_name,
    u.email,
    p.name as program_name,
    l.name as level_name,
    s.name as subject_name,
    sp.paper_code,
    sp.paper_name
FROM resources r
LEFT JOIN users u ON r.uploaded_by = u.id
LEFT JOIN programs p ON r.program_id = p.program_id
LEFT JOIN levels l ON r.level_id = l.level_id
LEFT JOIN subjects s ON r.subject_id = s.subject_id
LEFT JOIN subject_papers sp ON r.paper_id = sp.paper_id
LIMIT 10;

-- Step 4: Check for orphaned records
SELECT '=== ORPHANED RECORDS CHECK ===' as info;

-- Check resources with non-existent users
SELECT 'Resources with non-existent users:' as check_type, COUNT(*) as count
FROM resources r
LEFT JOIN users u ON r.uploaded_by = u.id
WHERE u.id IS NULL AND r.uploaded_by IS NOT NULL;

-- Check resources with non-existent programs
SELECT 'Resources with non-existent programs:' as check_type, COUNT(*) as count
FROM resources r
LEFT JOIN programs p ON r.program_id = p.program_id
WHERE p.program_id IS NULL AND r.program_id IS NOT NULL;

-- Check resources with non-existent levels
SELECT 'Resources with non-existent levels:' as check_type, COUNT(*) as count
FROM resources r
LEFT JOIN levels l ON r.level_id = l.level_id
WHERE l.level_id IS NULL AND r.level_id IS NOT NULL;

-- Check resources with non-existent subjects
SELECT 'Resources with non-existent subjects:' as check_type, COUNT(*) as count
FROM resources r
LEFT JOIN subjects s ON r.subject_id = s.subject_id
WHERE s.subject_id IS NULL AND r.subject_id IS NOT NULL;

-- Check resources with non-existent papers
SELECT 'Resources with non-existent papers:' as check_type, COUNT(*) as count
FROM resources r
LEFT JOIN subject_papers sp ON r.paper_id = sp.paper_id
WHERE sp.paper_id IS NULL AND r.paper_id IS NOT NULL;

-- Step 5: Add missing foreign key constraints (uncomment if needed)
-- ALTER TABLE resources 
-- ADD CONSTRAINT fk_resources_uploaded_by 
-- FOREIGN KEY (uploaded_by) REFERENCES users(id);

-- ALTER TABLE resources 
-- ADD CONSTRAINT fk_resources_program_id 
-- FOREIGN KEY (program_id) REFERENCES programs(program_id);

-- ALTER TABLE resources 
-- ADD CONSTRAINT fk_resources_level_id 
-- FOREIGN KEY (level_id) REFERENCES levels(level_id);

-- ALTER TABLE resources 
-- ADD CONSTRAINT fk_resources_subject_id 
-- FOREIGN KEY (subject_id) REFERENCES subjects(subject_id);

-- ALTER TABLE resources 
-- ADD CONSTRAINT fk_resources_paper_id 
-- FOREIGN KEY (paper_id) REFERENCES subject_papers(paper_id);

-- Step 6: Check if users have names populated
SELECT '=== USERS NAME CHECK ===' as info;
SELECT 
    COUNT(*) as total_users,
    COUNT(full_name) as users_with_full_name,
    COUNT(first_name) as users_with_first_name,
    COUNT(last_name) as users_with_last_name,
    COUNT(email) as users_with_email
FROM users;

-- Step 7: Show users without names
SELECT '=== USERS WITHOUT NAMES ===' as info;
SELECT 
    id,
    full_name,
    first_name,
    last_name,
    email
FROM users
WHERE (full_name IS NULL OR full_name = '')
  AND (first_name IS NULL OR first_name = '')
  AND (last_name IS NULL OR last_name = '')
LIMIT 10;
