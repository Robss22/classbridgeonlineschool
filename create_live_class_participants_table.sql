-- Create live_class_participants table for attendance tracking
-- Run this in your Supabase SQL Editor

-- Create the live_class_participants table
CREATE TABLE IF NOT EXISTS live_class_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    live_class_id UUID NOT NULL REFERENCES live_classes(live_class_id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    join_time TIMESTAMP WITH TIME ZONE,
    leave_time TIMESTAMP WITH TIME ZONE,
    attendance_status VARCHAR(20) DEFAULT 'present' CHECK (attendance_status IN ('present', 'absent', 'late', 'registered')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique student per live class
    UNIQUE(live_class_id, student_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_class_participants_live_class_id ON live_class_participants(live_class_id);
CREATE INDEX IF NOT EXISTS idx_live_class_participants_student_id ON live_class_participants(student_id);
CREATE INDEX IF NOT EXISTS idx_live_class_participants_join_time ON live_class_participants(join_time);

-- Enable Row Level Security
ALTER TABLE live_class_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_class_participants

-- Students can view their own participation records
CREATE POLICY "Students can view own participation" ON live_class_participants
    FOR SELECT USING (
        auth.uid() = student_id OR 
        EXISTS (
            SELECT 1 FROM live_classes lc 
            JOIN teachers t ON lc.teacher_id = t.teacher_id 
            WHERE lc.live_class_id = live_class_participants.live_class_id 
            AND t.user_id = auth.uid()
        )
    );

-- Students can insert their own participation (join/leave events)
CREATE POLICY "Students can insert own participation" ON live_class_participants
    FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Students can update their own participation records
CREATE POLICY "Students can update own participation" ON live_class_participants
    FOR UPDATE USING (auth.uid() = student_id);

-- Teachers can view participation for their classes
CREATE POLICY "Teachers can view class participation" ON live_class_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM live_classes lc 
            JOIN teachers t ON lc.teacher_id = t.teacher_id 
            WHERE lc.live_class_id = live_class_participants.live_class_id 
            AND t.user_id = auth.uid()
        )
    );

-- Admins can view all participation records
CREATE POLICY "Admins can view all participation" ON live_class_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
