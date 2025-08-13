-- Live Classes System Enhancements - Database Migrations
-- Run these SQL commands in your Supabase SQL editor

-- 1. Enhanced live_classes table
ALTER TABLE live_classes 
ADD COLUMN IF NOT EXISTS pre_class_buffer INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS meeting_password VARCHAR(10),
ADD COLUMN IF NOT EXISTS recording_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS waiting_room_enabled BOOLEAN DEFAULT TRUE;

-- 2. Enhanced live_class_participants table
ALTER TABLE live_class_participants 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS participation_score INTEGER,
ADD COLUMN IF NOT EXISTS device_info JSONB,
ADD COLUMN IF NOT EXISTS technical_data JSONB,
ADD COLUMN IF NOT EXISTS connection_quality VARCHAR(10) DEFAULT 'good',
ADD COLUMN IF NOT EXISTS audio_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS video_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS screen_shared BOOLEAN DEFAULT FALSE;

-- 3. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_classes_status_date ON live_classes(status, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_live_class_participants_class_id ON live_class_participants(live_class_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- 5. Add RLS policies for notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own notifications
CREATE POLICY "Users can read their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for inserting notifications (admin only)
CREATE POLICY "Admins can insert notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT user_id FROM users WHERE role = 'admin'
  ));

-- Policy for updating notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. Create function to calculate participation score
CREATE OR REPLACE FUNCTION calculate_participation_score(
  duration_minutes INTEGER,
  technical_data JSONB DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  duration_score INTEGER := 0;
  engagement_score INTEGER := 0;
BEGIN
  -- Base score from duration (60% weight)
  duration_score := LEAST((duration_minutes::NUMERIC / 60) * 100, 100);
  score := score + (duration_score * 0.6);
  
  -- Technical engagement score (40% weight)
  IF technical_data IS NOT NULL THEN
    IF (technical_data->>'audio_enabled')::BOOLEAN THEN
      engagement_score := engagement_score + 20;
    END IF;
    
    IF (technical_data->>'video_enabled')::BOOLEAN THEN
      engagement_score := engagement_score + 20;
    END IF;
    
    IF (technical_data->>'screen_shared')::BOOLEAN THEN
      engagement_score := engagement_score + 20;
    END IF;
    
    IF technical_data->>'connection_quality' = 'good' THEN
      engagement_score := engagement_score + 20;
    ELSIF technical_data->>'connection_quality' = 'fair' THEN
      engagement_score := engagement_score + 10;
    END IF;
    
    score := score + (engagement_score * 0.4);
  END IF;
  
  RETURN LEAST(ROUND(score), 100);
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to auto-update class statuses
CREATE OR REPLACE FUNCTION auto_update_live_class_statuses() RETURNS VOID AS $$
BEGIN
  -- Update classes that should be ongoing
  UPDATE live_classes 
  SET 
    status = 'ongoing',
    started_at = NOW()
  WHERE 
    status = 'scheduled' 
    AND scheduled_date <= CURRENT_DATE
    AND start_time <= CURRENT_TIME
    AND end_time > CURRENT_TIME;
  
  -- Update classes that should be completed
  UPDATE live_classes 
  SET 
    status = 'completed',
    ended_at = NOW()
  WHERE 
    status = 'ongoing' 
    AND (
      scheduled_date < CURRENT_DATE 
      OR (scheduled_date = CURRENT_DATE AND end_time < CURRENT_TIME)
    );
END;
$$ LANGUAGE plpgsql;

-- 8. Create a scheduled job to run auto-update (optional - requires pg_cron extension)
-- Uncomment if you have pg_cron extension enabled
/*
SELECT cron.schedule(
  'auto-update-live-class-statuses',
  '*/5 * * * *', -- Every 5 minutes
  'SELECT auto_update_live_class_statuses();'
);
*/

-- 9. Create view for analytics data
CREATE OR REPLACE VIEW live_class_analytics AS
SELECT 
  lc.live_class_id,
  lc.title,
  lc.scheduled_date,
  lc.start_time,
  lc.end_time,
  lc.meeting_platform,
  lc.status,
  COUNT(lcp.student_id) as total_participants,
  AVG(lcp.duration_minutes) as avg_duration,
  AVG(lcp.participation_score) as avg_participation_score,
  COUNT(CASE WHEN lcp.connection_quality = 'good' THEN 1 END) as good_connections,
  COUNT(CASE WHEN lcp.connection_quality = 'fair' THEN 1 END) as fair_connections,
  COUNT(CASE WHEN lcp.connection_quality = 'poor' THEN 1 END) as poor_connections,
  COUNT(CASE WHEN lcp.audio_enabled THEN 1 END) as audio_enabled_count,
  COUNT(CASE WHEN lcp.video_enabled THEN 1 END) as video_enabled_count
FROM live_classes lc
LEFT JOIN live_class_participants lcp ON lc.live_class_id = lcp.live_class_id
GROUP BY lc.live_class_id, lc.title, lc.scheduled_date, lc.start_time, lc.end_time, lc.meeting_platform, lc.status;

-- 10. Grant necessary permissions
GRANT SELECT ON live_class_analytics TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;

-- 11. Add comments for documentation
COMMENT ON TABLE live_classes IS 'Enhanced live classes table with security and analytics features';
COMMENT ON TABLE live_class_participants IS 'Enhanced attendance tracking with detailed metrics';
COMMENT ON TABLE notifications IS 'System notifications for live class events';
COMMENT ON FUNCTION calculate_participation_score IS 'Calculates participation score based on duration and technical engagement';
COMMENT ON FUNCTION auto_update_live_class_statuses IS 'Automatically updates live class statuses based on time';

-- Migration completed successfully!
-- Run this script in your Supabase SQL editor to set up all required database changes.
