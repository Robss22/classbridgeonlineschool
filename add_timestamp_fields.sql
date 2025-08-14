-- Add timestamp fields to live_classes table for automatic start/end tracking
-- Run this in your Supabase SQL Editor

-- Add started_at and ended_at columns if they don't exist
ALTER TABLE live_classes 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance on timestamp queries
CREATE INDEX IF NOT EXISTS idx_live_classes_started_at ON live_classes(started_at);
CREATE INDEX IF NOT EXISTS idx_live_classes_ended_at ON live_classes(ended_at);
CREATE INDEX IF NOT EXISTS idx_live_classes_status_date ON live_classes(status, scheduled_date);

-- Create a function to automatically update class statuses
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION auto_update_live_class_statuses() TO authenticated;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
