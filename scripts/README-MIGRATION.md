# Teacher Assignments Migration Guide

## Overview
This migration fixes missing `program_id` values in the `teacher_assignments` table, which is causing the "Program" dropdown to be empty in the teacher resources page.

## Files Created
- `automated-teacher-assignments-migration.sql` - The main migration script
- `run-migration.ps1` - PowerShell helper script
- `README-MIGRATION.md` - This guide

## Quick Start

### Option 1: Run PowerShell Script (Recommended)
```powershell
# Navigate to the project directory
cd classbridgeonlineschool

# Run the migration script
.\scripts\run-migration.ps1
```

### Option 2: Manual Execution
1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy the content from `scripts/automated-teacher-assignments-migration.sql`
4. Paste and execute the SQL

## What the Migration Does

### 1. **Safety Checks**
- Logs the initial state of missing `program_id` values
- Creates a temporary tracking table

### 2. **Data Fix**
- Updates all `teacher_assignments` records with missing `program_id`
- Uses the `levels` table to look up the correct `program_id` based on `level_id`

### 3. **Validation**
- Verifies that all records now have valid `program_id` values
- Creates a summary view for easy checking

### 4. **Reporting**
- Shows migration progress and results
- Displays a summary of all teacher assignments
- Identifies any remaining issues

## Expected Results

After running the migration, you should see:

1. **Migration Log** showing:
   - Initial count of records with missing `program_id`
   - Number of records fixed
   - Verification that 0 records still have missing `program_id`

2. **Teacher Assignments Summary** showing:
   - Each teacher's email
   - Number of assigned programs, levels, and subjects
   - Names of assigned programs, levels, and subjects

3. **Remaining Issues** section (should be empty if successful)

## Testing After Migration

1. **Test the Teacher Resources Page**:
   - Log in as a teacher
   - Go to `/teachers/resources`
   - Click "Add Resource"
   - Verify the "Program" dropdown shows the assigned program(s)

2. **Test the Teacher Assessment Page**:
   - Go to `/assessments`
   - Click "Create Assessment"
   - Verify the "Program" dropdown shows the assigned program(s)

## Troubleshooting

### If the migration fails:
1. Check that the `levels` table has valid `program_id` values
2. Verify that `teacher_assignments` has valid `level_id` values
3. Ensure you have proper permissions in Supabase

### If the Program dropdown is still empty:
1. Check the migration results for any remaining issues
2. Verify that the teacher has valid assignments in `teacher_assignments`
3. Check the browser console for any JavaScript errors

## Rollback (if needed)

If you need to rollback the changes:
```sql
-- This will reset program_id to NULL for all records
UPDATE teacher_assignments 
SET program_id = NULL 
WHERE program_id IS NOT NULL;
```

## Support

If you encounter any issues:
1. Check the migration log output for error messages
2. Verify your database schema matches the expected structure
3. Ensure all foreign key relationships are properly set up 