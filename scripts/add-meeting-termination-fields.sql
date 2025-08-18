-- Add meeting termination fields to live_classes table
-- This script adds fields to track when meetings are terminated and their status

BEGIN;

-- Add new columns for meeting termination tracking
ALTER TABLE live_classes 
ADD COLUMN IF NOT EXISTS meeting_terminated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS meeting_status VARCHAR(50) DEFAULT 'active' CHECK (meeting_status IN ('active', 'terminated', 'ended', 'disconnected'));

-- Add index for better performance on meeting status queries
CREATE INDEX IF NOT EXISTS idx_live_classes_meeting_status ON live_classes(meeting_status);
CREATE INDEX IF NOT EXISTS idx_live_classes_terminated_at ON live_classes(meeting_terminated_at);

-- Add comment to document the new fields
COMMENT ON COLUMN live_classes.meeting_terminated_at IS 'Timestamp when the meeting was terminated by the teacher';
COMMENT ON COLUMN live_classes.meeting_status IS 'Current status of the meeting: active, terminated, ended, or disconnected';

-- Update existing completed classes to have terminated meeting status
UPDATE live_classes 
SET 
  meeting_status = 'terminated',
  meeting_terminated_at = COALESCE(ended_at, updated_at)
WHERE status = 'completed' 
  AND meeting_terminated_at IS NULL;

-- Create a view for meeting termination analytics
CREATE OR REPLACE VIEW meeting_termination_analytics AS
SELECT 
  live_class_id,
  title,
  meeting_platform,
  status,
  meeting_status,
  scheduled_date,
  start_time,
  end_time,
  started_at,
  ended_at,
  meeting_terminated_at,
  CASE 
    WHEN meeting_terminated_at IS NOT NULL THEN 
      EXTRACT(EPOCH FROM (meeting_terminated_at - COALESCE(started_at, scheduled_date::timestamp + start_time::time))) / 60
    ELSE NULL
  END as meeting_duration_minutes,
  CASE 
    WHEN meeting_terminated_at IS NOT NULL AND ended_at IS NOT NULL THEN
      EXTRACT(EPOCH FROM (meeting_terminated_at - ended_at)) / 60
    ELSE NULL
  END as termination_delay_minutes
FROM live_classes
WHERE meeting_terminated_at IS NOT NULL;

-- Grant permissions on the new view
GRANT SELECT ON meeting_termination_analytics TO authenticated;

-- Create a function to automatically update meeting status when class ends
CREATE OR REPLACE FUNCTION update_meeting_status_on_class_end()
RETURNS TRIGGER AS $$
BEGIN
  -- If class status is being set to completed, update meeting status
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.meeting_status = 'terminated';
    NEW.meeting_terminated_at = COALESCE(NEW.ended_at, NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update meeting status
DROP TRIGGER IF EXISTS trigger_update_meeting_status ON live_classes;
CREATE TRIGGER trigger_update_meeting_status
  BEFORE UPDATE ON live_classes
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_status_on_class_end();

COMMIT;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'live_classes' 
  AND column_name IN ('meeting_terminated_at', 'meeting_status')
ORDER BY column_name;

-- Show sample data from the new view
SELECT * FROM meeting_termination_analytics LIMIT 5;
