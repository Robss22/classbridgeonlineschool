-- Cleanup Duplicate Teacher Assignments
-- This script identifies and removes duplicate teacher assignments
-- Run this in your Supabase SQL Editor to fix the duplicate teacher issue

BEGIN;

-- Step 1: Identify duplicate assignments
SELECT 
    'DUPLICATE ASSIGNMENTS FOUND' as info,
    ta.teacher_id,
    ta.subject_id,
    ta.level_id,
    COUNT(*) as duplicate_count,
    u.full_name as teacher_name,
    s.name as subject_name,
    l.name as level_name
FROM teacher_assignments ta
JOIN teachers t ON ta.teacher_id = t.teacher_id
JOIN users u ON t.user_id = u.id
JOIN subjects s ON ta.subject_id = s.subject_id
JOIN levels l ON ta.level_id = l.level_id
GROUP BY ta.teacher_id, ta.subject_id, ta.level_id, u.full_name, s.name, l.name
HAVING COUNT(*) > 1
ORDER BY ta.teacher_id, s.name, l.name;

-- Step 2: Create a temporary table to keep only unique assignments
CREATE TEMP TABLE unique_assignments AS
SELECT DISTINCT ON (teacher_id, subject_id, level_id)
    teacher_id,
    subject_id,
    level_id,
    program_id,
    academic_year,
    assigned_at
FROM teacher_assignments
ORDER BY teacher_id, subject_id, level_id, assigned_at DESC;

-- Step 3: Show what will be kept
SELECT 
    'UNIQUE ASSIGNMENTS TO KEEP' as info,
    ua.teacher_id,
    ua.subject_id,
    ua.level_id,
    u.full_name as teacher_name,
    s.name as subject_name,
    l.name as level_name,
    ua.assigned_at
FROM unique_assignments ua
JOIN teachers t ON ua.teacher_id = t.teacher_id
JOIN users u ON t.user_id = u.id
JOIN subjects s ON ua.subject_id = s.subject_id
JOIN levels l ON ua.level_id = l.level_id
ORDER BY u.full_name, s.name, l.name;

-- Step 4: Backup current data (optional - uncomment if you want a backup)
-- CREATE TABLE teacher_assignments_backup AS SELECT * FROM teacher_assignments;

-- Step 5: Replace the table with unique assignments
DELETE FROM teacher_assignments;

INSERT INTO teacher_assignments (teacher_id, subject_id, level_id, program_id, academic_year, assigned_at)
SELECT teacher_id, subject_id, level_id, program_id, academic_year, assigned_at
FROM unique_assignments;

-- Step 6: Verify the cleanup
SELECT 
    'VERIFICATION - NO MORE DUPLICATES' as info,
    ta.teacher_id,
    ta.subject_id,
    ta.level_id,
    COUNT(*) as assignment_count,
    u.full_name as teacher_name,
    s.name as subject_name,
    l.name as level_name
FROM teacher_assignments ta
JOIN teachers t ON ta.teacher_id = t.teacher_id
JOIN users u ON t.user_id = u.id
JOIN subjects s ON ta.subject_id = s.subject_id
JOIN levels l ON ta.level_id = l.level_id
GROUP BY ta.teacher_id, ta.subject_id, ta.level_id, u.full_name, s.name, l.name
HAVING COUNT(*) > 1
ORDER BY ta.teacher_id, s.name, l.name;

-- Step 7: Show final clean data
SELECT 
    'FINAL CLEAN ASSIGNMENTS' as info,
    ta.teacher_id,
    u.full_name as teacher_name,
    s.name as subject_name,
    l.name as level_name,
    ta.assigned_at
FROM teacher_assignments ta
JOIN teachers t ON ta.teacher_id = t.teacher_id
JOIN users u ON t.user_id = u.id
JOIN subjects s ON ta.subject_id = s.subject_id
JOIN levels l ON ta.level_id = l.level_id
ORDER BY u.full_name, s.name, l.name;

-- Step 8: Add a unique constraint to prevent future duplicates
ALTER TABLE teacher_assignments 
ADD CONSTRAINT unique_teacher_subject_level 
UNIQUE (teacher_id, subject_id, level_id);

COMMIT;

-- ✅ Duplicate teacher assignments have been cleaned up!
-- 
-- What this script does:
-- 1. Identifies duplicate assignments
-- 2. Keeps only the most recent assignment for each teacher-subject-level combination
-- 3. Removes all duplicates
-- 4. Adds a unique constraint to prevent future duplicates
-- 5. Verifies the cleanup was successful
--
-- The teacher dropdown should now show each teacher only once!

