-- DEBUG SESSION CREATION ERROR
-- This will help identify why "Error creating session: {}" is happening
-- Run this in your Supabase SQL Editor

-- Step 1: Check if user_sessions table exists and its structure
SELECT '=== TABLE STRUCTURE ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_sessions'
ORDER BY ordinal_position;

-- Step 2: Check RLS status and policies
SELECT '=== RLS STATUS ===' as info;
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED'
    END as status
FROM pg_tables 
WHERE tablename = 'user_sessions';

-- Step 3: Check existing RLS policies
SELECT '=== RLS POLICIES ===' as info;
SELECT 
    policyname, 
    permissive, 
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'user_sessions'
ORDER BY policyname;

-- Step 4: Check if there are any existing sessions
SELECT '=== EXISTING SESSIONS ===' as info;
SELECT COUNT(*) as total_sessions,
       COUNT(CASE WHEN is_active THEN 1 END) as active_sessions
FROM user_sessions;

-- Step 5: Check table permissions
SELECT '=== TABLE PERMISSIONS ===' as info;
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'user_sessions'
ORDER BY grantee, privilege_type;

-- Step 6: Test a simple insert (this will show the actual error)
SELECT '=== TESTING INSERT ===' as info;
-- This will show us the exact error if insert fails
DO $$
BEGIN
    INSERT INTO user_sessions (
        user_id, 
        device_id, 
        device_name, 
        device_type, 
        browser, 
        os, 
        user_agent
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid, -- dummy UUID
        'test-device-123',
        'Test Device',
        'desktop',
        'Test Browser',
        'Test OS',
        'Test User Agent'
    );
    
    RAISE NOTICE '✅ Test insert successful - table is working';
    
    -- Clean up test data
    DELETE FROM user_sessions WHERE device_id = 'test-device-123';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test insert failed: %', SQLERRM;
END $$;
