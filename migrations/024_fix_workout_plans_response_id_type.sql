-- Migration 024: Fix workout_plans.created_from_response_id type mismatch
-- Match the type of fitness_interview_responses.id (could be INTEGER or UUID depending on setup)

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

-- Check the type of fitness_interview_responses.id and match it
DO $$
DECLARE
  ref_type text;
  col_type text;
BEGIN
  -- Get the type of fitness_interview_responses.id
  SELECT data_type INTO ref_type
  FROM information_schema.columns
  WHERE table_name = 'fitness_interview_responses' AND column_name = 'id';

  -- Get current type of workout_plans.created_from_response_id
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_name = 'workout_plans' AND column_name = 'created_from_response_id';

  -- If ref table doesn't exist or has no id, skip
  IF ref_type IS NULL THEN
    RAISE NOTICE 'fitness_interview_responses table or id column not found, skipping';
    RETURN;
  END IF;

  -- Drop and recreate with correct type if needed
  IF col_type IS NOT NULL AND col_type != ref_type THEN
    ALTER TABLE workout_plans DROP COLUMN IF EXISTS created_from_response_id;
    IF ref_type = 'uuid' THEN
      ALTER TABLE workout_plans ADD COLUMN created_from_response_id UUID REFERENCES fitness_interview_responses(id) ON DELETE SET NULL;
    ELSE
      ALTER TABLE workout_plans ADD COLUMN created_from_response_id INTEGER REFERENCES fitness_interview_responses(id) ON DELETE SET NULL;
    END IF;
  ELSIF col_type IS NULL THEN
    -- Column doesn't exist, add it with matching type
    IF ref_type = 'uuid' THEN
      ALTER TABLE workout_plans ADD COLUMN created_from_response_id UUID REFERENCES fitness_interview_responses(id) ON DELETE SET NULL;
    ELSE
      ALTER TABLE workout_plans ADD COLUMN created_from_response_id INTEGER REFERENCES fitness_interview_responses(id) ON DELETE SET NULL;
    END IF;
  END IF;
END$$;

COMMENT ON COLUMN workout_plans.created_from_response_id IS 'Reference to fitness_interview_responses';
