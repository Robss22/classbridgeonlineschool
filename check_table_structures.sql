-- Check Table Structures for Live Class System
-- Run these queries to see the actual table structures

-- 1. Check if live_classes table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'live_classes'
ORDER BY ordinal_position;

-- 2. Check if live_class_participants table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'live_class_participants'
ORDER BY ordinal_position;

-- 3. Check if the tables actually exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('live_classes', 'live_class_participants');

-- 4. Check sample data from live_classes table
SELECT * FROM live_classes LIMIT 5;

-- 5. Check if live_class_participants has any data
SELECT COUNT(*) as participant_count FROM live_class_participants;

-- 6. Check table constraints and foreign keys
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
WHERE tc.table_name IN ('live_classes', 'live_class_participants');

-- 7. Check RLS policies
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
WHERE tablename IN ('live_classes', 'live_class_participants');

-- 8. Check if there are any views related to live classes
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%live%';

-- 9. Check for any triggers on these tables
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('live_classes', 'live_class_participants');

-- 10. Check table sizes and row counts
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE tablename IN ('live_classes', 'live_class_participants');
