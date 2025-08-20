-- QUICK SESSION CHECK
-- Simple diagnostic to identify the session creation problem

-- Check table structure
SELECT 'Table Structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_sessions'
ORDER BY ordinal_position;

-- Check RLS status
SELECT 'RLS Status:' as info;
SELECT 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'ENABLED' 
        ELSE 'DISABLED' 
    END as status
FROM pg_tables 
WHERE tablename = 'user_sessions';

-- Check RLS policies
SELECT 'RLS Policies:' as info;
SELECT policyname, cmd, permissive
FROM pg_policies 
WHERE tablename = 'user_sessions';

-- Check permissions
SELECT 'Permissions:' as info;
SELECT grantee, privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'user_sessions';

-- Test insert with error details
SELECT 'Testing Insert:' as info;
INSERT INTO user_sessions (
    user_id, 
    device_id, 
    device_name, 
    device_type, 
    browser, 
    os, 
    user_agent
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'test-device-123',
    'Test Device',
    'desktop',
    'Test Browser',
    'Test OS',
    'Test User Agent'
);

-- Clean up test data
DELETE FROM user_sessions WHERE device_id = 'test-device-123';
