-- Ultra Safe Table Check: No assumptions about column names
-- Copy and paste these queries one by one in your Supabase SQL Editor

-- 1. Show live_classes table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'live_classes'
ORDER BY ordinal_position;

-- 2. Show user_sessions table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_sessions'
ORDER BY ordinal_position;

-- 3. Show session_analytics table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'session_analytics'
ORDER BY ordinal_position;

-- 4. Show sample data from live_classes (first 3 rows)
SELECT * FROM live_classes LIMIT 3;

-- 5. Show sample data from user_sessions (first 3 rows)
SELECT * FROM user_sessions LIMIT 3;

-- 6. Show sample data from session_analytics (first 3 rows)
SELECT * FROM session_analytics LIMIT 3;

-- 7. Check for any columns that might link these tables together
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('live_classes', 'user_sessions', 'session_analytics')
AND (
    column_name LIKE '%live_class%' 
    OR column_name LIKE '%session%'
    OR column_name LIKE '%user%'
    OR column_name LIKE '%id%'
    OR column_name LIKE '%class%'
    OR column_name LIKE '%meeting%'
    OR column_name LIKE '%participant%'
)
ORDER BY table_name, column_name;

-- 8. Check table constraints and foreign keys for live_classes
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
WHERE tc.table_name = 'live_classes';

-- 9. Check foreign keys for user_sessions
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

-- 10. Check foreign keys for session_analytics
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

-- 11. Check RLS policies for all three tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('live_classes', 'user_sessions', 'session_analytics');

-- 12. Check if there are any live class sessions currently active (simple version)
SELECT 
    live_class_id,
    title,
    status,
    scheduled_date,
    start_time,
    end_time
FROM live_classes 
WHERE status = 'ongoing';

-- 13. Check if there are any active user sessions (simple count)
SELECT COUNT(*) as total_sessions FROM user_sessions;

-- 14. Check if there are any active session analytics
SELECT COUNT(*) as total_analytics FROM session_analytics;

-- 15. Check for any other tables that might be related to live classes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name LIKE '%live%' 
    OR table_name LIKE '%class%' 
    OR table_name LIKE '%meeting%'
    OR table_name LIKE '%session%'
    OR table_name LIKE '%participant%'
    OR table_name LIKE '%attendance%'
);
