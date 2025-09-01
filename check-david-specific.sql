-- Check David Waiswa's specific data and why dashboard shows no classes

-- 1. Check David's user details
SELECT 'DAVID USER INFO' as info,
       id,
       full_name,
       email,
       level_id,
       program_id,
       curriculum,
       "class"
FROM users
WHERE email = 'wdavid10@classbridge.ac.ug';

-- 2. Check what live classes exist and their details
SELECT 'EXISTING LIVE CLASSES' as info,
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
ORDER BY scheduled_date, start_time;

-- 3. Check if David's program_id matches any live classes
SELECT 'PROGRAM MATCH CHECK' as info,
       david_program_id,
       live_class_program_ids,
       has_match
FROM (
  SELECT 
    (SELECT program_id FROM users WHERE email = 'wdavid10@classbridge.ac.ug') as david_program_id,
    ARRAY_AGG(DISTINCT program_id) as live_class_program_ids,
    (SELECT program_id FROM users WHERE email = 'wdavid10@classbridge.ac.ug') = ANY(ARRAY_AGG(DISTINCT program_id)) as has_match
  FROM live_classes
) as check_program;

-- 4. Check if David's level_id matches any live classes
SELECT 'LEVEL MATCH CHECK' as info,
       david_level_id,
       live_class_level_ids,
       has_match
FROM (
  SELECT 
    (SELECT level_id FROM users WHERE email = 'wdavid10@classbridge.ac.ug') as david_level_id,
    ARRAY_AGG(DISTINCT level_id) as live_class_level_ids,
    (SELECT level_id FROM users WHERE email = 'wdavid10@classbridge.ac.ug') = ANY(ARRAY_AGG(DISTINCT level_id)) as has_match
  FROM live_classes
) as check_level;

-- 5. Check if there are classes for today specifically
SELECT 'TODAY CHECK' as info,
       CURRENT_DATE as today_date,
       COUNT(*) as classes_today,
       ARRAY_AGG(DISTINCT scheduled_date) as dates_with_classes
FROM live_classes
WHERE scheduled_date = CURRENT_DATE;

-- 6. Check if David can see any classes (regardless of date)
SELECT 'DAVID VISIBILITY CHECK' as info,
       COUNT(*) as total_visible_classes,
       COUNT(CASE WHEN scheduled_date = CURRENT_DATE THEN 1 END) as today_visible_classes
FROM live_classes
WHERE (program_id = (SELECT program_id FROM users WHERE email = 'wdavid10@classbridge.ac.ug')
       OR level_id = (SELECT level_id FROM users WHERE email = 'wdavid10@classbridge.ac.ug'));
