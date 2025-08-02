-- Replace '<user_id>' with the actual user_id
SELECT DISTINCT p.program_id, p.name
FROM teacher_assignments ta
JOIN teachers t ON ta.teacher_id = t.teacher_id
JOIN programs p ON ta.program_id = p.program_id
WHERE t.user_id = '<user_id>'; 