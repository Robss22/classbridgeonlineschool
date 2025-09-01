-- Check student timetable data for Nabateesa Abigail

-- Check if student exists
SELECT 'STUDENT INFO' as info,
       id,
       full_name,
       email,
       level_id,
       curriculum
FROM users
WHERE email = 'anabateesa10@classbridge.ac.ug';

-- Check if timetables table has data for this student
SELECT 'TIMETABLE COUNT' as info,
       COUNT(*) as total_timetables
FROM timetables
WHERE user_id = (SELECT id FROM users WHERE email = 'anabateesa10@classbridge.ac.ug');

-- Check all timetables for this student
SELECT 'STUDENT TIMETABLES' as info,
       t.timetable_id,
       t.user_id,
       t.day_of_week,
       t.start_time,
       t.end_time,
       t.subject_id,
       s.name as subject_name,
       t.meeting_link
FROM timetables t
LEFT JOIN subjects s ON t.subject_id = s.subject_id
WHERE t.user_id = (SELECT id FROM users WHERE email = 'anabateesa10@classbridge.ac.ug')
ORDER BY t.day_of_week, t.start_time;

-- Check what day it is today
SELECT 'TODAY INFO' as info,
       CURRENT_DATE as today_date,
       TO_CHAR(CURRENT_DATE, 'Day') as today_day,
       EXTRACT(DOW FROM CURRENT_DATE) as day_of_week_number;

-- Check if there are any timetables for today's day of week
SELECT 'TODAYS TIMETABLES' as info,
       t.timetable_id,
       t.day_of_week,
       t.start_time,
       t.end_time,
       s.name as subject_name
FROM timetables t
LEFT JOIN subjects s ON t.subject_id = s.subject_id
WHERE t.user_id = (SELECT id FROM users WHERE email = 'anabateesa10@classbridge.ac.ug')
  AND t.day_of_week = TO_CHAR(CURRENT_DATE, 'Day')
ORDER BY t.start_time;

-- Check if timetables table exists and has any data
SELECT 'TIMETABLES TABLE INFO' as info,
       COUNT(*) as total_records
FROM timetables;

-- Show sample timetables
SELECT 'SAMPLE TIMETABLES' as info,
       timetable_id,
       user_id,
       day_of_week,
       start_time,
       end_time,
       subject_id
FROM timetables
LIMIT 5;
