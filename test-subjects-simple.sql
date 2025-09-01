-- Very Simple Test - Run this first

-- Test 1: Can we access the subjects table?
SELECT * FROM subjects LIMIT 5;

-- Test 2: How many subjects are there?
SELECT COUNT(*) as subject_count FROM subjects;

-- Test 3: What are the subject names?
SELECT name FROM subjects ORDER BY name;
