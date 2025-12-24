/**
 * Admin Management Routes
 * 
 * All routes require authentication and admin role
 * Endpoints:
 * - GET /api/admin/users - List all users
 * - PATCH /api/admin/users/:id - Update user role/status
 * - POST /api/admin/users/invite - Send invitation
 * - POST /api/admin/users/approve - Approve without invite
 * - GET /api/admin/invites - List invites
 * - POST /api/admin/invites/:id/resend - Resend invite
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { Pool } = require('pg');

// Use DATABASE_URL for main app database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

/**
 * Middleware: Verify authentication
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

/**
 * Middleware: Verify admin role
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    console.log('[Admin Auth] Rejected - user role:', req.user?.role);
    return res.status(403).json({ error: 'Admin access required' });
  }
  console.log('[Admin Auth] ✅ Admin access granted for:', req.user.email);
  next();
}

/**
 * Helper: Generate secure invite token
 */
function generateInviteToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * GET /api/admin/users
 * Return list of all users with basic info
 */
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        email, 
        display_name as name, 
        role, 
        status, 
        created_at,
        last_login_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.json({
      count: result.rows.length,
      users: result.rows,
    });
  } catch (error) {
    console.error('[Admin] Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Update user role or status
 * Body: { role?: 'user'|'admin', status?: 'active'|'pending'|'disabled' }
 */
router.patch('/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, status } = req.body;

    // Build dynamic UPDATE query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (role && ['user', 'admin'].includes(role)) {
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }

    if (status && ['active', 'pending', 'disabled'].includes(status)) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE users 
       SET ${updates.join(', ')} 
       WHERE id = $${paramCount} 
       RETURNING id, email, display_name, role, status, created_at, last_login_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[Admin] Updated user ${id}:`, { role, status });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Admin] Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * POST /api/admin/users/invite
 * Create invitation for new user
 * Body: { email, role?: 'user' }
 */
router.post('/users/invite', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { email, role = 'user' } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Check if invite already exists and pending
    const existingInvite = await pool.query(
      'SELECT id FROM user_invites WHERE email = $1 AND status = $2',
      [email, 'pending']
    );

    if (existingInvite.rows.length > 0) {
      return res.status(409).json({ error: 'Pending invite already exists' });
    }

    // Create new invite
    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const result = await pool.query(
      `INSERT INTO user_invites (email, role, token, expires_at, created_by, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id, email, role, token, status, expires_at, created_at`,
      [email, role, token, expiresAt, req.user.id]
    );

    const invite = result.rows[0];
    console.log(`[Admin] Created invite for ${email} with role ${role}`);

    res.json({
      invite,
      acceptanceLink: `${process.env.FRONTEND_BASE}/accept-invite?token=${token}`,
    });
  } catch (error) {
    console.error('[Admin] Error creating invite:', error);
    res.status(500).json({ error: 'Failed to create invite' });
  }
});

/**
 * POST /api/admin/users/approve
 * Directly approve user without invite (bypass invitation flow)
 * Body: { email, role?: 'user' }
 */
router.post('/users/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { email, role = 'user' } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Create user directly with approved status
    // (They will need to complete OAuth login to finish setup)
    const result = await pool.query(
      `INSERT INTO users (email, role, status, created_at, updated_at)
       VALUES ($1, $2, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (email) DO UPDATE
       SET role = $2, status = 'active'
       RETURNING id, email, display_name, role, status, created_at, last_login_at`,
      [email, role]
    );

    const user = result.rows[0];
    console.log(`[Admin] Approved user ${email} with role ${role}`);

    res.json({
      user,
      message: 'User approved. They can now log in with Google OAuth.',
    });
  } catch (error) {
    console.error('[Admin] Error approving user:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

/**
 * GET /api/admin/invites
 * List all invites with status
 */
router.get('/invites', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        email, 
        role, 
        status,
        expires_at, 
        created_at,
        created_by,
        accepted_at,
        accepted_by
      FROM user_invites
      ORDER BY created_at DESC
    `);

    res.json({
      count: result.rows.length,
      invites: result.rows,
    });
  } catch (error) {
    console.error('[Admin] Error fetching invites:', error);
    res.status(500).json({ error: 'Failed to fetch invites' });
  }
});

/**
 * POST /api/admin/invites/:id/resend
 * Resend invite: rotate token, extend expiry, return new token
 */
router.post('/invites/:id/resend', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get the invite
    const getResult = await pool.query(
      'SELECT * FROM user_invites WHERE id = $1',
      [id]
    );

    if (getResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    const invite = getResult.rows[0];

    if (invite.status !== 'pending') {
      return res.status(400).json({ error: `Cannot resend ${invite.status} invite` });
    }

    // Generate new token and extend expiry
    const newToken = generateInviteToken();
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const updateResult = await pool.query(
      `UPDATE user_invites 
       SET token = $1, expires_at = $2 
       WHERE id = $3 
       RETURNING id, email, role, token, status, expires_at, created_at`,
      [newToken, newExpiresAt, id]
    );

    const updatedInvite = updateResult.rows[0];
    console.log(`[Admin] Resent invite for ${invite.email}`);

    res.json({
      invite: updatedInvite,
      acceptanceLink: `${process.env.FRONTEND_BASE}/accept-invite?token=${newToken}`,
    });
  } catch (error) {
    console.error('[Admin] Error resending invite:', error);
    res.status(500).json({ error: 'Failed to resend invite' });
  }
});

module.exports = router;
