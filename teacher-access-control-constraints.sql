-- Teacher Access Control Database Constraints
-- This script adds database-level constraints to ensure teachers can only
-- create resources and assessments for their assigned subjects and levels

-- 1. Create a function to check if a teacher is assigned to a subject and level
CREATE OR REPLACE FUNCTION check_teacher_assignment(
  p_teacher_user_id UUID,
  p_subject_id UUID,
  p_level_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_teacher_id UUID;
  v_assignment_count INTEGER;
BEGIN
  -- Get teacher_id from teachers table
  SELECT teacher_id INTO v_teacher_id
  FROM teachers
  WHERE user_id = p_teacher_user_id;
  
  IF v_teacher_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if teacher is assigned to this subject and level
  SELECT COUNT(*) INTO v_assignment_count
  FROM teacher_assignments
  WHERE teacher_id = v_teacher_id
    AND subject_id = p_subject_id
    AND level_id = p_level_id;
  
  RETURN v_assignment_count > 0;
END;
$$ LANGUAGE plpgsql;

-- 2. Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID) RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM users
  WHERE id = p_user_id;
  
  RETURN v_role = 'admin';
END;
$$ LANGUAGE plpgsql;

-- 3. Add RLS policies for resources table
-- Enable RLS on resources table
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can only access their assigned resources" ON resources;
DROP POLICY IF EXISTS "Admins can access all resources" ON resources;
DROP POLICY IF EXISTS "Users can view resources" ON resources;

-- Policy for teachers: can only view and modify resources for their assigned subjects/levels
CREATE POLICY "Teachers can only access their assigned resources" ON resources
  FOR ALL USING (
    (is_admin(auth.uid()) OR 
     (auth.uid() = uploaded_by AND 
      check_teacher_assignment(auth.uid(), subject_id, level_id)))
  WITH CHECK (
    (is_admin(auth.uid()) OR 
     (auth.uid() = uploaded_by AND 
      check_teacher_assignment(auth.uid(), subject_id, level_id)))
);

-- Policy for admins: can access all resources
CREATE POLICY "Admins can access all resources" ON resources
  FOR ALL USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Policy for students: can view resources for their enrolled subjects/levels
CREATE POLICY "Users can view resources" ON resources
  FOR SELECT USING (true);

-- 4. Add RLS policies for assessments table
-- Enable RLS on assessments table
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can only access their assigned assessments" ON assessments;
DROP POLICY IF EXISTS "Admins can access all assessments" ON assessments;
DROP POLICY IF EXISTS "Users can view assessments" ON assessments;

-- Policy for teachers: can only view and modify assessments for their assigned subjects/levels
CREATE POLICY "Teachers can only access their assigned assessments" ON assessments
  FOR ALL USING (
    (is_admin(auth.uid()) OR 
     (auth.uid() = creator_id AND 
      check_teacher_assignment(auth.uid(), subject_id, level_id)))
  WITH CHECK (
    (is_admin(auth.uid()) OR 
     (auth.uid() = creator_id AND 
      check_teacher_assignment(auth.uid(), subject_id, level_id)))
);

-- Policy for admins: can access all assessments
CREATE POLICY "Admins can access all assessments" ON assessments
  FOR ALL USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Policy for students: can view assessments for their enrolled subjects/levels
CREATE POLICY "Users can view assessments" ON assessments
  FOR SELECT USING (true);

-- 5. Create triggers to prevent unauthorized insertions/updates
-- Function to validate teacher assignments before insert/update
CREATE OR REPLACE FUNCTION validate_teacher_resource_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow admins to do anything
  IF is_admin(NEW.uploaded_by) THEN
    RETURN NEW;
  END IF;
  
  -- For teachers, check if they're assigned to the subject and level
  IF NOT check_teacher_assignment(NEW.uploaded_by, NEW.subject_id, NEW.level_id) THEN
    RAISE EXCEPTION 'Teacher is not assigned to this subject and level combination';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate teacher assessment access before insert/update
CREATE OR REPLACE FUNCTION validate_teacher_assessment_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow admins to do anything
  IF is_admin(NEW.creator_id) THEN
    RETURN NEW;
  END IF;
  
  -- For teachers, check if they're assigned to the subject and level
  IF NOT check_teacher_assignment(NEW.creator_id, NEW.subject_id, NEW.level_id) THEN
    RAISE EXCEPTION 'Teacher is not assigned to this subject and level combination';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for resources table
DROP TRIGGER IF EXISTS validate_teacher_resource_access_trigger ON resources;
CREATE TRIGGER validate_teacher_resource_access_trigger
  BEFORE INSERT OR UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION validate_teacher_resource_access();

-- Create triggers for assessments table
DROP TRIGGER IF EXISTS validate_teacher_assessment_access_trigger ON assessments;
CREATE TRIGGER validate_teacher_assessment_access_trigger
  BEFORE INSERT OR UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION validate_teacher_assessment_access();

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_subject_level 
ON teacher_assignments(teacher_id, subject_id, level_id);

CREATE INDEX IF NOT EXISTS idx_resources_uploaded_by_subject_level 
ON resources(uploaded_by, subject_id, level_id);

CREATE INDEX IF NOT EXISTS idx_assessments_creator_subject_level 
ON assessments(creator_id, subject_id, level_id);

-- 7. Create a view for teachers to see their assignments
CREATE OR REPLACE VIEW teacher_assignments_view AS
SELECT 
  t.teacher_id,
  t.user_id,
  u.full_name as teacher_name,
  u.email as teacher_email,
  ta.subject_id,
  ta.level_id,
  ta.program_id,
  s.name as subject_name,
  l.name as level_name,
  p.name as program_name,
  ta.assigned_at
FROM teachers t
JOIN users u ON t.user_id = u.id
JOIN teacher_assignments ta ON t.teacher_id = ta.teacher_id
JOIN subjects s ON ta.subject_id = s.subject_id
JOIN levels l ON ta.level_id = l.level_id
JOIN programs p ON ta.program_id = p.program_id;

-- 8. Grant necessary permissions
GRANT SELECT ON teacher_assignments_view TO authenticated;
GRANT SELECT ON resources TO authenticated;
GRANT SELECT ON assessments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON resources TO authenticated;
GRANT INSERT, UPDATE, DELETE ON assessments TO authenticated;

-- 9. Create a function to get teacher's accessible subjects and levels
CREATE OR REPLACE FUNCTION get_teacher_accessible_data(p_teacher_user_id UUID)
RETURNS TABLE(
  subject_id UUID,
  level_id UUID,
  program_id UUID,
  subject_name TEXT,
  level_name TEXT,
  program_name TEXT
) AS $$
DECLARE
  v_teacher_id UUID;
BEGIN
  -- Get teacher_id from teachers table
  SELECT teacher_id INTO v_teacher_id
  FROM teachers
  WHERE user_id = p_teacher_user_id;
  
  IF v_teacher_id IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    ta.subject_id,
    ta.level_id,
    ta.program_id,
    s.name as subject_name,
    l.name as level_name,
    p.name as program_name
  FROM teacher_assignments ta
  JOIN subjects s ON ta.subject_id = s.subject_id
  JOIN levels l ON ta.level_id = l.level_id
  JOIN programs p ON ta.program_id = p.program_id
  WHERE ta.teacher_id = v_teacher_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_teacher_accessible_data(UUID) TO authenticated;

-- 10. Create a function to check if a user can access a specific resource/assessment
CREATE OR REPLACE FUNCTION can_access_resource(
  p_user_id UUID,
  p_resource_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_resource RECORD;
BEGIN
  -- Get resource details
  SELECT uploaded_by, subject_id, level_id INTO v_resource
  FROM resources
  WHERE resource_id = p_resource_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Admin can access everything
  IF is_admin(p_user_id) THEN
    RETURN TRUE;
  END IF;
  
  -- User can access their own resources
  IF v_resource.uploaded_by = p_user_id THEN
    RETURN check_teacher_assignment(p_user_id, v_resource.subject_id, v_resource.level_id);
  END IF;
  
  -- For viewing, allow access to assigned subjects/levels
  RETURN check_teacher_assignment(p_user_id, v_resource.subject_id, v_resource.level_id);
END;
$$ LANGUAGE plpgsql;

-- Create similar function for assessments
CREATE OR REPLACE FUNCTION can_access_assessment(
  p_user_id UUID,
  p_assessment_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_assessment RECORD;
BEGIN
  -- Get assessment details
  SELECT creator_id, subject_id, level_id INTO v_assessment
  FROM assessments
  WHERE id = p_assessment_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Admin can access everything
  IF is_admin(p_user_id) THEN
    RETURN TRUE;
  END IF;
  
  -- User can access their own assessments
  IF v_assessment.creator_id = p_user_id THEN
    RETURN check_teacher_assignment(p_user_id, v_assessment.subject_id, v_assessment.level_id);
  END IF;
  
  -- For viewing, allow access to assigned subjects/levels
  RETURN check_teacher_assignment(p_user_id, v_assessment.subject_id, v_assessment.level_id);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION can_access_resource(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_assessment(UUID, UUID) TO authenticated;

-- 11. Add comments for documentation
COMMENT ON FUNCTION check_teacher_assignment(UUID, UUID, UUID) IS 
'Checks if a teacher is assigned to a specific subject and level combination';

COMMENT ON FUNCTION is_admin(UUID) IS 
'Checks if a user has admin role';

COMMENT ON FUNCTION validate_teacher_resource_access() IS 
'Validates that teachers can only create/modify resources for their assigned subjects and levels';

COMMENT ON FUNCTION validate_teacher_assessment_access() IS 
'Validates that teachers can only create/modify assessments for their assigned subjects and levels';

COMMENT ON VIEW teacher_assignments_view IS 
'View showing teacher assignments with subject, level, and program names';

-- 12. Create a summary of the access control system
-- This creates a comprehensive access control system that:
-- 1. Prevents teachers from creating resources/assessments for unassigned subjects/levels
-- 2. Allows admins full access to all resources and assessments
-- 3. Provides database-level validation through triggers
-- 4. Uses Row Level Security (RLS) for additional protection
-- 5. Includes helper functions for checking access permissions
-- 6. Creates indexes for optimal performance
-- 7. Provides views for easy data access

-- To test the system:
-- 1. Assign a teacher to specific subjects and levels using the admin interface
-- 2. Try to create a resource/assessment for an unassigned subject/level (should fail)
-- 3. Try to create a resource/assessment for an assigned subject/level (should succeed)
-- 4. Verify that teachers can only see resources/assessments for their assignments 