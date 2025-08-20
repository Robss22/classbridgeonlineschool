-- Drop existing policies first
DROP POLICY IF EXISTS "Service role can do anything" ON applications;
DROP POLICY IF EXISTS "Service role can do anything" ON enrollments;

-- Enable Row Level Security
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to service role
GRANT ALL ON applications TO service_role;
GRANT ALL ON enrollments TO service_role;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON auth.users TO service_role;

-- Applications table policies
CREATE POLICY "Service role can manage all applications"
ON applications
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can view their own applications"
ON applications
FOR SELECT
TO authenticated
USING (auth.uid() = parent_user_id);

-- Enrollments table policies
CREATE POLICY "Service role can manage all enrollments"
ON enrollments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Students can view their own enrollments"
ON enrollments
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

-- Add policies for student_timetables
ALTER TABLE student_timetables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all student timetables"
ON student_timetables
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Students can view their own timetables"
ON student_timetables
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

-- Add policies for live_classes
ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all live classes"
ON live_classes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Teachers can view and update their live classes"
ON live_classes
FOR ALL
TO authenticated
USING (teacher_id IN (
    SELECT teacher_id FROM teachers WHERE user_id = auth.uid()
))
WITH CHECK (teacher_id IN (
    SELECT teacher_id FROM teachers WHERE user_id = auth.uid()
));

CREATE POLICY "Students can view their enrolled live classes"
ON live_classes
FOR SELECT
TO authenticated
USING (
    live_class_id IN (
        SELECT lc.live_class_id
        FROM live_classes lc
        JOIN student_timetables st ON lc.timetable_id = st.timetable_id
        WHERE st.student_id = auth.uid()
    )
);

-- Add policies for live_class_participants
ALTER TABLE live_class_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all participants"
ON live_class_participants
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Students can view and update their own participation"
ON live_class_participants
FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view participants for their classes"
ON live_class_participants
FOR SELECT
TO authenticated
USING (
    live_class_id IN (
        SELECT live_class_id
        FROM live_classes
        WHERE teacher_id IN (
            SELECT teacher_id
            FROM teachers
            WHERE user_id = auth.uid()
        )
    )
);
