-- Check the actual structure of the enrollments table
-- Run this in your Supabase SQL editor to see what columns actually exist

-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'enrollments'
) as table_exists;

-- Show table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'enrollments'
ORDER BY ordinal_position;

-- Check table constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'enrollments'::regclass;

-- Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'enrollments';

-- Sample data (if any exists)
SELECT * FROM enrollments LIMIT 5;
