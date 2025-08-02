-- Temporarily disable RLS on teacher_assignments table for testing
-- This will allow all operations without RLS restrictions

-- Disable RLS on teacher_assignments table
ALTER TABLE teacher_assignments DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'teacher_assignments'; 