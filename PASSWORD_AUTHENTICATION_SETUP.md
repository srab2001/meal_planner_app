-- ============================================================================
-- PASSWORD-BASED AUTHENTICATION SETUP (OPTIONAL)
-- ============================================================================
--
-- This file explains how to add password-based login to your admin users
-- in addition to Google OAuth.
--
-- NOTE: Your app currently uses Google OAuth only. This is OPTIONAL
-- and only needed if you want username/password login capability.
--
-- ============================================================================

-- STEP 1: ADD PASSWORD_HASH COLUMN TO USERS TABLE
-- ============================================================================
-- Only run this once to add password support

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMP;

-- ============================================================================

-- STEP 2: CREATE ADMIN USER WITH PASSWORD (OPTION A)
-- ============================================================================
-- After creating the password_hash column, insert a new admin user
-- with a hashed password.
--
-- NOTE: You MUST hash the password BEFORE inserting it!
-- See Step 3 for how to hash passwords.

INSERT INTO users (
  email,
  display_name,
  password_hash,        -- Use bcrypt hashed password here
  role,
  status,
  created_at,
  updated_at
) VALUES (
  'admin@example.com',
  'Admin User',
  '$2b$10$HASHED_PASSWORD_HERE',  -- Replace with actual bcrypt hash
  'admin',
  'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = '$2b$10$HASHED_PASSWORD_HERE',
  password_updated_at = CURRENT_TIMESTAMP,
  role = 'admin',
  status = 'active',
  updated_at = CURRENT_TIMESTAMP
RETURNING id, email, role, status, created_at;

-- ============================================================================

-- STEP 3: HOW TO CREATE A BCRYPT PASSWORD HASH
-- ============================================================================
--
-- IMPORTANT: Never store plain passwords!
-- Always use bcrypt or similar to hash passwords before storing.
--
-- Node.js Example (using bcryptjs package):
-- ============================================================================
--
-- const bcrypt = require('bcryptjs');
--
-- // Hash a password
-- const plainPassword = 'MySecurePassword123!';
-- const saltRounds = 10;  // Higher = more secure but slower
--
-- bcrypt.hash(plainPassword, saltRounds, (err, hashedPassword) => {
--   if (err) throw err;
--   console.log('Hashed password:', hashedPassword);
--   // Use this hash in the SQL INSERT command above
-- });
--
-- // Verify password during login
-- bcrypt.compare(plainPassword, hashedPassword, (err, isMatch) => {
--   if (err) throw err;
--   if (isMatch) {
--     console.log('Password is correct!');
--   }
-- });
--
-- ============================================================================

-- STEP 4: CREATE LOGIN ENDPOINT (Backend Code)
-- ============================================================================
--
-- Add this to your server.js or auth routes file:
--
-- const bcrypt = require('bcryptjs');
--
-- app.post('/api/auth/login', async (req, res) => {
--   try {
--     const { email, password } = req.body;
--
--     // Find user by email
--     const result = await db.query(
--       'SELECT id, email, password_hash, role, status FROM users WHERE email = $1',
--       [email]
--     );
--
--     if (result.rows.length === 0) {
--       return res.status(401).json({ error: 'Invalid email or password' });
--     }
--
--     const user = result.rows[0];
--
--     // Check if user is active
--     if (user.status !== 'active') {
--       return res.status(403).json({ error: 'Account is disabled' });
--     }
--
--     // Verify password
--     const isPasswordValid = await bcrypt.compare(password, user.password_hash);
--
--     if (!isPasswordValid) {
--       return res.status(401).json({ error: 'Invalid email or password' });
--     }
--
--     // Password is correct - create session or JWT token
--     req.session.user = {
--       id: user.id,
--       email: user.email,
--       role: user.role
--     };
--
--     res.json({
--       success: true,
--       user: {
--         id: user.id,
--         email: user.email,
--         role: user.role
--       }
--     });
--
--   } catch (error) {
--     console.error('Login error:', error);
--     res.status(500).json({ error: 'Login failed' });
--   }
-- });
--
-- ============================================================================

-- STEP 5: INSTALL BCRYPT (Node.js Terminal)
-- ============================================================================
--
-- Run this command in your project root:
--
-- npm install bcryptjs
--
-- or if using yarn:
--
-- yarn add bcryptjs
--
-- ============================================================================

-- SUMMARY
-- ============================================================================
--
-- For GOOGLE OAUTH (Current Setup):
--   - NO password needed
--   - User logs in via Google
--   - App stores google_id in database
--   - No password_hash column needed
--
-- For PASSWORD-BASED LOGIN (Optional Addition):
--   - Add password_hash column to users table
--   - Hash password with bcrypt before storing
--   - Create /api/auth/login endpoint
--   - Verify password during login
--   - Much more complex to maintain
--
-- RECOMMENDATION:
--   Keep Google OAuth only for simplicity and security.
--   Users don't need to remember another password.
--   Google handles all password security.
--
-- ============================================================================
