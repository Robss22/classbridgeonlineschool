-- Fix Subjects Server Query
-- Create a function that bypasses RLS for admin subjects query

-- Create a function to get all subjects (bypasses RLS)
CREATE OR REPLACE FUNCTION get_all_subjects()
RETURNS TABLE (
    subject_id uuid,
    name text,
    description text,
    created_at timestamptz
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.subject_id,
        s.name,
        s.description,
        s.created_at
    FROM subjects s
    ORDER BY s.name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_subjects() TO authenticated;

-- Test the function
SELECT 
    'FUNCTION TEST' as info,
    subject_id,
    name,
    description
FROM get_all_subjects();

-- Also create a simpler fix: disable RLS temporarily for testing
-- ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;

-- Test direct query without RLS
-- SELECT 
--     'NO RLS TEST' as info,
--     subject_id,
--     name,
--     description
-- FROM subjects
-- ORDER BY name;

-- Re-enable RLS after testing
-- ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
