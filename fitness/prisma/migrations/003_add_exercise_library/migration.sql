-- CreateTable: exercise_definitions
-- Exercise library for fitness workouts
-- Migration 003 - December 25, 2025

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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_exercise_definitions_category ON exercise_definitions(category);
CREATE INDEX IF NOT EXISTS idx_exercise_definitions_difficulty ON exercise_definitions(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_exercise_definitions_active ON exercise_definitions(is_active);
CREATE INDEX IF NOT EXISTS idx_exercise_definitions_equipment ON exercise_definitions(equipment);

-- Seed common exercises (40 exercises across all major categories)

-- CHEST EXERCISES (8)
INSERT INTO exercise_definitions (name, category, muscle_group, secondary_muscles, equipment, difficulty_level, form_tips, is_compound) VALUES
('Barbell Bench Press', 'chest', 'pectorals', ARRAY['triceps', 'anterior deltoids'], 'barbell', 'intermediate', ARRAY['Keep feet flat on floor', 'Lower bar to mid-chest', 'Press in slight arc', 'Don''t bounce off chest'], true),
('Incline Dumbbell Press', 'chest', 'upper pectorals', ARRAY['anterior deltoids', 'triceps'], 'dumbbell', 'intermediate', ARRAY['Set bench to 30-45 degrees', 'Keep elbows at 45-degree angle', 'Full range of motion'], true),
('Dips', 'chest', 'lower pectorals', ARRAY['triceps', 'anterior deltoids'], 'bodyweight', 'intermediate', ARRAY['Lean forward for chest emphasis', 'Lower until upper arms parallel to floor', 'Keep core tight'], true),
('Cable Flyes', 'chest', 'pectorals', ARRAY[]::TEXT[]::TEXT[], 'cable', 'beginner', ARRAY['Slight bend in elbows', 'Bring hands together at center', 'Control the negative'], false),
('Push-ups', 'chest', 'pectorals', ARRAY['triceps', 'core'], 'bodyweight', 'beginner', ARRAY['Hands shoulder-width apart', 'Keep body in straight line', 'Lower chest to ground'], true),
('Decline Bench Press', 'chest', 'lower pectorals', ARRAY['triceps'], 'barbell', 'intermediate', ARRAY['Secure feet in decline position', 'Control descent', 'Full lockout at top'], true),
('Dumbbell Flyes', 'chest', 'pectorals', ARRAY[]::TEXT[]::TEXT[], 'dumbbell', 'beginner', ARRAY['Slight elbow bend throughout', 'Feel stretch at bottom', 'Don''t let dumbbells touch'], false),
('Machine Chest Press', 'chest', 'pectorals', ARRAY['triceps'], 'machine', 'beginner', ARRAY['Adjust seat height', 'Full extension without locking', 'Control the weight'], true);

-- BACK EXERCISES (8)
INSERT INTO exercise_definitions (name, category, muscle_group, secondary_muscles, equipment, difficulty_level, form_tips, is_compound) VALUES
('Barbell Deadlift', 'back', 'lower back', ARRAY['glutes', 'hamstrings', 'traps'], 'barbell', 'advanced', ARRAY['Keep bar close to body', 'Neutral spine throughout', 'Drive through heels', 'Hip hinge movement'], true),
('Pull-ups', 'back', 'latissimus dorsi', ARRAY['biceps', 'rear deltoids'], 'bodyweight', 'intermediate', ARRAY['Dead hang at bottom', 'Pull chest to bar', 'Control descent', 'Avoid swinging'], true),
('Barbell Rows', 'back', 'latissimus dorsi', ARRAY['rhomboids', 'biceps'], 'barbell', 'intermediate', ARRAY['Hip hinge position', 'Pull to lower chest', 'Keep core tight', 'Retract shoulder blades'], true),
('Lat Pulldowns', 'back', 'latissimus dorsi', ARRAY['biceps'], 'machine', 'beginner', ARRAY['Pull to upper chest', 'Slight lean back', 'Control the weight', 'Full stretch at top'], false),
('Seated Cable Rows', 'back', 'mid-back', ARRAY['biceps', 'rear deltoids'], 'cable', 'beginner', ARRAY['Keep chest up', 'Pull to sternum', 'Squeeze shoulder blades', 'Don''t use momentum'], true),
('T-Bar Rows', 'back', 'mid-back', ARRAY['biceps', 'traps'], 'barbell', 'intermediate', ARRAY['Maintain neutral spine', 'Pull to chest', 'Control eccentric', 'Keep core braced'], true),
('Face Pulls', 'back', 'rear deltoids', ARRAY['upper back'], 'cable', 'beginner', ARRAY['Pull to face level', 'External rotation at end', 'Light weight high reps', 'Retract shoulder blades'], false),
('Dumbbell Rows', 'back', 'latissimus dorsi', ARRAY['biceps', 'rear deltoids'], 'dumbbell', 'beginner', ARRAY['Support with opposite hand', 'Pull elbow past torso', 'Control the weight', 'Neutral spine'], true);

-- LEG EXERCISES (10)
INSERT INTO exercise_definitions (name, category, muscle_group, secondary_muscles, equipment, difficulty_level, form_tips, is_compound) VALUES
('Barbell Squat', 'legs', 'quadriceps', ARRAY['glutes', 'hamstrings', 'core'], 'barbell', 'intermediate', ARRAY['Bar on upper traps', 'Break at hips and knees', 'Knees track over toes', 'Depth to parallel or below'], true),
('Romanian Deadlift', 'legs', 'hamstrings', ARRAY['glutes', 'lower back'], 'barbell', 'intermediate', ARRAY['Slight knee bend', 'Push hips back', 'Feel stretch in hamstrings', 'Keep bar close to legs'], true),
('Leg Press', 'legs', 'quadriceps', ARRAY['glutes', 'hamstrings'], 'machine', 'beginner', ARRAY['Feet shoulder-width apart', 'Don''t lock knees', 'Full range of motion', 'Press through heels'], true),
('Walking Lunges', 'legs', 'quadriceps', ARRAY['glutes', 'hamstrings'], 'bodyweight', 'intermediate', ARRAY['Step far enough forward', 'Back knee nearly touches ground', 'Keep torso upright', 'Push off front heel'], true),
('Leg Curls', 'legs', 'hamstrings', ARRAY[]::TEXT[], 'machine', 'beginner', ARRAY['Curl to glutes', 'Control descent', 'Full range of motion', 'Avoid hip movement'], false),
('Leg Extensions', 'legs', 'quadriceps', ARRAY[]::TEXT[], 'machine', 'beginner', ARRAY['Adjust pad to ankles', 'Full extension without locking', 'Squeeze at top', 'Control negative'], false),
('Bulgarian Split Squat', 'legs', 'quadriceps', ARRAY['glutes'], 'dumbbell', 'intermediate', ARRAY['Rear foot elevated', 'Front shin vertical', 'Lower until back knee near ground', 'Drive through front heel'], true),
('Calf Raises', 'legs', 'calves', ARRAY[]::TEXT[], 'machine', 'beginner', ARRAY['Full stretch at bottom', 'Rise onto toes', 'Pause at top', 'Control descent'], false),
('Goblet Squat', 'legs', 'quadriceps', ARRAY['glutes', 'core'], 'dumbbell', 'beginner', ARRAY['Hold dumbbell at chest', 'Elbows inside knees', 'Squat deep', 'Keep chest up'], true),
('Hip Thrusts', 'legs', 'glutes', ARRAY['hamstrings'], 'barbell', 'intermediate', ARRAY['Upper back on bench', 'Drive through heels', 'Squeeze glutes at top', 'Neutral spine'], true);

-- SHOULDER EXERCISES (6)
INSERT INTO exercise_definitions (name, category, muscle_group, secondary_muscles, equipment, difficulty_level, form_tips, is_compound) VALUES
('Overhead Press', 'shoulders', 'deltoids', ARRAY['triceps', 'upper chest'], 'barbell', 'intermediate', ARRAY['Start at collarbone', 'Press straight overhead', 'Lock out at top', 'Don''t arch back excessively'], true),
('Dumbbell Lateral Raises', 'shoulders', 'lateral deltoids', ARRAY[]::TEXT[], 'dumbbell', 'beginner', ARRAY['Slight bend in elbows', 'Raise to shoulder height', 'Lead with elbows', 'Control descent'], false),
('Dumbbell Shoulder Press', 'shoulders', 'deltoids', ARRAY['triceps'], 'dumbbell', 'beginner', ARRAY['Start at shoulder level', 'Press overhead', 'Avoid excessive arch', 'Control the weight'], true),
('Arnold Press', 'shoulders', 'deltoids', ARRAY['triceps'], 'dumbbell', 'intermediate', ARRAY['Start palms facing you', 'Rotate palms forward as you press', 'Full range of motion', 'Control throughout'], true),
('Front Raises', 'shoulders', 'anterior deltoids', ARRAY[]::TEXT[], 'dumbbell', 'beginner', ARRAY['Raise to eye level', 'Keep arms straight', 'Control descent', 'Avoid swinging'], false),
('Rear Delt Flyes', 'shoulders', 'posterior deltoids', ARRAY[]::TEXT[], 'dumbbell', 'beginner', ARRAY['Bend at hips', 'Slight elbow bend', 'Raise arms to sides', 'Squeeze shoulder blades'], false);

-- ARM EXERCISES (4)
INSERT INTO exercise_definitions (name, category, muscle_group, secondary_muscles, equipment, difficulty_level, form_tips, is_compound) VALUES
('Barbell Curl', 'arms', 'biceps', ARRAY[]::TEXT[], 'barbell', 'beginner', ARRAY['Keep elbows at sides', 'Curl to shoulders', 'Don''t swing', 'Full extension at bottom'], false),
('Tricep Dips', 'arms', 'triceps', ARRAY['chest', 'shoulders'], 'bodyweight', 'intermediate', ARRAY['Keep body upright for triceps', 'Lower until arms at 90 degrees', 'Full extension at top', 'Don''t flare elbows'], true),
('Hammer Curls', 'arms', 'biceps', ARRAY['forearms'], 'dumbbell', 'beginner', ARRAY['Neutral grip throughout', 'Curl to shoulders', 'Keep elbows still', 'Control descent'], false),
('Skull Crushers', 'arms', 'triceps', ARRAY[]::TEXT[], 'barbell', 'intermediate', ARRAY['Lower to forehead', 'Keep elbows in', 'Only move forearms', 'Full extension at top'], false);

-- CORE EXERCISES (4)
INSERT INTO exercise_definitions (name, category, muscle_group, secondary_muscles, equipment, difficulty_level, form_tips, is_compound) VALUES
('Plank', 'core', 'abdominals', ARRAY['lower back', 'shoulders'], 'bodyweight', 'beginner', ARRAY['Forearms on ground', 'Body in straight line', 'Don''t let hips sag', 'Engage core throughout'], false),
('Russian Twists', 'core', 'obliques', ARRAY['abdominals'], 'bodyweight', 'beginner', ARRAY['Lean back slightly', 'Rotate side to side', 'Keep feet elevated', 'Control the movement'], false),
('Hanging Leg Raises', 'core', 'lower abdominals', ARRAY['hip flexors'], 'bodyweight', 'advanced', ARRAY['Dead hang from bar', 'Raise legs to 90 degrees', 'Control descent', 'Avoid swinging'], false),
('Cable Crunches', 'core', 'abdominals', ARRAY[]::TEXT[], 'cable', 'beginner', ARRAY['Kneel facing cable', 'Crunch down toward floor', 'Keep hips stationary', 'Full contraction'], false);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Exercise library migration complete: 40 exercises added';
END $$;
