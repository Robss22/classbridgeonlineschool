-- Complete Fix for Applications Table RLS and Structure

-- Step 1: Check and fix table structure first
ALTER TABLE applications 
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS curriculum text,
  ADD COLUMN IF NOT EXISTS program_id uuid,
  ADD COLUMN IF NOT EXISTS class text,
  ADD COLUMN IF NOT EXISTS parent_name text,
  ADD COLUMN IF NOT EXISTS parent_contact text,
  ADD COLUMN IF NOT EXISTS parent_email text,
  ADD COLUMN IF NOT EXISTS about_student text,
  ADD COLUMN IF NOT EXISTS consent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS document_url text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Step 2: Temporarily disable RLS
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop all existing policies
DROP POLICY IF EXISTS "Allow anonymous applications" ON applications;
DROP POLICY IF EXISTS "Allow anonymous submissions" ON applications;
DROP POLICY IF EXISTS "Users can view own applications" ON applications;
DROP POLICY IF EXISTS "Users can create applications" ON applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON applications;
DROP POLICY IF EXISTS "Allow applications submission" ON applications;
DROP POLICY IF EXISTS "Admin only - view applications" ON applications;
DROP POLICY IF EXISTS "Admin only - create applications" ON applications;
DROP POLICY IF EXISTS "Admin only - update applications" ON applications;
DROP POLICY IF EXISTS "Admin only - delete applications" ON applications;

-- Step 4: Create essential policies

-- Allow anonymous submissions (most important)
CREATE POLICY "allow_anonymous_submissions" ON applications FOR INSERT
TO public
WITH CHECK (true);

-- Allow anyone to insert (backup policy)
CREATE POLICY "public_insert" ON applications FOR INSERT
TO public
WITH CHECK (true);

-- Allow admins to view all applications
CREATE POLICY "admins_select" ON applications FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id::uuid = auth.uid()::uuid
        AND users.role = 'admin'
    )
);

-- Allow admins to update applications
CREATE POLICY "admins_update" ON applications FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id::uuid = auth.uid()::uuid
        AND users.role = 'admin'
    )
);

-- Step 5: Re-enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Step 6: Grant necessary permissions
GRANT ALL ON applications TO authenticated;
GRANT INSERT ON applications TO anon;

-- Step 7: Verify setup
SELECT 'RLS Status:'::text as info, 
       schemaname, 
       tablename, 
       rowsecurity 
FROM pg_tables 
WHERE tablename = 'applications';

SELECT 'Current Policies:'::text as info, 
       policyname, 
       permissive, 
       roles, 
       cmd 
FROM pg_policies 
WHERE tablename = 'applications'
ORDER BY policyname;

-- Step 8: Check table structure
SELECT column_name, 
       data_type, 
       column_default,
       is_nullable
FROM information_schema.columns 
WHERE table_name = 'applications'
ORDER BY ordinal_position;
