-- Simple Admin Fix for Users Table
-- This script will temporarily disable RLS and then re-enable it with proper admin permissions

-- Step 1: Temporarily disable RLS to allow admin operations
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Wait a moment for the change to take effect
SELECT 'RLS disabled on users table' as status;

-- Step 3: Re-enable RLS with proper policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop any existing restrictive policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "admin_full_access" ON users;
DROP POLICY IF EXISTS "user_self_access" ON users;

-- Step 5: Create simple, permissive policies for admins with proper type casting
CREATE POLICY "admin_full_access" ON users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Step 6: Create policy for users to access their own profile with proper type casting
CREATE POLICY "user_self_access" ON users
    FOR ALL
    USING (auth.uid()::text = id::text)
    WITH CHECK (auth.uid()::text = id::text);

-- Step 7: Verify the fix
SELECT 
    'RLS policies updated' as status,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'users';

-- Step 8: Test admin access
SELECT 
    'Admin access test' as test_type,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'teacher' THEN 1 END) as teacher_count,
    COUNT(CASE WHEN role = 'student' THEN 1 END) as student_count
FROM users;
