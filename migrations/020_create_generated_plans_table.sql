-- Create table to store AI-generated workout plans based on user interview
CREATE TABLE IF NOT EXISTS fitness_generated_plans (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  source_model VARCHAR(255),
  prompt_text TEXT,
  plan_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fitness_generated_plans_user_id ON fitness_generated_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_fitness_generated_plans_session_id ON fitness_generated_plans(session_id);

COMMENT ON TABLE fitness_generated_plans IS 'Store AI-generated workout plans for user interview sessions';
