-- Add a live class for today so the dashboard shows classes

-- First, let's see what today's date is
SELECT 'TODAY INFO' as info,
       CURRENT_DATE as today_date,
       TO_CHAR(CURRENT_DATE, 'Day') as today_day;

-- Add a live class for today
INSERT INTO live_classes (
  live_class_id,
  title,
  description,
  scheduled_date,
  start_time,
  end_time,
  meeting_link,
  meeting_platform,
  status,
  subject_id,
  program_id,
  level_id,
  teacher_id
) VALUES (
  gen_random_uuid(),
  'Mathematics - Algebra Basics',
  'Introduction to algebraic expressions and equations',
  CURRENT_DATE,
  '10:00:00',
  '11:30:00',
  'https://meet.google.com/test-link',
  'Google Meet',
  'scheduled',
  'fa6707f1-d811-4c86-b615-5e5392f41015', -- Mathematics subject_id
  '0e5fac6d-a1cc-4666-b82c-8cf1c47ec385', -- Same program_id as other classes
  'd6e96dd9-9f2d-463b-8bec-c10c79999741', -- Same level_id as other classes
  (SELECT teacher_id FROM teachers LIMIT 1) -- Get first available teacher
);

-- Verify the class was added
SELECT 'VERIFICATION' as info,
       live_class_id,
       title,
       scheduled_date,
       start_time,
       end_time,
       status
FROM live_classes
WHERE scheduled_date = CURRENT_DATE
ORDER BY start_time;
