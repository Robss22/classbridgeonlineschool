-- Timetable and Live Classes Database Migration
-- Professional implementation for ClassBridge Online School
-- Migration: 20241201000000_timetable_live_classes.sql

-- =============================================
-- TIMETABLE SYSTEM
-- =============================================

-- Main timetable table
CREATE TABLE IF NOT EXISTS timetables (
    timetable_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level_id UUID NOT NULL REFERENCES levels(level_id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_name VARCHAR(100),
    meeting_platform VARCHAR(50) DEFAULT 'Zoom', -- Zoom, Google Meet, Teams, etc.
    meeting_link VARCHAR(500),
    meeting_id VARCHAR(100),
    meeting_password VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    academic_year VARCHAR(4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_time_range CHECK (start_time < end_time),
    CONSTRAINT valid_day CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'))
);

-- Student timetable assignments (many-to-many relationship)
CREATE TABLE IF NOT EXISTS student_timetables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timetable_id UUID NOT NULL REFERENCES timetables(timetable_id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(student_id, timetable_id)
);

-- =============================================
-- LIVE CLASSES SYSTEM
-- =============================================

-- Live classes table
CREATE TABLE IF NOT EXISTS live_classes (
    live_class_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timetable_id UUID REFERENCES timetables(timetable_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    meeting_platform VARCHAR(50) DEFAULT 'Zoom',
    meeting_link VARCHAR(500),
    meeting_id VARCHAR(100),
    meeting_password VARCHAR(100),
    max_participants INTEGER DEFAULT 50,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
    teacher_id UUID NOT NULL REFERENCES teachers(teacher_id),
    level_id UUID NOT NULL REFERENCES levels(level_id),
    subject_id UUID NOT NULL REFERENCES subjects(subject_id),
    academic_year VARCHAR(4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_live_class_time CHECK (start_time < end_time)
);

-- Live class participants
CREATE TABLE IF NOT EXISTS live_class_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    live_class_id UUID NOT NULL REFERENCES live_classes(live_class_id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    join_time TIMESTAMP WITH TIME ZONE,
    leave_time TIMESTAMP WITH TIME ZONE,
    attendance_status VARCHAR(20) DEFAULT 'registered' CHECK (attendance_status IN ('registered', 'present', 'absent', 'late')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(live_class_id, student_id)
);

-- =============================================
-- NOTIFICATIONS SYSTEM
-- =============================================

-- Class notifications
CREATE TABLE IF NOT EXISTS class_notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timetable_id UUID REFERENCES timetables(timetable_id) ON DELETE CASCADE,
    live_class_id UUID REFERENCES live_classes(live_class_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(20) NOT NULL CHECK (notification_type IN ('reminder', 'cancellation', 'reschedule', 'update')),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Timetable indexes
CREATE INDEX IF NOT EXISTS idx_timetables_level_subject ON timetables(level_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_timetables_teacher ON timetables(teacher_id);
CREATE INDEX IF NOT EXISTS idx_timetables_day_time ON timetables(day_of_week, start_time);
CREATE INDEX IF NOT EXISTS idx_timetables_academic_year ON timetables(academic_year);

-- Student timetable indexes
CREATE INDEX IF NOT EXISTS idx_student_timetables_student ON student_timetables(student_id);
CREATE INDEX IF NOT EXISTS idx_student_timetables_timetable ON student_timetables(timetable_id);

-- Live classes indexes
CREATE INDEX IF NOT EXISTS idx_live_classes_date ON live_classes(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_live_classes_teacher ON live_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_status ON live_classes(status);
CREATE INDEX IF NOT EXISTS idx_live_classes_subject ON live_classes(subject_id);

-- Participants indexes
CREATE INDEX IF NOT EXISTS idx_participants_live_class ON live_class_participants(live_class_id);
CREATE INDEX IF NOT EXISTS idx_participants_student ON live_class_participants(student_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON live_class_participants(attendance_status);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_class_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_notifications ENABLE ROW LEVEL SECURITY;

-- Timetables policies
CREATE POLICY "Teachers can view their own timetables" ON timetables
    FOR SELECT USING (
        teacher_id IN (
            SELECT teacher_id FROM teachers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Students can view their assigned timetables" ON timetables
    FOR SELECT USING (
        timetable_id IN (
            SELECT timetable_id FROM student_timetables WHERE student_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all timetables" ON timetables
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Student timetables policies
CREATE POLICY "Students can view their own timetable assignments" ON student_timetables
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Admins can manage student timetable assignments" ON student_timetables
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Live classes policies
CREATE POLICY "Teachers can manage their live classes" ON live_classes
    FOR ALL USING (
        teacher_id IN (
            SELECT teacher_id FROM teachers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Students can view live classes for their subjects" ON live_classes
    FOR SELECT USING (
        subject_id IN (
            SELECT DISTINCT s.subject_id 
            FROM student_timetables st
            JOIN timetables t ON st.timetable_id = t.timetable_id
            JOIN subjects s ON t.subject_id = s.subject_id
            WHERE st.student_id = auth.uid()
        )
    );

-- Participants policies
CREATE POLICY "Students can view their own participation" ON live_class_participants
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can view participants for their classes" ON live_class_participants
    FOR SELECT USING (
        live_class_id IN (
            SELECT live_class_id FROM live_classes 
            WHERE teacher_id IN (
                SELECT teacher_id FROM teachers WHERE user_id = auth.uid()
            )
        )
    );

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_timetables_updated_at BEFORE UPDATE ON timetables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_live_classes_updated_at BEFORE UPDATE ON live_classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to validate timetable conflicts
CREATE OR REPLACE FUNCTION check_timetable_conflicts()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for overlapping times for the same teacher
    IF EXISTS (
        SELECT 1 FROM timetables 
        WHERE teacher_id = NEW.teacher_id 
        AND day_of_week = NEW.day_of_week
        AND timetable_id != NEW.timetable_id
        AND (
            (NEW.start_time < end_time AND NEW.end_time > start_time)
        )
    ) THEN
        RAISE EXCEPTION 'Teacher has conflicting timetable entry';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for timetable conflict checking
CREATE TRIGGER check_timetable_conflicts_trigger
    BEFORE INSERT OR UPDATE ON timetables
    FOR EACH ROW EXECUTE FUNCTION check_timetable_conflicts();

-- =============================================
-- VIEWS FOR EASY DATA ACCESS
-- =============================================

-- Student timetable view
CREATE OR REPLACE VIEW student_timetable_view AS
SELECT 
    st.student_id,
    t.timetable_id,
    t.day_of_week,
    t.start_time,
    t.end_time,
    s.name as subject_name,
    s.subject_id,
    l.name as level_name,
    l.level_id,
    p.name as program_name,
    CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
    t.meeting_link,
    t.meeting_platform,
    t.room_name,
    t.is_active
FROM student_timetables st
JOIN timetables t ON st.timetable_id = t.timetable_id
JOIN subjects s ON t.subject_id = s.subject_id
JOIN levels l ON t.level_id = l.level_id
JOIN programs p ON l.program_id = p.program_id
JOIN teachers te ON t.teacher_id = te.teacher_id
JOIN users u ON te.user_id = u.id
WHERE st.status = 'active' AND t.is_active = true;

-- Teacher timetable view
CREATE OR REPLACE VIEW teacher_timetable_view AS
SELECT 
    t.timetable_id,
    t.day_of_week,
    t.start_time,
    t.end_time,
    s.name as subject_name,
    s.subject_id,
    l.name as level_name,
    l.level_id,
    p.name as program_name,
    t.meeting_link,
    t.meeting_platform,
    t.room_name,
    t.is_active,
    COUNT(st.student_id) as student_count
FROM timetables t
JOIN subjects s ON t.subject_id = s.subject_id
JOIN levels l ON t.level_id = l.level_id
JOIN programs p ON l.program_id = p.program_id
LEFT JOIN student_timetables st ON t.timetable_id = st.timetable_id AND st.status = 'active'
WHERE t.is_active = true
GROUP BY t.timetable_id, s.name, s.subject_id, l.name, l.level_id, p.name;

-- Live classes view
CREATE OR REPLACE VIEW live_classes_view AS
SELECT 
    lc.live_class_id,
    lc.title,
    lc.description,
    lc.scheduled_date,
    lc.start_time,
    lc.end_time,
    lc.meeting_link,
    lc.meeting_platform,
    lc.status,
    s.name as subject_name,
    l.name as level_name,
    p.name as program_name,
    CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
    COUNT(lcp.student_id) as participant_count
FROM live_classes lc
JOIN subjects s ON lc.subject_id = s.subject_id
JOIN levels l ON lc.level_id = l.level_id
JOIN programs p ON l.program_id = p.program_id
JOIN teachers te ON lc.teacher_id = te.teacher_id
JOIN users u ON te.user_id = u.id
LEFT JOIN live_class_participants lcp ON lc.live_class_id = lcp.live_class_id
GROUP BY lc.live_class_id, s.name, l.name, p.name, u.first_name, u.last_name;
