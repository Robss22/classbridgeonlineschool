-- Check Data Types and UUID/Text Compatibility
-- Run this to understand the data types in your tables

-- Step 1: Check column data types for key tables
SELECT 
    'ENROLLMENTS TABLE COLUMNS' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'enrollments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'USERS TABLE COLUMNS' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'TEACHERS TABLE COLUMNS' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'teachers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'TEACHER_ASSIGNMENTS TABLE COLUMNS' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'teacher_assignments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check auth.uid() type
SELECT 
    'AUTH.UID() TYPE CHECK' as info,
    pg_typeof(auth.uid()) as auth_uid_type;

-- Step 3: Check sample data types
SELECT 
    'SAMPLE USER_ID TYPE' as info,
    pg_typeof(user_id) as user_id_type
FROM enrollments 
LIMIT 1;

SELECT 
    'SAMPLE TEACHER USER_ID TYPE' as info,
    pg_typeof(user_id) as teacher_user_id_type
FROM teachers 
LIMIT 1;

-- Step 4: Test UUID comparisons
SELECT 
    'UUID COMPARISON TEST' as info,
    'Testing direct UUID comparison' as test_type;

-- This should work if both are UUIDs
SELECT 
    'DIRECT UUID COMPARISON' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM teachers t 
            WHERE t.user_id = auth.uid()
            LIMIT 1
        ) THEN '✅ SUCCESS - Direct UUID comparison works'
        ELSE '❌ FAILED - Direct UUID comparison failed'
    END as result;

-- Step 5: Check if there are any text columns that should be UUID
SELECT 
    'POTENTIAL TEXT/UUID MISMATCHES' as info,
    table_name,
    column_name,
    data_type,
    'Consider changing to UUID if storing UUID values' as recommendation
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name IN ('enrollments', 'users', 'teachers', 'teacher_assignments')
AND column_name LIKE '%id%'
AND data_type = 'text'
ORDER BY table_name, column_name;

-- Step 6: Show current RLS policies and their syntax
SELECT 
    'CURRENT RLS POLICIES' as info,
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    qual as policy_condition
FROM pg_policies 
WHERE tablename IN ('enrollments', 'users', 'teacher_assignments')
ORDER BY tablename, policyname;
