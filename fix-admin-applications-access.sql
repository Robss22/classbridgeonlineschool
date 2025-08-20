-- Fix Admin Applications Access Issue
-- This script resolves the "No applications found" problem by fixing the RLS policy

BEGIN;

-- Step 1: Drop the problematic RLS policy that causes circular dependency
DROP POLICY IF EXISTS "Admin only - view applications" ON applications;

-- Step 2: Create safe helper function to check if user is admin (if it doesn't exist)
CREATE OR REPLACE FUNCTION is_user_admin(p_user_id UUID) 
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- Direct query without triggering RLS
    SELECT role INTO v_role
    FROM public.users
    WHERE id = p_user_id::text;
    
    RETURN v_role = 'admin';
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant permissions to the helper function
GRANT EXECUTE ON FUNCTION is_user_admin(UUID) TO authenticated;

-- Step 4: Create new, safe RLS policy for applications
CREATE POLICY "Admins can view all applications" ON applications
    FOR SELECT USING (
        is_user_admin(auth.uid())
    );

-- Step 5: Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Step 6: Verify the fix
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    cmd
FROM pg_policies 
WHERE tablename = 'applications'
ORDER BY policyname;

COMMIT;

-- ✅ ADMIN APPLICATIONS ACCESS FIXED!
-- The admin should now be able to see all applications in the dashboard
