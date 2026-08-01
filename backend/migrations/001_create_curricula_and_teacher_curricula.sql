-- Migration 001: Create `curricula` and `teacher_curricula` tables

BEGIN;

-- 1. Create curricula lookup table
CREATE TABLE IF NOT EXISTS curricula (
  curriculum_id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

-- 2. Create teacher_curricula join table for many-to-many relation
CREATE TABLE IF NOT EXISTS teacher_curricula (
  teacher_id INTEGER NOT NULL,
  curriculum_id INTEGER NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (teacher_id, curriculum_id),
  CONSTRAINT fk_teacher FOREIGN KEY (teacher_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_curriculum FOREIGN KEY (curriculum_id) REFERENCES curricula(curriculum_id) ON DELETE CASCADE
);

COMMIT;
