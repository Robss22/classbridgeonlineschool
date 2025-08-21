-- Fixed Table Check: user_sessions and session_analytics
-- These queries won't fail due to missing columns
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

-- 3. Show ALL columns in user_sessions table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_sessions'
ORDER BY ordinal_position;

-- 4. Show ALL columns in session_analytics table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'session_analytics'
ORDER BY ordinal_position;

-- 5. Show sample data from user_sessions (first 3 rows)
SELECT * FROM user_sessions LIMIT 3;

-- 6. Show sample data from session_analytics (first 3 rows)
SELECT * FROM session_analytics LIMIT 3;

-- 7. Check for any live class related columns in user_sessions
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_sessions'
AND (
    column_name LIKE '%live%' 
    OR column_name LIKE '%class%' 
    OR column_name LIKE '%meeting%'
    OR column_name LIKE '%participant%'
    OR column_name LIKE '%session%'
);

-- 8. Check for any live class related columns in session_analytics
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'session_analytics'
AND (
    column_name LIKE '%live%' 
    OR column_name LIKE '%class%' 
    OR column_name LIKE '%meeting%'
    OR column_name LIKE '%participant%'
    OR column_name LIKE '%session%'
);

-- 9. Check table constraints and foreign keys for user_sessions
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
WHERE tc.table_name = 'user_sessions';

-- 10. Check table constraints and foreign keys for session_analytics
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
WHERE tc.table_name = 'session_analytics';

-- 11. Check RLS policies for user_sessions
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
WHERE tablename = 'user_sessions';

-- 12. Check RLS policies for session_analytics
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
WHERE tablename = 'session_analytics';

-- 13. Check if live_classes table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'live_classes'
) as live_classes_exists;

-- 14. If live_classes exists, show its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'live_classes'
ORDER BY ordinal_position;

-- 15. Check for any other tables that might be related to live classes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name LIKE '%live%' 
    OR table_name LIKE '%class%' 
    OR table_name LIKE '%meeting%'
    OR table_name LIKE '%session%'
);
