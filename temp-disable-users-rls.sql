-- Temporary Fix: Disable RLS on Users Table
-- This will immediately fix the infinite recursion issue
-- WARNING: This removes security restrictions temporarily
-- Run the fix-users-rls-infinite-recursion.sql script after this to restore security

BEGIN;

-- Disable RLS on users table to stop infinite recursion
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

COMMIT;

-- IMPORTANT: After running this, your application should work
-- But you should run fix-users-rls-infinite-recursion.sql to restore security
