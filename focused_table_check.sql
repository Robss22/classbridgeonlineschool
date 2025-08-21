-- Focused Table Check: The 3 tables that actually exist
-- Copy and paste these queries one by one in your Supabase SQL Editor

-- 1. Show live_classes table structure (this is the main table for live classes)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'live_classes'
ORDER BY ordinal_position;

-- 2. Show user_sessions table structure (this tracks user sessions)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_sessions'
ORDER BY ordinal_position;

-- 3. Show session_analytics table structure (this tracks session analytics)
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

-- 7. Check how these tables are related - look for foreign keys
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
WHERE tc.table_name IN ('live_classes', 'user_sessions', 'session_analytics');

-- 8. Check for any columns that might link these tables together
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
)
ORDER BY table_name, column_name;

-- 9. Check if there are any live class sessions currently active
SELECT 
    lc.live_class_id,
    lc.title,
    lc.status,
    lc.scheduled_date,
    lc.start_time,
    lc.end_time,
    COUNT(us.session_id) as active_sessions
FROM live_classes lc
LEFT JOIN user_sessions us ON lc.live_class_id = us.live_class_id
WHERE lc.status = 'ongoing'
GROUP BY lc.live_class_id, lc.title, lc.status, lc.scheduled_date, lc.start_time, lc.end_time;

-- 10. Check RLS policies for all three tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('live_classes', 'user_sessions', 'session_analytics');
