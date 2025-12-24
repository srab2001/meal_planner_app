-- ════════════════════════════════════════════════════════════════════════════
-- SQL QUERIES FOR DBEAVER - Admin Role Setup
-- ════════════════════════════════════════════════════════════════════════════


-- QUERY 1: VIEW ALL RECENT USERS
-- ────────────────────────────────────────────────────────────────────────────
-- Shows the 10 most recently created users with their id, email, role, and status
-- Run this first to see all users in the system

SELECT id, email, role, status FROM users ORDER BY created_at DESC LIMIT 10;


-- ════════════════════════════════════════════════════════════════════════════


-- QUERY 2: FIND YOUR SPECIFIC USER
-- ────────────────────────────────────────────────────────────────────────────
-- Replace YOUR_EMAIL with your actual email address (e.g., stuart@gmail.com)
-- This will show your user record with all details including creation date

SELECT id, email, role, status, created_at FROM users 
WHERE email = 'YOUR_EMAIL@gmail.com';

-- EXAMPLE (with real email):
-- SELECT id, email, role, status, created_at FROM users 
-- WHERE email = 'stuart@example.com';


-- ════════════════════════════════════════════════════════════════════════════


-- QUERY 3: UPDATE YOUR ROLE TO ADMIN
-- ────────────────────────────────────────────────────────────────────────────
-- Replace YOUR_EMAIL with your actual email address
-- This updates your role from 'user' or NULL to 'admin'
-- IMPORTANT: Only run this AFTER you've verified your email in Query 2

UPDATE users 
SET role = 'admin' 
WHERE email = 'YOUR_EMAIL@gmail.com';

-- EXAMPLE (with real email):
-- UPDATE users 
-- SET role = 'admin' 
-- WHERE email = 'stuart@example.com';


-- ════════════════════════════════════════════════════════════════════════════


-- QUERY 4: VERIFY ROLE WAS UPDATED
-- ────────────────────────────────────────────────────────────────────────────
-- Replace YOUR_EMAIL with your actual email address
-- Run this AFTER Query 3 to confirm the update was successful
-- Should show role = 'admin'

SELECT id, email, role, status, created_at FROM users 
WHERE email = 'YOUR_EMAIL@gmail.com';

-- EXAMPLE (with real email):
-- SELECT id, email, role, status, created_at FROM users 
-- WHERE email = 'stuart@example.com';


-- ════════════════════════════════════════════════════════════════════════════


-- QUERY 5: CHECK FITNESS TABLES EXIST
-- ────────────────────────────────────────────────────────────────────────────
-- Verifies that the fitness_workouts table was created by the migration
-- Should return: fitness_workouts and any other fitness-related tables

SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'fitness%';


-- ════════════════════════════════════════════════════════════════════════════


-- ADDITIONAL QUERY: CHECK ALL TABLES (Optional)
-- ────────────────────────────────────────────────────────────────────────────
-- Shows all tables in your database (useful for exploration)

SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;


-- ════════════════════════════════════════════════════════════════════════════
-- WORKFLOW:
-- ════════════════════════════════════════════════════════════════════════════
--
-- 1. Run QUERY 1 to see all users
-- 2. Run QUERY 2 (with your email) to find your user
-- 3. Check if role is NULL or 'user'
-- 4. If not 'admin', run QUERY 3 (with your email) to update it
-- 5. Run QUERY 4 (with your email) to verify it changed to 'admin'
-- 6. Run QUERY 5 to confirm fitness_workouts table exists
-- 7. Log out of the app, clear localStorage, and log back in
-- 8. Admin tile should now appear in Switchboard
-- 9. AI Coach should work in the Fitness module
--
-- ════════════════════════════════════════════════════════════════════════════
