-- Check Subjects RLS Policies
-- This will show us exactly what policies are filtering the subjects

-- Check all policies on subjects table
SELECT 
    'SUBJECTS RLS POLICIES' as info,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'subjects'
ORDER BY policyname;

-- Check if there are any policies that might be filtering by user role
SELECT 
    'POLICIES BY COMMAND' as info,
    cmd,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ') as policy_names
FROM pg_policies 
WHERE tablename = 'subjects'
GROUP BY cmd;

-- Check the actual policy conditions
SELECT 
    'POLICY CONDITIONS' as info,
    policyname,
    qual as where_condition,
    with_check as check_condition
FROM pg_policies 
WHERE tablename = 'subjects'
  AND (qual IS NOT NULL OR with_check IS NOT NULL);
