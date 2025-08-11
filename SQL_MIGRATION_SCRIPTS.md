# SQL Migration Scripts Reference

## Latest Migration: Set up RLS Policies for Live Classes (August 10, 2025)

### Description
Set up Row Level Security policies for the live_classes table to control access based on user roles.

### Migration File
**File:** `scripts/20250810_setup_live_classes_rls.sql`

### Policies Added
1. Read Policy:
   - Teachers can read their own classes
   - Admins can read all classes

2. Insert Policy:
   - Teachers can create their own classes
   - Admins can create classes for any teacher

3. Update Policy:
   - Teachers can update their own classes
   - Admins can update any class

4. Delete Policy:
   - Teachers can delete their own classes
   - Admins can delete any class

### How to Apply
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the full SQL migration
5. Run the migration
6. Verify using:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'live_classes';
   ```

## Previous Migration: Complete Live Classes Table Setup (August 10, 2025)

### Description
Add all missing columns to the live_classes table and set up proper constraints and indexes.

### Migration File
**File:** `scripts/20250810_add_all_missing_columns_to_live_classes.sql`

### Columns Added
1. Basic Information:
   - title (TEXT, NOT NULL)
   - description (TEXT)
   - scheduled_date (DATE, NOT NULL)
   - start_time (TIME, NOT NULL)
   - end_time (TIME, NOT NULL)

2. Meeting Details:
   - meeting_link (TEXT)
   - meeting_platform (TEXT, NOT NULL, DEFAULT 'Google Meet')

3. Status Management:
   - status (live_class_status ENUM, NOT NULL, DEFAULT 'scheduled')

4. Foreign Keys:
   - teacher_id (UUID, NOT NULL) → teachers(teacher_id)
   - program_id (UUID, NOT NULL) → programs(program_id)
   - level_id (UUID, NOT NULL) → levels(level_id)
   - subject_id (UUID, NOT NULL) → subjects(subject_id)
   - paper_id (UUID) → papers(paper_id)

### Indexes Created
- Foreign key indexes for efficient joins
- Schedule index for quick retrieval of upcoming classes

### How to Apply
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the full SQL migration
5. Run the migration
6. Verify using:
   ```sql
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns 
   WHERE table_name = 'live_classes'
   ORDER BY ordinal_position;
   ```

### Expected Behavior After Migration
- All columns properly set up with correct data types
- Foreign key constraints ensuring data integrity
- Indexes optimizing query performance
- Default values set where appropriate
- NOT NULL constraints on required fields

## Previous Migrations

### Description
Add the status column to live_classes table to track the state of live classes.

### Migration File
**File:** `scripts/20250810_add_status_to_live_classes.sql`
```sql
-- Create enum type for status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'live_class_status') THEN
        CREATE TYPE live_class_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');
    END IF;
END$$;

-- Add status column
ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS status live_class_status NOT NULL DEFAULT 'scheduled';

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
```

### How to Apply
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the SQL code
5. Run the migration
6. Verify using:
   ```sql
   SELECT column_name, data_type, column_default
   FROM information_schema.columns 
   WHERE table_name = 'live_classes';
   ```

## Previous Migration: Add Program ID to Live Classes (August 10, 2025)

### Description
Add the program_id column to live_classes table to link live classes with specific programs.

### Migration File
**File:** `scripts/20250810_add_program_id_to_live_classes.sql`
```sql
-- Add program_id column with foreign key reference
ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(program_id) NOT NULL;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
```

### How to Apply
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the SQL code
5. Run the migration
6. Verify the column was added using:
   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns 
   WHERE table_name = 'live_classes';
   ```

## Previous Migration: Add Paper ID to Live Classes (August 10, 2025)

### Description
Add the paper_id column to live_classes table to link live classes with specific papers.

### Migration File
**File:** `scripts/20250810_add_paper_id_to_live_classes.sql`
```sql
-- Add paper_id column with foreign key reference
ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS paper_id UUID REFERENCES papers(paper_id);

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
```

### How to Apply
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the SQL code
5. Run the migration
6. Verify the column was added using:
   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns 
   WHERE table_name = 'live_classes';
   ```

## Previous Migration: Remove Academic Year from Live Classes (August 10, 2025)

### Description
Remove the unused `academic_year` column from the `live_classes` table.

### Migration File
**File:** `scripts/20250810_remove_academic_year_from_live_classes.sql`
```sql
ALTER TABLE live_classes DROP COLUMN IF EXISTS academic_year;

-- Refresh PostgREST schema cache to prevent PGRST204 errors
NOTIFY pgrst, 'reload schema';
```

### How to Apply
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the SQL code
5. Run the migration
6. Verify using:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'live_classes';
   ```

### Rollback (if needed)
```sql
ALTER TABLE live_classes ADD COLUMN academic_year TEXT;
UPDATE live_classes SET academic_year = EXTRACT(YEAR FROM scheduled_date)::TEXT;
```

## Previous Migration Steps

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