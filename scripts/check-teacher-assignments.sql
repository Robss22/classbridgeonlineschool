-- Replace '<teacher_id>' with the actual teacher_id
SELECT * FROM teacher_assignments WHERE teacher_id = '<teacher_id>';

-- Show all assignments with missing program_id
SELECT * FROM teacher_assignments WHERE program_id IS NULL OR program_id = ''; 