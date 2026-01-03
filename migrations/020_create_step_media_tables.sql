-- Migration: 020_create_step_media_tables
-- Description: Create tables for step media (videos/posters for meal planning steps)
-- Created: 2026-01-03

-- Create enum type for meal step keys
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meal_step_key') THEN
        CREATE TYPE meal_step_key AS ENUM (
            'CUISINES',
            'SERVINGS',
            'INGREDIENTS',
            'DIETARY',
            'MEALS',
            'STORES',
            'RECIPES_WITH_PRICES'
        );
    END IF;
END$$;

-- Create step_media table for versioned media content
CREATE TABLE IF NOT EXISTS step_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step_key meal_step_key NOT NULL,
    label VARCHAR(200) NOT NULL,
    video_url TEXT,
    poster_url TEXT,
    run_rule VARCHAR(20) NOT NULL DEFAULT 'loop' CHECK (run_rule IN ('loop', 'stopOnUserAction')),
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create step_media_active table to track published media per step
CREATE TABLE IF NOT EXISTS step_media_active (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step_key meal_step_key NOT NULL UNIQUE,
    active_media_id UUID NOT NULL UNIQUE,
    published_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_by UUID,
    CONSTRAINT fk_step_media_active_media
        FOREIGN KEY (active_media_id)
        REFERENCES step_media(id)
        ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_step_media_step_key ON step_media(step_key);
CREATE INDEX IF NOT EXISTS idx_step_media_created_at ON step_media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_step_media_active_step_key ON step_media_active(step_key);

-- Add comment for documentation
COMMENT ON TABLE step_media IS 'Versioned media content (video/poster) for meal planning steps';
COMMENT ON TABLE step_media_active IS 'Tracks which media version is currently published for each step';
COMMENT ON COLUMN step_media.run_rule IS 'Video behavior: loop continuously or stop when user interacts';
