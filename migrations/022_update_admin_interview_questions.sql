-- Migration: 022_update_admin_interview_questions.sql
-- Purpose: Convert admin_interview_questions.options to jsonb where possible
-- and add a display_style column to allow UI rendering hints (radio|dropdown)

BEGIN;

-- Add a temporary jsonb column
ALTER TABLE IF EXISTS admin_interview_questions
  ADD COLUMN IF NOT EXISTS options_json jsonb;

-- Populate options_json safely: if options looks like JSON array/object, cast it;
-- otherwise, wrap the existing text into a JSON array of a single string.
UPDATE admin_interview_questions
SET options_json = (
  CASE
    WHEN options IS NULL THEN '[]'::jsonb
    -- If trimmed text starts with [ or { we assume it's JSON
    WHEN trim(options::text) LIKE '[%' THEN options::jsonb
    WHEN trim(options::text) LIKE '{%' THEN options::jsonb
    ELSE to_json(options::text)::jsonb
  END
);

-- If the main typed column 'options' exists and is not jsonb, drop it and rename options_json
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_interview_questions' AND column_name='options') THEN
    -- Drop text/other typed 'options' column
    ALTER TABLE admin_interview_questions DROP COLUMN IF EXISTS options;
  END IF;
  -- Rename options_json to options (jsonb) only if options_json exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_interview_questions' AND column_name='options_json') THEN
    EXECUTE 'ALTER TABLE admin_interview_questions RENAME COLUMN options_json TO options';
  END IF;
END$$;

-- Add display_style column to hint how client should render options
ALTER TABLE IF EXISTS admin_interview_questions
  ADD COLUMN IF NOT EXISTS display_style VARCHAR(30);

COMMIT;
