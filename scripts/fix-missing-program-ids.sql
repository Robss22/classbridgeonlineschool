-- Fix missing program_id in teacher_assignments by looking up from levels
UPDATE teacher_assignments ta
SET program_id = l.program_id
FROM levels l
WHERE ta.level_id = l.level_id
  AND (ta.program_id IS NULL OR ta.program_id = '');

-- Verify the fix
SELECT * FROM teacher_assignments WHERE program_id IS NULL OR program_id = ''; 