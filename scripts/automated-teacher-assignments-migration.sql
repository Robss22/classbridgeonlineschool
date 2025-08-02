-- Automated Migration: Fix Missing program_id in teacher_assignments
-- This script will:
-- 1. Check current state of teacher_assignments
-- 2. Fix missing program_id values by looking up from levels table
-- 3. Validate the fixes
-- 4. Provide a summary report

-- Step 1: Create a temporary table to track changes
CREATE TEMP TABLE migration_log (
    step VARCHAR(100),
    description TEXT,
    affected_rows INTEGER,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Step 2: Log initial state
INSERT INTO migration_log (step, description, affected_rows)
SELECT 
    'Initial State',
    'Records with missing program_id',
    COUNT(*)
FROM teacher_assignments 
WHERE program_id IS NULL OR program_id = '';

-- Step 3: Fix missing program_id values
UPDATE teacher_assignments ta
SET program_id = l.program_id
FROM levels l
WHERE ta.level_id = l.level_id
  AND (ta.program_id IS NULL OR ta.program_id = '');

-- Step 4: Log the fix
INSERT INTO migration_log (step, description, affected_rows)
SELECT 
    'Fixed Missing program_id',
    'Records updated with program_id from levels table',
    COUNT(*)
FROM teacher_assignments 
WHERE program_id IS NOT NULL AND program_id != '';

-- Step 5: Verify no records still have missing program_id
INSERT INTO migration_log (step, description, affected_rows)
SELECT 
    'Verification',
    'Records still missing program_id (should be 0)',
    COUNT(*)
FROM teacher_assignments 
WHERE program_id IS NULL OR program_id = '';

-- Step 6: Create a summary view for easy checking
CREATE OR REPLACE VIEW teacher_assignments_summary AS
SELECT 
    ta.teacher_id,
    t.user_id,
    u.email,
    COUNT(DISTINCT ta.program_id) as assigned_programs,
    COUNT(DISTINCT ta.level_id) as assigned_levels,
    COUNT(DISTINCT ta.subject_id) as assigned_subjects,
    STRING_AGG(DISTINCT p.name, ', ') as program_names,
    STRING_AGG(DISTINCT l.name, ', ') as level_names,
    STRING_AGG(DISTINCT s.name, ', ') as subject_names
FROM teacher_assignments ta
JOIN teachers t ON ta.teacher_id = t.teacher_id
JOIN users u ON t.user_id = u.id
LEFT JOIN programs p ON ta.program_id = p.program_id
LEFT JOIN levels l ON ta.level_id = l.level_id
LEFT JOIN subjects s ON ta.subject_id = s.subject_id
GROUP BY ta.teacher_id, t.user_id, u.email;

-- Step 7: Display migration results
SELECT 
    'MIGRATION COMPLETE' as status,
    'Check the results below:' as message;

-- Display migration log
SELECT 
    step,
    description,
    affected_rows,
    timestamp
FROM migration_log
ORDER BY timestamp;

-- Display summary of all teacher assignments
SELECT 
    'TEACHER ASSIGNMENTS SUMMARY' as section,
    '' as info;

SELECT 
    email,
    assigned_programs,
    assigned_levels,
    assigned_subjects,
    program_names,
    level_names,
    subject_names
FROM teacher_assignments_summary
ORDER BY email;

-- Display any remaining issues
SELECT 
    'REMAINING ISSUES (if any)' as section,
    '' as info;

SELECT 
    ta.teacher_id,
    t.user_id,
    u.email,
    ta.program_id,
    ta.level_id,
    ta.subject_id
FROM teacher_assignments ta
JOIN teachers t ON ta.teacher_id = t.teacher_id
JOIN users u ON t.user_id = u.id
WHERE ta.program_id IS NULL OR ta.program_id = '';

-- Clean up temporary table
DROP TABLE migration_log; 