-- Test Server-Side Subjects Query
-- This simulates the exact query used by the live classes page

-- Test 1: Direct query (what the page does)
SELECT 
    'SERVER QUERY TEST' as info,
    subject_id,
    name,
    description
FROM subjects
ORDER BY name;

-- Test 2: Check if there are any RLS policies
SELECT 
    'RLS POLICIES ON SUBJECTS' as info,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'subjects';

-- Test 3: Check RLS status
SELECT 
    'RLS STATUS' as info,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'subjects';

-- Test 4: Test with auth context (simulate authenticated user)
-- This will show what an authenticated user sees
SELECT 
    'AUTHENTICATED USER VIEW' as info,
    subject_id,
    name,
    description
FROM subjects
ORDER BY name;

-- Test 5: Check if any subjects have specific conditions
SELECT 
    'SUBJECTS WITH CONDITIONS' as info,
    subject_id,
    name,
    description,
    created_at
FROM subjects
WHERE name IN ('Biology', 'ICT', 'Mathematics')
ORDER BY name;
