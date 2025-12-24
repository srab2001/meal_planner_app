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

-- Index for finding by email (checking if user already invited)
CREATE INDEX IF NOT EXISTS idx_user_invites_email ON user_invites(email);
-- Index for finding by token (validation during acceptance)
CREATE INDEX IF NOT EXISTS idx_user_invites_token ON user_invites(token);
-- Index for finding pending invites by expiry
CREATE INDEX IF NOT EXISTS idx_user_invites_status_expiry ON user_invites(status, expires_at);
-- Index for admin viewing their invites
CREATE INDEX IF NOT EXISTS idx_user_invites_created_by ON user_invites(created_by);
