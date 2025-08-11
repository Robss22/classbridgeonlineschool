-- Description: Add all missing columns to live_classes table
-- Date: August 10, 2025
-- Author: System Administrator

-- Migration
BEGIN;

-- First, create the status enum type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'live_class_status') THEN
        CREATE TYPE live_class_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');
    END IF;
END$$;

-- Add all missing columns to live_classes table
ALTER TABLE live_classes
    -- Basic information
    ADD COLUMN IF NOT EXISTS title TEXT NOT NULL,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS scheduled_date DATE NOT NULL,
    ADD COLUMN IF NOT EXISTS start_time TIME NOT NULL,
    ADD COLUMN IF NOT EXISTS end_time TIME NOT NULL,
    
    -- Meeting details
    ADD COLUMN IF NOT EXISTS meeting_link TEXT,
    ADD COLUMN IF NOT EXISTS meeting_platform TEXT NOT NULL DEFAULT 'Google Meet',
    
    -- Status
    ADD COLUMN IF NOT EXISTS status live_class_status NOT NULL DEFAULT 'scheduled',
    
    -- Foreign key references
    ADD COLUMN IF NOT EXISTS teacher_id UUID NOT NULL REFERENCES teachers(teacher_id),
    ADD COLUMN IF NOT EXISTS program_id UUID NOT NULL REFERENCES programs(program_id),
    ADD COLUMN IF NOT EXISTS level_id UUID NOT NULL REFERENCES levels(level_id),
    ADD COLUMN IF NOT EXISTS subject_id UUID NOT NULL REFERENCES subjects(subject_id),
    ADD COLUMN IF NOT EXISTS paper_id UUID REFERENCES papers(paper_id);

-- Create indexes for foreign keys to improve query performance
CREATE INDEX IF NOT EXISTS idx_live_classes_teacher_id ON live_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_program_id ON live_classes(program_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_level_id ON live_classes(level_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_subject_id ON live_classes(subject_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_paper_id ON live_classes(paper_id);

-- Create index on scheduled_date and start_time for efficient querying of upcoming classes
CREATE INDEX IF NOT EXISTS idx_live_classes_schedule ON live_classes(scheduled_date, start_time);

-- Refresh PostgREST schema cache to prevent PGRST204 errors
NOTIFY pgrst, 'reload schema';

-- Verification query
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'live_classes'
ORDER BY ordinal_position;

COMMIT;
