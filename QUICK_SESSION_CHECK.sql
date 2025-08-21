-- Quick Check: What's in user_sessions and session_analytics?
-- Run these to see what data we're working with

-- 1. Quick overview of user_sessions
SELECT 
    COUNT(*) as total_sessions,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(created_at) as earliest_session,
    MAX(created_at) as latest_session
FROM user_sessions;

-- 2. Quick overview of session_analytics
SELECT 
    COUNT(*) as total_analytics,
    COUNT(DISTINCT session_id) as unique_sessions,
    MIN(created_at) as earliest_analytics,
    MAX(created_at) as latest_analytics
FROM session_analytics;

-- 3. Check for any live class related sessions
SELECT 
    session_type,
    COUNT(*) as count
FROM user_sessions 
WHERE session_type IS NOT NULL
GROUP BY session_type;

-- 4. Check if there are any live class references
SELECT 
    column_name,
    table_name
FROM information_schema.columns 
WHERE table_name IN ('user_sessions', 'session_analytics')
AND (
    column_name LIKE '%live%' 
    OR column_name LIKE '%class%' 
    OR column_name LIKE '%meeting%'
    OR column_name LIKE '%participant%'
);

-- 5. Sample of recent sessions
SELECT * FROM user_sessions 
ORDER BY created_at DESC 
LIMIT 5;
