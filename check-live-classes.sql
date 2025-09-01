-- Check live_classes data for David Waiswa

-- Check if student exists and get their details
SELECT 'STUDENT INFO' as info,
       id,
       full_name,
       email,
       level_id,
       program_id
FROM users
WHERE email = 'wdavid10@classbridge.ac.ug';

-- Check if live_classes table has any data
SELECT 'LIVE_CLASSES TABLE INFO' as info,
       COUNT(*) as total_records
FROM live_classes;

-- Check all live classes for this student's program
SELECT 'ALL LIVE CLASSES' as info,
       lc.live_class_id,
       lc.title,
       lc.scheduled_date,
       lc.start_time,
       lc.end_time,
       lc.status,
       lc.program_id,
       s.name as subject_name,
       u.full_name as teacher_name
FROM live_classes lc
LEFT JOIN subjects s ON lc.subject_id = s.subject_id
LEFT JOIN teachers t ON lc.teacher_id = t.teacher_id
LEFT JOIN users u ON t.user_id = u.id
ORDER BY lc.scheduled_date DESC, lc.start_time;

-- Check live classes for today
SELECT 'TODAYS LIVE CLASSES' as info,
       lc.live_class_id,
       lc.title,
       lc.scheduled_date,
       lc.start_time,
       lc.end_time,
       lc.status,
       s.name as subject_name
FROM live_classes lc
LEFT JOIN subjects s ON lc.subject_id = s.subject_id
WHERE lc.scheduled_date = CURRENT_DATE
ORDER BY lc.start_time;

-- Check live classes for this student's program
SELECT 'PROGRAM LIVE CLASSES' as info,
       lc.live_class_id,
       lc.title,
       lc.scheduled_date,
       lc.start_time,
       lc.end_time,
       lc.status,
       s.name as subject_name
FROM live_classes lc
LEFT JOIN subjects s ON lc.subject_id = s.subject_id
WHERE lc.program_id = (
  SELECT program_id FROM users WHERE email = 'wdavid10@classbridge.ac.ug'
)
ORDER BY lc.scheduled_date DESC, lc.start_time;

-- Check if there are any live classes for this student's level
SELECT 'LEVEL LIVE CLASSES' as info,
       lc.live_class_id,
       lc.title,
       lc.scheduled_date,
       lc.start_time,
       lc.end_time,
       lc.status,
       s.name as subject_name
FROM live_classes lc
LEFT JOIN subjects s ON lc.subject_id = s.subject_id
WHERE lc.level_id = (
  SELECT level_id FROM users WHERE email = 'wdavid10@classbridge.ac.ug'
)
ORDER BY lc.scheduled_date DESC, lc.start_time;

-- Check sample live_classes structure
SELECT 'SAMPLE LIVE_CLASSES' as info,
       live_class_id,
       title,
       scheduled_date,
       start_time,
       end_time,
       status,
       program_id,
       level_id,
       subject_id
FROM live_classes
LIMIT 5;

-- Check if there are any live classes at all (regardless of student)
SELECT 'ANY LIVE CLASSES' as info,
       COUNT(*) as total_live_classes,
       COUNT(DISTINCT program_id) as programs_with_classes,
       COUNT(DISTINCT level_id) as levels_with_classes,
       MIN(scheduled_date) as earliest_class,
       MAX(scheduled_date) as latest_class
FROM live_classes;
