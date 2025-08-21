-- Check Actual Tables: user_sessions and session_analytics
-- Copy and paste these queries one by one in your Supabase SQL Editor

-- 1. Check if user_sessions table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_sessions'
) as user_sessions_exists;

-- 2. Check if session_analytics table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'session_analytics'
) as session_analytics_exists;

-- 3. Show user_sessions table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_sessions'
ORDER BY ordinal_position;

-- 4. Show session_analytics table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'session_analytics'
ORDER BY ordinal_position;

-- 5. Show sample data from user_sessions
SELECT * FROM user_sessions LIMIT 3;

-- 6. Show sample data from session_analytics
SELECT * FROM session_analytics LIMIT 3;

-- 7. Check if these tables have any live class related data
SELECT DISTINCT session_type FROM user_sessions WHERE session_type IS NOT NULL;

-- 8. Check for any live class related columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name IN ('user_sessions', 'session_analytics')
AND column_name LIKE '%live%' OR column_name LIKE '%class%';

-- 9. Check table constraints and foreign keys
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('user_sessions', 'session_analytics');

-- 10. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('user_sessions', 'session_analytics');

-- 11. Check for any live class related tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%live%';

-- 12. Check if live_classes table exists and its structure
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'live_classes'
) as live_classes_exists;

-- 13. If live_classes exists, show its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'live_classes'
ORDER BY ordinal_position;
