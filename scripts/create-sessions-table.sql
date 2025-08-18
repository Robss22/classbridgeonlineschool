-- Create sessions table for single-device login management
-- This table tracks active user sessions and prevents multiple concurrent logins

BEGIN;

-- Enable UUID extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL, -- Unique device identifier
    device_name VARCHAR(255), -- Human-readable device name
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
    browser VARCHAR(100), -- Browser name and version
    os VARCHAR(100), -- Operating system
    ip_address INET, -- IP address of the device
    user_agent TEXT, -- Full user agent string
    login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_id ON user_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Create unique constraint to ensure only one active session per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_sessions_unique_active 
ON user_sessions(user_id) WHERE is_active = true;

-- Create function to update last_activity timestamp
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity = NOW();
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update activity timestamp
CREATE TRIGGER trigger_update_session_activity
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_session_activity();

-- Create function to deactivate old sessions when new login occurs
CREATE OR REPLACE FUNCTION deactivate_old_sessions()
RETURNS TRIGGER AS $$
BEGIN
    -- Deactivate all other active sessions for this user
    UPDATE user_sessions 
    SET is_active = false, updated_at = NOW()
    WHERE user_id = NEW.user_id 
      AND session_id != NEW.session_id 
      AND is_active = true;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically deactivate old sessions
CREATE TRIGGER trigger_deactivate_old_sessions
    AFTER INSERT ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION deactivate_old_sessions();

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    UPDATE user_sessions 
    SET is_active = false, updated_at = NOW()
    WHERE expires_at < NOW() AND is_active = true;
    
    -- Optionally delete very old sessions (older than 30 days)
    DELETE FROM user_sessions 
    WHERE created_at < (NOW() - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired sessions (if pg_cron is available)
-- Uncomment if you have pg_cron extension enabled
-- SELECT cron.schedule(
--     'cleanup-expired-sessions',
--     '*/15 * * * *', -- Every 15 minutes
--     'SELECT cleanup_expired_sessions();'
-- );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO authenticated;

-- Create RLS policies
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own sessions
CREATE POLICY "Users can create own sessions" ON user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own sessions
CREATE POLICY "Users can update own sessions" ON user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own sessions
CREATE POLICY "Users can delete own sessions" ON user_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Create view for session analytics
CREATE OR REPLACE VIEW session_analytics AS
SELECT 
    us.session_id,
    us.user_id,
    u.email,
    u.raw_user_meta_data->>'role' as user_role,
    us.device_name,
    us.device_type,
    us.browser,
    us.os,
    us.ip_address,
    us.login_time,
    us.last_activity,
    us.expires_at,
    us.is_active,
    EXTRACT(EPOCH FROM (us.last_activity - us.login_time)) / 60 as session_duration_minutes,
    EXTRACT(EPOCH FROM (NOW() - us.last_activity)) / 60 as minutes_since_last_activity
FROM user_sessions us
JOIN auth.users u ON us.user_id = u.id
ORDER BY us.login_time DESC;

-- Grant permissions on the view
GRANT SELECT ON session_analytics TO authenticated;

COMMIT;

-- Verify the setup
SELECT 'Sessions table created successfully' as status;

-- Show the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_sessions'
ORDER BY ordinal_position;
