-- Seed data for ClassBridge Online School
-- This file populates the basic tables with initial data

-- Insert basic academic programs
INSERT INTO programs (program_id, name, description, duration_years, is_active, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Primary Education', 'Basic primary education program', 6, true, NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Secondary Education', 'Secondary education program', 6, true, NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'High School', 'High school education program', 3, true, NOW());

-- Insert basic levels
INSERT INTO levels (level_id, program_id, name, description, is_active, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'Grade 1', 'First grade of primary education', true, NOW()),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 'Grade 2', 'Second grade of primary education', true, NOW()),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440001', 'Grade 3', 'Third grade of primary education', true, NOW()),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440001', 'Grade 4', 'Fourth grade of primary education', true, NOW()),
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440001', 'Grade 5', 'Fifth grade of primary education', true, NOW()),
('550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440001', 'Grade 6', 'Sixth grade of primary education', true, NOW()),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440002', 'Grade 7', 'First grade of secondary education', true, NOW()),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440002', 'Grade 8', 'Second grade of secondary education', true, NOW()),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440002', 'Grade 9', 'Third grade of secondary education', true, NOW()),
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440002', 'Grade 10', 'Fourth grade of secondary education', true, NOW()),
('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440002', 'Grade 11', 'Fifth grade of secondary education', true, NOW()),
('550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440002', 'Grade 12', 'Sixth grade of secondary education', true, NOW()),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440003', 'Year 1', 'First year of high school', true, NOW()),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440003', 'Year 2', 'Second year of high school', true, NOW()),
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440003', 'Year 3', 'Third year of high school', true, NOW());

-- Insert basic subjects
INSERT INTO subjects (subject_id, name, description, is_active, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440041', 'Mathematics', 'Core mathematics subject', true, NOW()),
('550e8400-e29b-41d4-a716-446655440042', 'English Language', 'Core English language subject', true, NOW()),
('550e8400-e29b-41d4-a716-446655440043', 'Science', 'Core science subject', true, NOW()),
('550e8400-e29b-41d4-a716-446655440044', 'Social Studies', 'Core social studies subject', true, NOW()),
('550e8400-e29b-41d4-a716-446655440045', 'Physical Education', 'Physical education and sports', true, NOW()),
('550e8400-e29b-41d4-a716-446655440046', 'Art and Craft', 'Creative arts and crafts', true, NOW()),
('550e8400-e29b-41d4-a716-446655440047', 'Music', 'Music education', true, NOW()),
('550e8400-e29b-41d4-a716-446655440048', 'Computer Science', 'Computer and technology education', true, NOW()),
('550e8400-e29b-41d4-a716-446655440049', 'History', 'World and local history', true, NOW()),
('550e8400-e29b-41d4-a716-446655440050', 'Geography', 'World geography and environmental studies', true, NOW());

-- Insert some sample teachers (if they don't exist)
INSERT INTO teachers (teacher_id, user_id, first_name, last_name, email, phone, specialization, qualification, experience_years, is_active, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440071', 'John', 'Doe', 'john.doe@classbridge.com', '+1234567890', 'Mathematics', 'MSc Mathematics', 5, true, NOW()),
('550e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440072', 'Jane', 'Smith', 'jane.smith@classbridge.com', '+1234567891', 'English', 'MA English Literature', 3, true, NOW()),
('550e8400-e29b-41d4-a716-446655440063', '550e8400-e29b-41d4-a716-446655440073', 'Mike', 'Johnson', 'mike.johnson@classbridge.com', '+1234567892', 'Science', 'PhD Physics', 7, true, NOW())
ON CONFLICT (teacher_id) DO NOTHING;

-- Insert some sample users (if they don't exist)
INSERT INTO users (id, email, role, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440071', 'john.doe@classbridge.com', 'teacher', NOW()),
('550e8400-e29b-41d4-a716-446655440072', 'jane.smith@classbridge.com', 'teacher', NOW()),
('550e8400-e29b-41d4-a716-446655440073', 'mike.johnson@classbridge.com', 'teacher', NOW())
ON CONFLICT (id) DO NOTHING;