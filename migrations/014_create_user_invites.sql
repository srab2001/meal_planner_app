-- Migration: Create user_invites table for invite-based user onboarding
-- Admins can invite new users, who must accept before getting account access

CREATE TABLE IF NOT EXISTS user_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  token VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  accepted_at TIMESTAMP,
  accepted_by UUID,
  notes TEXT
);

-- Ensure ALL columns exist (handles partial table creation from failed deployments)
ALTER TABLE user_invites ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE user_invites ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE user_invites ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
ALTER TABLE user_invites ADD COLUMN IF NOT EXISTS token VARCHAR(255);
ALTER TABLE user_invites ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE user_invites ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
ALTER TABLE user_invites ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_invites ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE user_invites ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP;
ALTER TABLE user_invites ADD COLUMN IF NOT EXISTS accepted_by UUID;
ALTER TABLE user_invites ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add constraints (safe with IF NOT EXISTS pattern)
DO $$
BEGIN
    -- Make columns NOT NULL if they should be
    BEGIN
        ALTER TABLE user_invites ALTER COLUMN email SET NOT NULL;
    EXCEPTION WHEN others THEN NULL;
    END;

    BEGIN
        ALTER TABLE user_invites ALTER COLUMN role SET NOT NULL;
    EXCEPTION WHEN others THEN NULL;
    END;

    BEGIN
        ALTER TABLE user_invites ALTER COLUMN token SET NOT NULL;
    EXCEPTION WHEN others THEN NULL;
    END;

    BEGIN
        ALTER TABLE user_invites ALTER COLUMN status SET NOT NULL;
    EXCEPTION WHEN others THEN NULL;
    END;

    BEGIN
        ALTER TABLE user_invites ALTER COLUMN expires_at SET NOT NULL;
    EXCEPTION WHEN others THEN NULL;
    END;

    BEGIN
        ALTER TABLE user_invites ALTER COLUMN created_at SET NOT NULL;
    EXCEPTION WHEN others THEN NULL;
    END;

    -- Add unique constraints
    BEGIN
        ALTER TABLE user_invites ADD CONSTRAINT unique_user_invites_email UNIQUE (email);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER TABLE user_invites ADD CONSTRAINT unique_user_invites_token UNIQUE (token);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    -- Add foreign key constraints
    BEGIN
        ALTER TABLE user_invites ADD CONSTRAINT fk_user_invites_created_by
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER TABLE user_invites ADD CONSTRAINT fk_user_invites_accepted_by
        FOREIGN KEY (accepted_by) REFERENCES users(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    -- Add primary key if missing
    -- Note: Can't add PK if one already exists (error 42P16), so check first
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'user_invites'
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
        BEGIN
            ALTER TABLE user_invites ADD PRIMARY KEY (id);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;
END $$;

-- Create indexes (table structure is now guaranteed complete)
CREATE INDEX IF NOT EXISTS idx_user_invites_email ON user_invites(email);
CREATE INDEX IF NOT EXISTS idx_user_invites_token ON user_invites(token);
CREATE INDEX IF NOT EXISTS idx_user_invites_status_expiry ON user_invites(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_invites_created_by ON user_invites(created_by);
