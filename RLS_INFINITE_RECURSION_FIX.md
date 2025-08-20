# RLS Infinite Recursion Fix Guide

## 🚨 Problem Identified

Your application is experiencing **"infinite recursion detected in policy for relation 'users'"** errors. This is causing:

1. **Database queries to hang indefinitely**
2. **Timeout errors in your authentication system**
3. **Empty error objects `{}` in console logs**
4. **Application becoming unresponsive**

## 🔍 Root Cause

The issue is in your **Row Level Security (RLS) policies** for the `users` table. Specifically, these policies are causing infinite recursion:

```sql
-- PROBLEMATIC POLICY - Causes infinite recursion!
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u  -- ← This references the users table itself!
            WHERE u.id = (auth.uid()::text)
            AND u.role = 'admin'
        )
    );
```

**What happens:**
1. User tries to query `users` table
2. RLS policy tries to check if user is admin
3. Policy queries `users` table again to check role
4. This triggers RLS policy again
5. Infinite loop occurs → timeout → error

## 🛠️ Immediate Fix (Temporary)

To get your application working **immediately**, run this SQL:

```sql
-- Run this in your Supabase SQL editor
BEGIN;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
NOTIFY pgrst, 'reload schema';
COMMIT;
```

**⚠️ Warning:** This removes security restrictions temporarily.

## 🔒 Permanent Fix

Run the `fix-users-rls-infinite-recursion.sql` script to restore proper security:

```sql
-- This creates safe RLS policies using helper functions
-- Run this after the temporary fix to restore security
```

## 📋 Files Created

1. **`temp-disable-users-rls.sql`** - Immediate fix (disable RLS)
2. **`fix-users-rls-infinite-recursion.sql`** - Permanent fix (safe RLS policies)
3. **`RLS_INFINITE_RECURSION_FIX.md`** - This guide

## 🚀 How to Apply the Fix

### Step 1: Immediate Fix (5 minutes)
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the `temp-disable-users-rls.sql` script
4. Your application should work immediately

### Step 2: Permanent Fix (10 minutes)
1. After confirming the app works
2. Run the `fix-users-rls-infinite-recursion.sql` script
3. This restores security without recursion issues

## 🔧 Technical Details

### The Problem
```sql
-- ❌ BAD: References users table within its own policy
SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
```

### The Solution
```sql
-- ✅ GOOD: Uses helper function to avoid recursion
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
```

## 🧪 Testing the Fix

After applying the fix:

1. **Check console logs** - Should see "Database health check passed"
2. **Authentication should work** - No more timeout errors
3. **User profiles should load** - No more empty error objects
4. **Application should be responsive** - No more hanging requests

## 📊 Expected Console Output

**Before Fix:**
```
❌ Error fetching user profile: {}
❌ Database health check failed: "infinite recursion detected in policy for relation 'users'"
❌ Health check timed out after 5 seconds
```

**After Fix:**
```
✅ Database health check passed
✅ Database connectivity and schema tests passed
✅ Supabase connection test successful
```

## 🔍 Verification Commands

Check if RLS is properly configured:

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;
```

## 🚨 If Issues Persist

1. **Check Supabase logs** for additional error details
2. **Verify environment variables** are correctly set
3. **Check network connectivity** to Supabase
4. **Review other RLS policies** for similar recursion issues

## 📞 Support

If you continue to experience issues after applying these fixes:

1. Check the Supabase dashboard logs
2. Review the console output for specific error messages
3. Verify all SQL scripts executed successfully
4. Consider checking other tables for similar RLS issues

## 🎯 Summary

The **infinite recursion in RLS policies** is a common but serious issue that can completely break database access. The fix involves:

1. **Immediate**: Disable RLS temporarily to restore functionality
2. **Permanent**: Create safe RLS policies using helper functions
3. **Verification**: Test that authentication and user profile fetching work

This should resolve your "Error fetching user profile: {}" and timeout issues completely.
