-- Migration: Add admin role support and user status to existing users table
-- This migration adds the missing fields needed for admin management

-- Add role column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
    WHERE table_name='users' AND column_name='role') THEN
    ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';
  END IF;
END
$$;

-- Add status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
    WHERE table_name='users' AND column_name='status') THEN
    ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'active';
  END IF;
END
$$;

-- Add last_login_at if it doesn't exist (might already be there as last_login)
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
    WHERE table_name='users' AND column_name='last_login_at') THEN
    ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP DEFAULT NULL;
  END IF;
END
$$;

-- Create index on role for faster admin queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
