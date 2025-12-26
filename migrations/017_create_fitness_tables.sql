-- Create all fitness tables and seed exercise library
-- This consolidates fitness schema into the main database

-- ============================================================================
-- FITNESS PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS fitness_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  height_cm INT,
  weight_kg DECIMAL(6, 2),
  age INT,
  gender VARCHAR(50),
  activity_level VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fitness_profiles_user_id ON fitness_profiles(user_id);

-- ============================================================================
-- FITNESS GOALS
-- ============================================================================
CREATE TABLE IF NOT EXISTS fitness_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  goal_type VARCHAR(50) NOT NULL,
  target_value DECIMAL(8, 2),
  unit VARCHAR(20),
  start_date DATE,
  target_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fitness_goals_user_id ON fitness_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_fitness_goals_status ON fitness_goals(status);

-- ============================================================================
-- FITNESS WORKOUTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS fitness_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workout_date DATE NOT NULL,
  workout_type VARCHAR(50),
  duration_minutes INT,
  notes TEXT,
  workout_data JSONB,
  intensity VARCHAR(20),
  calories_burned INT,
  difficulty_rating INT,
  interview_responses JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fitness_workouts_user_id ON fitness_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_fitness_workouts_date ON fitness_workouts(workout_date);
CREATE INDEX IF NOT EXISTS idx_fitness_workouts_intensity ON fitness_workouts(intensity);

-- ============================================================================
-- FITNESS WORKOUT EXERCISES
-- ============================================================================
CREATE TABLE IF NOT EXISTS fitness_workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL,
  exercise_name VARCHAR(255) NOT NULL,
  exercise_order INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workout_id) REFERENCES fitness_workouts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fitness_workout_exercises_workout_id ON fitness_workout_exercises(workout_id);

-- ============================================================================
-- FITNESS WORKOUT SETS
-- ============================================================================
CREATE TABLE IF NOT EXISTS fitness_workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL,
  set_number INT NOT NULL,
  reps INT,
  weight DECIMAL(8, 2),
  duration_seconds INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exercise_id) REFERENCES fitness_workout_exercises(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fitness_workout_sets_exercise_id ON fitness_workout_sets(exercise_id);

-- ============================================================================
-- EXERCISE DEFINITIONS (Master Exercise Library)
-- ============================================================================
CREATE TABLE IF NOT EXISTS exercise_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  muscle_group VARCHAR(100),
  secondary_muscles TEXT[],
  equipment VARCHAR(50),
  difficulty_level VARCHAR(20) DEFAULT 'beginner',
  form_tips TEXT[],
  video_url TEXT,
  is_compound BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exercise_definitions_category ON exercise_definitions(category);
CREATE INDEX IF NOT EXISTS idx_exercise_definitions_difficulty ON exercise_definitions(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_exercise_definitions_active ON exercise_definitions(is_active);
CREATE INDEX IF NOT EXISTS idx_exercise_definitions_equipment ON exercise_definitions(equipment);

-- ============================================================================
-- SEED EXERCISE LIBRARY (40 exercises)
-- ============================================================================
INSERT INTO exercise_definitions (name, description, category, muscle_group, secondary_muscles, equipment, difficulty_level, form_tips, is_compound, is_active) VALUES
-- CHEST (5)
('Barbell Bench Press', 'Classic compound chest exercise', 'chest', 'pectoralis major', ARRAY['triceps', 'anterior deltoids'], 'barbell', 'intermediate', ARRAY['Keep feet flat on floor', 'Bar should touch mid-chest', 'Full range of motion'], true, true),
('Dumbbell Incline Press', 'Upper chest focus', 'chest', 'upper pectoralis', ARRAY['anterior deltoids', 'triceps'], 'dumbbell', 'intermediate', ARRAY['Set bench to 30-45 degrees', 'Control the descent', 'Press until arms fully extended'], true, true),
('Push-ups', 'Bodyweight chest builder', 'chest', 'pectoralis major', ARRAY['triceps', 'core'], 'bodyweight', 'beginner', ARRAY['Keep body in straight line', 'Elbows at 45 degrees', 'Full range of motion'], true, true),
('Cable Chest Fly', 'Isolation movement for chest', 'chest', 'pectoralis major', ARRAY[]::TEXT[], 'cable', 'beginner', ARRAY['Slight bend in elbows', 'Squeeze at center', 'Control the negative'], false, true),
('Dips (Chest Focus)', 'Bodyweight compound movement', 'chest', 'lower pectoralis', ARRAY['triceps', 'anterior deltoids'], 'bodyweight', 'intermediate', ARRAY['Lean forward slightly', 'Go deep for chest activation', 'Control the movement'], true, true),

-- BACK (7)
('Pull-ups', 'King of back exercises', 'back', 'latissimus dorsi', ARRAY['biceps', 'rear deltoids'], 'bodyweight', 'intermediate', ARRAY['Full hang at bottom', 'Pull chin over bar', 'Control the descent'], true, true),
('Barbell Rows', 'Compound back thickness', 'back', 'latissimus dorsi', ARRAY['rhomboids', 'trapezius', 'biceps'], 'barbell', 'intermediate', ARRAY['Hinge at hips', 'Pull to lower chest', 'Keep back flat'], true, true),
('Lat Pulldowns', 'Vertical pulling movement', 'back', 'latissimus dorsi', ARRAY['biceps', 'rear deltoids'], 'machine', 'beginner', ARRAY['Pull to upper chest', 'Control the weight', 'Slight lean back'], true, true),
('Seated Cable Rows', 'Horizontal pulling', 'back', 'middle back', ARRAY['latissimus dorsi', 'biceps'], 'cable', 'beginner', ARRAY['Keep chest up', 'Pull to sternum', 'Squeeze shoulder blades'], true, true),
('Deadlifts', 'Ultimate compound movement', 'back', 'erector spinae', ARRAY['glutes', 'hamstrings', 'trapezius'], 'barbell', 'advanced', ARRAY['Neutral spine', 'Drive through heels', 'Hip hinge pattern'], true, true),
('Face Pulls', 'Rear delt and upper back', 'back', 'rear deltoids', ARRAY['rhomboids', 'trapezius'], 'cable', 'beginner', ARRAY['Pull to face level', 'External rotation', 'Squeeze shoulder blades'], false, true),
('T-Bar Rows', 'Thick back builder', 'back', 'latissimus dorsi', ARRAY['rhomboids', 'trapezius'], 'barbell', 'intermediate', ARRAY['Chest supported or bent over', 'Pull to chest', 'Control the weight'], true, true),

-- LEGS (8)
('Barbell Squats', 'King of leg exercises', 'legs', 'quadriceps', ARRAY['glutes', 'hamstrings', 'core'], 'barbell', 'intermediate', ARRAY['Depth to parallel or below', 'Knees track over toes', 'Keep chest up'], true, true),
('Romanian Deadlifts', 'Hamstring and glute focus', 'legs', 'hamstrings', ARRAY['glutes', 'erector spinae'], 'barbell', 'intermediate', ARRAY['Slight knee bend', 'Hinge at hips', 'Feel stretch in hamstrings'], true, true),
('Leg Press', 'Quad-focused compound', 'legs', 'quadriceps', ARRAY['glutes', 'hamstrings'], 'machine', 'beginner', ARRAY['Feet shoulder width', 'Full range of motion', 'Push through heels'], true, true),
('Walking Lunges', 'Unilateral leg strength', 'legs', 'quadriceps', ARRAY['glutes', 'hamstrings'], 'dumbbell', 'intermediate', ARRAY['Step forward, drop back knee', 'Keep torso upright', 'Drive through front heel'], true, true),
('Leg Curls', 'Hamstring isolation', 'legs', 'hamstrings', ARRAY[]::TEXT[], 'machine', 'beginner', ARRAY['Control the weight', 'Full contraction', 'Slow negative'], false, true),
('Calf Raises', 'Calf development', 'legs', 'gastrocnemius', ARRAY['soleus'], 'machine', 'beginner', ARRAY['Full range of motion', 'Pause at top', 'Control descent'], false, true),
('Bulgarian Split Squats', 'Single leg strength', 'legs', 'quadriceps', ARRAY['glutes', 'hamstrings'], 'dumbbell', 'intermediate', ARRAY['Back foot elevated', 'Front knee stable', 'Upright torso'], true, true),
('Goblet Squats', 'Beginner-friendly squat', 'legs', 'quadriceps', ARRAY['glutes', 'core'], 'dumbbell', 'beginner', ARRAY['Hold weight at chest', 'Squat deep', 'Elbows inside knees'], true, true),

-- SHOULDERS (5)
('Overhead Press', 'Compound shoulder builder', 'shoulders', 'anterior deltoids', ARRAY['triceps', 'upper chest'], 'barbell', 'intermediate', ARRAY['Press straight up', 'Core tight', 'Full lockout'], true, true),
('Dumbbell Lateral Raises', 'Side delt isolation', 'shoulders', 'lateral deltoids', ARRAY[]::TEXT[], 'dumbbell', 'beginner', ARRAY['Slight bend in elbows', 'Raise to shoulder height', 'Control the descent'], false, true),
('Arnold Press', 'Full shoulder activation', 'shoulders', 'deltoids', ARRAY['triceps'], 'dumbbell', 'intermediate', ARRAY['Start with palms facing you', 'Rotate as you press', 'Full range of motion'], true, true),
('Reverse Pec Deck', 'Rear delt isolation', 'shoulders', 'rear deltoids', ARRAY['rhomboids'], 'machine', 'beginner', ARRAY['Chest against pad', 'Pull elbows back', 'Squeeze shoulder blades'], false, true),
('Upright Rows', 'Traps and side delts', 'shoulders', 'lateral deltoids', ARRAY['trapezius'], 'barbell', 'intermediate', ARRAY['Pull to chest height', 'Elbows high', 'Control the weight'], false, true),

-- ARMS (8)
('Barbell Curls', 'Classic bicep builder', 'arms', 'biceps', ARRAY['forearms'], 'barbell', 'beginner', ARRAY['Keep elbows stable', 'Full range of motion', 'Control the negative'], false, true),
('Tricep Dips', 'Compound tricep exercise', 'arms', 'triceps', ARRAY['chest', 'shoulders'], 'bodyweight', 'intermediate', ARRAY['Keep torso upright', 'Elbows track back', 'Full range of motion'], true, true),
('Hammer Curls', 'Bicep and forearm', 'arms', 'biceps', ARRAY['brachialis', 'forearms'], 'dumbbell', 'beginner', ARRAY['Neutral grip', 'Control the weight', 'No swinging'], false, true),
('Overhead Tricep Extension', 'Long head tricep focus', 'arms', 'triceps', ARRAY[]::TEXT[], 'dumbbell', 'beginner', ARRAY['Keep elbows pointed up', 'Full stretch', 'Control the weight'], false, true),
('Cable Curls', 'Constant tension biceps', 'arms', 'biceps', ARRAY[]::TEXT[], 'cable', 'beginner', ARRAY['Keep elbows stable', 'Squeeze at top', 'Slow negative'], false, true),
('Close-Grip Bench Press', 'Compound tricep movement', 'arms', 'triceps', ARRAY['chest'], 'barbell', 'intermediate', ARRAY['Hands shoulder width', 'Elbows tucked', 'Touch lower chest'], true, true),
('Preacher Curls', 'Bicep peak isolation', 'arms', 'biceps', ARRAY[]::TEXT[], 'barbell', 'beginner', ARRAY['Arms fully extended at bottom', 'Curl to full contraction', 'Slow eccentric'], false, true),
('Skull Crushers', 'Tricep mass builder', 'arms', 'triceps', ARRAY[]::TEXT[], 'barbell', 'intermediate', ARRAY['Lower to forehead', 'Keep elbows stable', 'Full extension'], false, true),

-- CORE (5)
('Planks', 'Core stability', 'core', 'rectus abdominis', ARRAY['obliques', 'transverse abdominis'], 'bodyweight', 'beginner', ARRAY['Straight body line', 'Engage core', 'Breathe steadily'], false, true),
('Russian Twists', 'Oblique rotation', 'core', 'obliques', ARRAY['rectus abdominis'], 'bodyweight', 'beginner', ARRAY['Lean back slightly', 'Rotate trunk', 'Control the movement'], false, true),
('Hanging Leg Raises', 'Lower ab focus', 'core', 'rectus abdominis', ARRAY['hip flexors'], 'bodyweight', 'intermediate', ARRAY['Control the swing', 'Raise knees to chest', 'Slow descent'], false, true),
('Cable Crunches', 'Weighted ab work', 'core', 'rectus abdominis', ARRAY[]::TEXT[], 'cable', 'beginner', ARRAY['Crunch down', 'Squeeze abs', 'Control the weight'], false, true),
('Ab Wheel Rollouts', 'Advanced core strength', 'core', 'rectus abdominis', ARRAY['obliques', 'serratus'], 'bodyweight', 'advanced', ARRAY['Control the rollout', 'Keep core tight', 'Full range carefully'], false, true),

-- CARDIO (2)
('Treadmill Running', 'Classic cardio', 'cardio', 'cardiovascular system', ARRAY['legs'], 'machine', 'beginner', ARRAY['Start with warm-up', 'Maintain steady pace', 'Cool down gradually'], false, true),
('Rowing Machine', 'Full body cardio', 'cardio', 'cardiovascular system', ARRAY['back', 'legs', 'arms'], 'machine', 'beginner', ARRAY['Drive with legs first', 'Pull to lower chest', 'Smooth rhythm'], true, true)

ON CONFLICT DO NOTHING;

-- Log success
SELECT 'Fitness tables created and exercise library seeded with 40 exercises' as status;
