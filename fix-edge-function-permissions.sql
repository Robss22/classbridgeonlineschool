-- Grant necessary permissions to the authenticated role
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON auth.users TO service_role;

-- Grant permissions on the applications table
GRANT ALL ON applications TO service_role;

-- Grant permissions on the profiles table
GRANT ALL ON profiles TO service_role;

-- Grant permissions on the enrollments table
GRANT ALL ON enrollments TO service_role;

-- Update RLS policies to allow service_role to perform operations
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can do anything" ON applications
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can do anything" ON profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can do anything" ON enrollments
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
