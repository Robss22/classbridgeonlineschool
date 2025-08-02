-- Complete update to teacher_assignments table
-- This script will:
-- 1. Add level_id column (replacing class_id)
-- 2. Add program_id column
-- 3. Add academic_year column
-- 4. Drop the old class_id column
-- 5. Add proper foreign key constraints

-- Step 1: Add new columns
ALTER TABLE teacher_assignments ADD COLUMN level_id UUID REFERENCES levels(level_id);
ALTER TABLE teacher_assignments ADD COLUMN program_id UUID REFERENCES programs(program_id);
ALTER TABLE teacher_assignments ADD COLUMN academic_year VARCHAR(4);

-- Step 2: Set default academic year for existing records
UPDATE teacher_assignments 
SET academic_year = EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR(4)
WHERE academic_year IS NULL;

-- Step 3: Set program_id from levels table for existing records
UPDATE teacher_assignments 
SET program_id = (
  SELECT l.program_id 
  FROM levels l 
  WHERE l.level_id = teacher_assignments.level_id
)
WHERE program_id IS NULL AND level_id IS NOT NULL;

-- Step 4: Drop the old class_id column and its foreign key
ALTER TABLE teacher_assignments DROP CONSTRAINT IF EXISTS teacher_assignments_class_id_fkey;
ALTER TABLE teacher_assignments DROP COLUMN IF EXISTS class_id;

-- Step 5: Make important columns NOT NULL (optional, depending on your requirements)
-- ALTER TABLE teacher_assignments ALTER COLUMN level_id SET NOT NULL;
-- ALTER TABLE teacher_assignments ALTER COLUMN program_id SET NOT NULL;
-- ALTER TABLE teacher_assignments ALTER COLUMN academic_year SET NOT NULL; 