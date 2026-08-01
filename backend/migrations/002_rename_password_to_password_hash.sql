-- Migration 002: Rename `password` column to `password_hash` if needed
-- IMPORTANT: Review and run in a safe environment; backup your DB first.

BEGIN;

-- Check if column 'password' exists and 'password_hash' does not
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='password'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='password_hash'
  ) THEN
    ALTER TABLE users RENAME COLUMN password TO password_hash;
  END IF;
END$$;

COMMIT;
