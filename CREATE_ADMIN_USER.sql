-- ============================================================================
-- CREATE NEW ADMIN USER - SQL COMMANDS
-- ============================================================================
-- 
-- This file contains SQL commands to create a new admin user in the database.
-- Choose the option that matches your authentication method.
--
-- ============================================================================

-- OPTION 1: CREATE GOOGLE OAuth ADMIN USER (RECOMMENDED)
-- ============================================================================
-- Use this if the user has authenticated via Google OAuth.
-- You need the Google ID from the user's Google account.
--
-- To get the Google ID:
-- 1. User logs in with Google OAuth
-- 2. Check the browser console or network tab to see their Google ID
-- 3. Or use this command and the system will populate it

INSERT INTO users (
  email,
  google_id,
  display_name,
  role,
  status,
  created_at,
  updated_at
) VALUES (
  'neoadmin@example.com',           -- Replace with actual email
  'google-oauth-id-here',           -- Replace with actual Google ID (optional for now)
  'New Admin User',                 -- Replace with actual name
  'admin',                          -- Role set to admin
  'active',                         -- Status set to active
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  status = 'active',
  updated_at = CURRENT_TIMESTAMP
RETURNING id, email, role, status, google_id;

-- ============================================================================

-- OPTION 2: CREATE ADMIN USER (SIMPLE VERSION)
-- ============================================================================
-- Minimal version - creates admin user with just email and role.
-- Good for quick setup.

INSERT INTO users (
  email,
  display_name,
  role,
  status
) VALUES (
  'admin@example.com',              -- Replace with actual email
  'Admin User',                     -- Replace with desired display name
  'admin',                          -- Role: admin
  'active'                          -- Status: active
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  status = 'active',
  updated_at = CURRENT_TIMESTAMP
RETURNING id, email, role, status, created_at;

-- ============================================================================

-- OPTION 3: PROMOTE EXISTING USER TO ADMIN
-- ============================================================================
-- Use this if the user already exists in the database but isn't an admin yet.

UPDATE users
SET role = 'admin', status = 'active', updated_at = CURRENT_TIMESTAMP
WHERE email = 'existing-user@example.com'  -- Replace with actual email
RETURNING id, email, role, status, created_at;

-- ============================================================================

-- OPTION 4: VIEW ALL ADMIN USERS
-- ============================================================================
-- Check who currently has admin privileges

SELECT 
  id,
  email,
  display_name,
  role,
  status,
  google_id,
  created_at,
  updated_at
FROM users
WHERE role = 'admin'
ORDER BY created_at DESC;

-- ============================================================================

-- OPTION 5: REMOVE ADMIN ROLE FROM USER
-- ============================================================================
-- Revoke admin access for a user

UPDATE users
SET role = 'user', updated_at = CURRENT_TIMESTAMP
WHERE email = 'user@example.com'  -- Replace with actual email
RETURNING id, email, role, status;

-- ============================================================================

-- NOTES:
-- ============================================================================
--
-- 1. EMAIL UNIQUENESS:
--    - Emails must be unique in the users table
--    - If the email already exists, the ON CONFLICT clause will update it
--
-- 2. GOOGLE_ID (Optional initially):
--    - Google ID is required for Google OAuth login
--    - If not provided initially, it gets populated when user first logs in with Google
--    - Format: typically a long numeric string from Google
--
-- 3. REQUIRED COLUMNS:
--    - email: User's email address (MUST be unique)
--    - role: Set to 'admin' for admin user (default is 'user')
--    - status: Set to 'active' for enabled user (default is 'active')
--
-- 4. OPTIONAL COLUMNS:
--    - google_id: Google OAuth identifier
--    - display_name: User's full name or display name
--    - picture_url: URL to user's profile picture
--
-- 5. AUTO-POPULATED COLUMNS:
--    - id: UUID (automatically generated)
--    - created_at: Timestamp of creation (defaults to CURRENT_TIMESTAMP)
--    - updated_at: Timestamp of last update (defaults to CURRENT_TIMESTAMP)
--
-- ============================================================================

-- EXAMPLE USAGE:
-- ============================================================================
--
-- To create a new admin user, run this command in your PostgreSQL client:
--
-- INSERT INTO users (email, display_name, role, status) VALUES (
--   'john@example.com',
--   'John Admin',
--   'admin',
--   'active'
-- ) RETURNING *;
--
-- Then user can log in via Google OAuth with that email address.
--
-- ============================================================================
