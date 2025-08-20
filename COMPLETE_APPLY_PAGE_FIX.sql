-- COMPLETE FIX FOR APPLY PAGE APPLICATIONS
-- This script fixes both RLS policies and ensures correct table structure
-- Run this in your Supabase SQL Editor

BEGIN;

-- =============================================
-- STEP 1: Fix Applications Table Structure
-- =============================================

-- Add missing columns if they don't exist
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS parent_email TEXT,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to set default values for new columns
UPDATE applications 
SET 
  parent_email = COALESCE(parent_email, ''),
  submitted_at = COALESCE(submitted_at, NOW()),
  updated_at = COALESCE(updated_at, NOW())
WHERE parent_email IS NULL OR submitted_at IS NULL OR updated_at IS NULL;

-- =============================================
-- STEP 2: Drop All Existing RLS Policies
-- =============================================

-- Drop all existing policies on applications table
DROP POLICY IF EXISTS "Admins can view all applications" ON applications;
DROP POLICY IF EXISTS "Admins can manage applications" ON applications;
DROP POLICY IF EXISTS "Admin only - view applications" ON applications;
DROP POLICY IF EXISTS "Admin only - create applications" ON applications;
DROP POLICY IF EXISTS "Admin only - update applications" ON applications;
DROP POLICY IF EXISTS "Admin only - delete applications" ON applications;
DROP POLICY IF EXISTS "Users can view own applications" ON applications;
DROP POLICY IF EXISTS "Users can create applications" ON applications;
DROP POLICY IF EXISTS "Users can update own applications" ON applications;
DROP POLICY IF EXISTS "Users can delete own applications" ON applications;
DROP POLICY IF EXISTS "Allow anonymous applications" ON applications;
DROP POLICY IF EXISTS "Allow applications submission" ON applications;

-- =============================================
-- STEP 3: Create New RLS Policies
-- =============================================

-- Policy 1: Allow ANYONE to submit applications (for apply page)
CREATE POLICY "Allow applications submission" ON applications
    FOR INSERT 
    TO public
    WITH CHECK (true);

-- Policy 2: Allow admins to view all applications
CREATE POLICY "Admins can view applications" ON applications
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Policy 3: Allow admins to update applications
CREATE POLICY "Admins can update applications" ON applications
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Policy 4: Allow admins to delete applications
CREATE POLICY "Admins can delete applications" ON applications
    FOR DELETE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- =============================================
-- STEP 4: Ensure RLS is Enabled
-- =============================================

-- Make sure RLS is enabled on applications table
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 5: Verify the Fix
-- =============================================

-- Check that policies were created successfully
SELECT 'Applications policies:' as info, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'applications'
ORDER BY policyname;

-- Check RLS status
SELECT 'RLS Status:' as info, schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'applications';

-- Check table structure
SELECT 'Table structure:' as info, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'applications' 
ORDER BY ordinal_position;

COMMIT;

-- ✅ APPLY PAGE APPLICATIONS COMPLETELY FIXED!
-- 
-- 1. ✅ Table structure updated with correct columns
-- 2. ✅ Anonymous users can now submit applications
-- 3. ✅ Admins can view, update, and delete all applications
-- 4. ✅ RLS is properly configured for security
--
-- Test:
-- - Visit /apply and submit an application (should work now)
-- - Visit /admin/applications to see submitted applications (admin only)
--
-- Note: The form should now work because:
-- - RLS allows anonymous INSERT operations
-- - Table has the correct column structure
-- - All required columns are present
