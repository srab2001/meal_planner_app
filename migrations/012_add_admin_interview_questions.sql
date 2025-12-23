-- Create admin_interview_questions table for AI Workout Coach
-- This table stores interview questions used by the fitness module to gather user fitness information

CREATE TABLE IF NOT EXISTS admin_interview_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    options TEXT,
    "order" INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_admin_interview_questions_active ON admin_interview_questions(active);
CREATE INDEX IF NOT EXISTS idx_admin_interview_questions_order ON admin_interview_questions("order");

-- Insert sample interview questions for the AI Workout Coach
INSERT INTO admin_interview_questions (id, question, type, "order", active) VALUES
    ('550e8400-e29b-41d4-a716-446655440001'::UUID, 'What type of workout are you interested in?', 'text', 1, true),
    ('550e8400-e29b-41d4-a716-446655440002'::UUID, 'How many days per week can you exercise?', 'multiple_choice', 2, true),
    ('550e8400-e29b-41d4-a716-446655440003'::UUID, 'What is your current fitness level?', 'multiple_choice', 3, true),
    ('550e8400-e29b-41d4-a716-446655440004'::UUID, 'Do you have access to gym equipment?', 'yes_no', 4, true),
    ('550e8400-e29b-41d4-a716-446655440005'::UUID, 'How much time can you dedicate per workout?', 'range', 5, true)
ON CONFLICT DO NOTHING;
