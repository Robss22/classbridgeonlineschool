# Apply Page Curriculum Dropdown Issue - RLS Fix

## Problem Description

The apply page (`/apply`) was experiencing an issue where the "Select Curriculum" dropdown was not populating with programs from the database. The dropdown appeared empty even though programs existed in the database.

## Root Cause Analysis

After investigation, the issue was identified as a **Row Level Security (RLS) policy problem**:

1. **RLS Enabled Without Policies**: The `programs` and `levels` tables had RLS enabled but no policies were created
2. **Access Blocked**: When RLS is enabled without policies, all access is blocked by default
3. **Admin Page Working**: The admin programs page worked because it likely had different authentication context or bypassed RLS

## Solution

The fix involves creating proper RLS policies for both tables to allow:
- **Public read access** for anonymous users (apply page)
- **Admin management** for authenticated admin users

## Files Created

1. **`fix-apply-page-rls.sql`** - Comprehensive fix for both tables
2. **`fix-programs-rls.sql`** - Programs table only
3. **`fix-levels-rls.sql`** - Levels table only

## How to Apply the Fix

### Option 1: Use the Comprehensive Script (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the contents of `fix-apply-page-rls.sql`
5. Run the script
6. Verify the policies were created

### Option 2: Use Individual Scripts

If you prefer to fix tables separately:
1. Run `fix-programs-rls.sql` first
2. Then run `fix-levels-rls.sql`

## What the Fix Does

### Programs Table
- ✅ Enables RLS
- ✅ Creates policy allowing public read access
- ✅ Creates policies for admin management (insert/update/delete)

### Levels Table
- ✅ Enables RLS  
- ✅ Creates policy allowing public read access
- ✅ Creates policies for admin management (insert/update/delete)

## Verification

After running the fix, you should see:

1. **Policies Created**: Check `pg_policies` table for new policies
2. **Apply Page Working**: Curriculum dropdown should populate with programs
3. **Class Dropdown Working**: Should populate when curriculum is selected
4. **Admin Access Maintained**: Admin users can still manage programs/levels

## Testing

1. **Visit the apply page** (`/apply`)
2. **Check curriculum dropdown** - should show available programs
3. **Select a curriculum** - class dropdown should populate
4. **Check browser console** - should see successful data fetching
5. **Verify admin access** - admin users can still manage programs

## Troubleshooting

If issues persist after applying the fix:

### Check Browser Console
Look for JavaScript errors or failed network requests

### Check Supabase Logs
Look for permission denied errors or RLS policy violations

### Verify Policies
Run this query to check if policies were created:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('programs', 'levels');
```

### Test Direct Queries
Test if the tables are accessible:
```sql
SELECT COUNT(*) FROM programs;
SELECT COUNT(*) FROM levels;
```

## Security Considerations

The fix maintains security by:
- ✅ **Read-only access** for public users (apply page)
- ✅ **Full management** only for admin users
- ✅ **RLS enabled** on both tables
- ✅ **Proper policy structure** following Supabase best practices

## Files Modified

- **`app/apply/page.tsx`** - Added enhanced logging and error handling
- **`fix-apply-page-rls.sql`** - Created comprehensive RLS fix
- **`fix-programs-rls.sql`** - Created programs-specific RLS fix  
- **`fix-levels-rls.sql`** - Created levels-specific RLS fix

## Next Steps

1. **Apply the RLS fix** using the SQL script
2. **Test the apply page** to ensure dropdowns work
3. **Remove debug logging** from the apply page if desired
4. **Monitor for any issues** in production

## Additional Notes

- The apply page is designed to work for **anonymous users** (no login required)
- Programs and levels are **reference data** that should be publicly readable
- Admin users maintain **full control** over program and level management
- The fix follows **Supabase RLS best practices** for public read access
