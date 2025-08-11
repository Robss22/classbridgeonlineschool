-- Drop academic_year column from live_classes table
ALTER TABLE live_classes DROP COLUMN IF EXISTS academic_year;
