-- Fitness Module - Initial Schema
-- This migration creates all fitness-related tables
-- Database: Shared Neon PostgreSQL (same connection as meal_planner)

-- CreateTable - fitness_profiles
CREATE TABLE "fitness_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "age" INTEGER,
    "gender" VARCHAR(20),
    "height_cm" DECIMAL(5,2),
    "weight_kg" DECIMAL(6,2),
    "experience_level" VARCHAR(50) NOT NULL DEFAULT 'beginner',
    "primary_goal" VARCHAR(100),
    "weekly_goal_hours" DECIMAL(4,2),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fitness_profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "fitness_profiles_user_id_unique" UNIQUE("user_id")
);

-- CreateTable - fitness_exercises (reference data)
CREATE TABLE "fitness_exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL UNIQUE,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL,
    "equipment" VARCHAR(100),
    "primary_muscle_group" VARCHAR(100),
    "secondary_muscle_groups" TEXT[],
    "difficulty_level" VARCHAR(50) NOT NULL DEFAULT 'intermediate',
    "instruction_url" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fitness_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable - fitness_workouts
CREATE TABLE "fitness_workouts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "workout_date" TIMESTAMP(6) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "duration_minutes" INTEGER,
    "total_volume_kg" DECIMAL(8,2),
    "total_reps" INTEGER,
    "notes" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'completed',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "fitness_workouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable - fitness_workout_exercises (junction table)
CREATE TABLE "fitness_workout_exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workout_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "order_position" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "fitness_workout_exercises_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "fitness_workout_exercises_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "fitness_workouts"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "fitness_workout_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "fitness_exercises"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "fitness_workout_exercises_unique" UNIQUE("workout_id", "exercise_id")
);

-- CreateTable - fitness_workout_sets (detail table for each set in an exercise)
CREATE TABLE "fitness_workout_sets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workout_exercise_id" UUID NOT NULL,
    "set_number" INTEGER NOT NULL,
    "reps" INTEGER,
    "weight_kg" DECIMAL(8,2),
    "weight_lbs" DECIMAL(8,2),
    "rpe" DECIMAL(3,1),
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "fitness_workout_sets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "fitness_workout_sets_workout_exercise_id_fkey" FOREIGN KEY ("workout_exercise_id") REFERENCES "fitness_workout_exercises"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable - fitness_cardio_sessions
CREATE TABLE "fitness_cardio_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "session_date" TIMESTAMP(6) NOT NULL,
    "activity_type" VARCHAR(100) NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "distance_km" DECIMAL(6,2),
    "distance_miles" DECIMAL(6,2),
    "avg_heart_rate" INTEGER,
    "max_heart_rate" INTEGER,
    "elevation_gain_m" INTEGER,
    "calories_burned" INTEGER,
    "notes" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'completed',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "fitness_cardio_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable - fitness_goals
CREATE TABLE "fitness_goals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "workout_id" UUID,
    "goal_type" VARCHAR(100) NOT NULL,
    "target_value" DECIMAL(8,2),
    "current_value" DECIMAL(8,2),
    "unit" VARCHAR(50),
    "target_date" TIMESTAMP(6),
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(6),

    CONSTRAINT "fitness_goals_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "fitness_goals_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "fitness_workouts"("id") ON DELETE SET NULL ON UPDATE NO ACTION
);

-- CreateIndexes - fitness_profiles
CREATE INDEX "idx_fitness_profiles_user_id" ON "fitness_profiles"("user_id");

-- CreateIndexes - fitness_exercises
CREATE INDEX "idx_fitness_exercises_category" ON "fitness_exercises"("category");
CREATE INDEX "idx_fitness_exercises_equipment" ON "fitness_exercises"("equipment");
CREATE INDEX "idx_fitness_exercises_muscle_group" ON "fitness_exercises"("primary_muscle_group");

-- CreateIndexes - fitness_workouts
CREATE INDEX "idx_fitness_workouts_user_id" ON "fitness_workouts"("user_id");
CREATE INDEX "idx_fitness_workouts_date" ON "fitness_workouts"("workout_date");
CREATE INDEX "idx_fitness_workouts_status" ON "fitness_workouts"("status");
CREATE INDEX "idx_fitness_workouts_user_recent" ON "fitness_workouts"("user_id", "workout_date" DESC);

-- CreateIndexes - fitness_workout_exercises
CREATE INDEX "idx_fitness_workout_exercises_workout_id" ON "fitness_workout_exercises"("workout_id");
CREATE INDEX "idx_fitness_workout_exercises_exercise_id" ON "fitness_workout_exercises"("exercise_id");

-- CreateIndexes - fitness_workout_sets
CREATE INDEX "idx_fitness_workout_sets_exercise_id" ON "fitness_workout_sets"("workout_exercise_id");

-- CreateIndexes - fitness_cardio_sessions
CREATE INDEX "idx_fitness_cardio_sessions_user_id" ON "fitness_cardio_sessions"("user_id");
CREATE INDEX "idx_fitness_cardio_sessions_date" ON "fitness_cardio_sessions"("session_date");
CREATE INDEX "idx_fitness_cardio_sessions_activity" ON "fitness_cardio_sessions"("activity_type");
CREATE INDEX "idx_fitness_cardio_sessions_user_recent" ON "fitness_cardio_sessions"("user_id", "session_date" DESC);

-- CreateIndexes - fitness_goals
CREATE INDEX "idx_fitness_goals_user_id" ON "fitness_goals"("user_id");
CREATE INDEX "idx_fitness_goals_status" ON "fitness_goals"("status");
CREATE INDEX "idx_fitness_goals_user_status" ON "fitness_goals"("user_id", "status");
