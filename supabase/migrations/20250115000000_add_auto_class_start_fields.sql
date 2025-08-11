-- Add new fields to live_classes table for automatic starting
ALTER TABLE live_classes 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE;

-- Create notifications table for student notifications
CREATE TABLE IF NOT EXISTS notifications (
  notification_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Create student_enrollments table if it doesn't exist
CREATE TABLE IF NOT EXISTS student_enrollments (
  enrollment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(program_id) ON DELETE CASCADE,
  level_id UUID REFERENCES levels(level_id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  UNIQUE(student_id, program_id, level_id)
);

-- Add RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can insert notifications
CREATE POLICY "Service role can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Add RLS policies for student_enrollments
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;

-- Students can view their own enrollments
CREATE POLICY "Students can view own enrollments" ON student_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students 
      WHERE students.student_id = student_enrollments.student_id 
      AND students.user_id = auth.uid()
    )
  );

-- Admins can view all enrollments
CREATE POLICY "Admins can view all enrollments" ON student_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Service role can insert enrollments
CREATE POLICY "Service role can insert enrollments" ON student_enrollments
  FOR INSERT WITH CHECK (true);

-- Update existing live_classes to have proper status if null
UPDATE live_classes 
SET status = 'scheduled' 
WHERE status IS NULL;

-- Ensure status column has proper constraints
ALTER TABLE live_classes 
ALTER COLUMN status SET DEFAULT 'scheduled';

-- Add check constraint for valid status values
ALTER TABLE live_classes 
ADD CONSTRAINT check_valid_status 
CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled'));
