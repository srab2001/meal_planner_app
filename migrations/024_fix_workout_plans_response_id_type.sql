-- Migration 024: Fix workout_plans.created_from_response_id type mismatch
-- The fitness_interview_responses.id is UUID but created_from_response_id was INTEGER

-- Drop the existing foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'workout_plans_created_from_response_id_fkey'
    AND table_name = 'workout_plans'
  ) THEN
    ALTER TABLE workout_plans DROP CONSTRAINT workout_plans_created_from_response_id_fkey;
  END IF;
END$$;

-- Alter the column type from INTEGER to UUID (if needed)
DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_name = 'workout_plans' AND column_name = 'created_from_response_id';

  IF col_type IS NOT NULL AND col_type != 'uuid' THEN
    -- The column exists but is wrong type, we need to recreate it
    -- First drop the column
    ALTER TABLE workout_plans DROP COLUMN IF EXISTS created_from_response_id;
    -- Re-add with correct UUID type
    ALTER TABLE workout_plans ADD COLUMN created_from_response_id UUID REFERENCES fitness_interview_responses(id) ON DELETE SET NULL;
  ELSIF col_type IS NULL THEN
    -- Column doesn't exist, add it
    ALTER TABLE workout_plans ADD COLUMN created_from_response_id UUID REFERENCES fitness_interview_responses(id) ON DELETE SET NULL;
  END IF;
END$$;

COMMENT ON COLUMN workout_plans.created_from_response_id IS 'UUID reference to fitness_interview_responses';
