-- Migration: Create assessments table for Supabase
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL,
  program_id text NOT NULL,
  level_id text NOT NULL,
  subject_id text NOT NULL,
  due_date timestamptz,
  file_url text,
  creator_id text NOT NULL,
  paper_id text,
  created_at timestamptz DEFAULT now()
);
-- Add indexes and foreign keys as needed
