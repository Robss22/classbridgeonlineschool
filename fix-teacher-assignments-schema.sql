-- Fix teacher_assignments table to use level_id instead of class_id
-- This script will:
-- 1. Add a new level_id column
-- 2. Drop the old class_id column and its foreign key
-- 3. Add foreign key constraint for level_id

-- Step 1: Add level_id column
ALTER TABLE teacher_assignments ADD COLUMN level_id UUID REFERENCES levels(level_id);

-- Step 2: Drop the old class_id column and its foreign key
ALTER TABLE teacher_assignments DROP CONSTRAINT IF EXISTS teacher_assignments_class_id_fkey;
ALTER TABLE teacher_assignments DROP COLUMN IF EXISTS class_id;

-- Step 3: Make level_id NOT NULL (optional, depending on your requirements)
-- ALTER TABLE teacher_assignments ALTER COLUMN level_id SET NOT NULL; 