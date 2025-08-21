-- Simple Table Check for Live Classes
-- Copy and paste these queries one by one in your Supabase SQL Editor

-- 1. Check if live_classes table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'live_classes'
) as live_classes_exists;

-- 2. Check if live_class_participants table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'live_class_participants'
) as live_class_participants_exists;

-- 3. Show live_classes table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'live_classes'
ORDER BY ordinal_position;

-- 4. Show live_class_participants table structure (if it exists)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'live_class_participants'
ORDER BY ordinal_position;

-- 5. Show sample data from live_classes
SELECT * FROM live_classes LIMIT 3;

-- 6. Count participants (if table exists)
SELECT COUNT(*) as total_participants FROM live_class_participants;

-- 7. Check for any live class related tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%live%';
