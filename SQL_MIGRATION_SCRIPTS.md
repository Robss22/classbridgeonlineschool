# SQL Migration Scripts Reference

## Quick Migration Steps

### 1. Add New Columns to teacher_assignments
**File:** `update-teacher-assignments-complete.sql`
```sql
-- Add new columns
ALTER TABLE teacher_assignments ADD COLUMN level_id UUID REFERENCES levels(level_id);
ALTER TABLE teacher_assignments ADD COLUMN program_id UUID REFERENCES programs(program_id);
ALTER TABLE teacher_assignments ADD COLUMN academic_year VARCHAR(4);

-- Drop old column
ALTER TABLE teacher_assignments DROP CONSTRAINT IF EXISTS teacher_assignments_class_id_fkey;
ALTER TABLE teacher_assignments DROP COLUMN IF EXISTS class_id;
```

### 2. Fix RLS Policies
**File:** `allow-teacher-assignments-insert.sql`
```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON teacher_assignments;

-- Create new INSERT policy
CREATE POLICY "Allow insert for authenticated users" ON teacher_assignments
FOR INSERT TO authenticated WITH CHECK (true);

-- Enable RLS
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;
```

### 3. Alternative: Disable RLS (Quick Fix)
**File:** `disable-teacher-assignments-rls.sql`
```sql
-- Temporarily disable RLS for testing
ALTER TABLE teacher_assignments DISABLE ROW LEVEL SECURITY;
```

## Scripts Created

1. **`update-teacher-assignments-complete.sql`** - Complete schema update
2. **`allow-teacher-assignments-insert.sql`** - Fix RLS policies
3. **`disable-teacher-assignments-rls.sql`** - Quick RLS disable
4. **`fix-teacher-assignments-schema.sql`** - Basic schema fix
5. **`add-level-id-to-teacher-assignments.sql`** - Simple level_id addition

## Files Deleted
- `fix-subject-assignments-rls.sql` - No longer needed
- `disable-subject-assignments-rls.sql` - No longer needed

## Order of Execution
1. Run `update-teacher-assignments-complete.sql` first
2. Run `allow-teacher-assignments-insert.sql` second
3. Test the assignment process
4. If issues persist, use `disable-teacher-assignments-rls.sql` as fallback 