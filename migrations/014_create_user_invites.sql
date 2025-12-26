-- Migration: Create user_invites table for invite-based user onboarding
-- Admins can invite new users, who must accept before getting account access

CREATE TABLE IF NOT EXISTS user_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  token VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- pending: awaiting acceptance
  -- accepted: user accepted and account created
  -- expired: invite expired before acceptance
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMP DEFAULT NULL,
  accepted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT
);

-- Create indexes (only if columns exist)
DO $$
BEGIN
    -- Index for finding by email
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_invites' AND column_name = 'email') THEN
        CREATE INDEX IF NOT EXISTS idx_user_invites_email ON user_invites(email);
    END IF;

    -- Index for finding by token
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_invites' AND column_name = 'token') THEN
        CREATE INDEX IF NOT EXISTS idx_user_invites_token ON user_invites(token);
    END IF;

    -- Index for finding pending invites by expiry
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_invites' AND column_name = 'status') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_invites' AND column_name = 'expires_at') THEN
            CREATE INDEX IF NOT EXISTS idx_user_invites_status_expiry ON user_invites(status, expires_at);
        END IF;
    END IF;

    -- Index for admin viewing their invites
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_invites' AND column_name = 'created_by') THEN
        CREATE INDEX IF NOT EXISTS idx_user_invites_created_by ON user_invites(created_by);
    END IF;
END $$;
