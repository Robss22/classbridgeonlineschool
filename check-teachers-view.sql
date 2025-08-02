-- Check if teachers_with_users view exists and create it if it doesn't
-- This view should join teachers table with users table

-- Drop the view if it exists
DROP VIEW IF EXISTS teachers_with_users;

-- Create the view
CREATE VIEW teachers_with_users AS
SELECT 
  t.teacher_id,
  t.user_id,
  t.program_id,
  t.bio,
  t.created_at as teacher_created_at,
  u.id,
  u.email,
  u.full_name,
  u.first_name,
  u.last_name,
  u.role,
  u.phone,
  u.status,
  u.department,
  u.gender,
  u.created_at as user_created_at
FROM teachers t
JOIN users u ON t.user_id = u.id
WHERE u.role = 'teacher';

-- Grant permissions
GRANT SELECT ON teachers_with_users TO authenticated;
GRANT SELECT ON teachers_with_users TO anon; 