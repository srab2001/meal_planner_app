/**
 * Auth Context Middleware
 *
 * Middleware that:
 * - Checks auth (JWT token)
 * - Resolves CORE DB user_id
 * - Resolves active household
 * - Confirms membership
 * - Attaches context for routes
 */

const jwt = require('jsonwebtoken');
const { getCoreDb, getHouseholdContext } = require('../lib/coreDb');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ACTIVE_HOUSEHOLD_COOKIE = 'active_household_id';

/**
 * Extract token from Authorization header or cookie
 */
function extractToken(req) {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookie
  if (req.cookies && req.cookies.auth_token) {
    return req.cookies.auth_token;
  }

  return null;
}

/**
 * Get active household ID from cookie or header
 */
function getActiveHouseholdId(req) {
  // Check header first
  if (req.headers['x-household-id']) {
    return req.headers['x-household-id'];
  }

  // Check cookie
  if (req.cookies && req.cookies[ACTIVE_HOUSEHOLD_COOKIE]) {
    return req.cookies[ACTIVE_HOUSEHOLD_COOKIE];
  }

  // Check query param (fallback)
  if (req.query && req.query.household_id) {
    return req.query.household_id;
  }

  return null;
}

/**
 * Auth middleware - validates token and attaches user
 */
function requireAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Authentication required'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'invalid_token',
      message: 'Invalid or expired token'
    });
  }
}

/**
 * Household context middleware - requires auth first
 * Resolves active household and validates membership
 */
async function requireHouseholdContext(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Authentication required'
    });
  }

  const householdId = getActiveHouseholdId(req);

  if (!householdId) {
    return res.status(400).json({
      error: 'missing_household',
      message: 'Active household ID required. Set via X-Household-ID header or active_household_id cookie.'
    });
  }

  try {
    const context = await getHouseholdContext(req.user.id, householdId);

    if (!context) {
      return res.status(403).json({
        error: 'not_a_member',
        message: 'You are not a member of this household'
      });
    }

    // Attach context to request
    req.householdContext = context;
    req.household = context.household;
    req.householdRole = context.role;

    next();
  } catch (err) {
    console.error('[Auth] Household context error:', err);
    return res.status(500).json({
      error: 'context_error',
      message: 'Failed to resolve household context'
    });
  }
}

/**
 * RBAC middleware - requires specific role
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required'
      });
    }

    // Global admin bypasses all role checks
    if (req.user.role === 'admin') {
      return next();
    }

    // Check household role
    if (req.householdRole && allowedRoles.includes(req.householdRole.name)) {
      return next();
    }

    // Check membership role
    if (req.householdContext?.membership?.role &&
        allowedRoles.includes(req.householdContext.membership.role)) {
      return next();
    }

    return res.status(403).json({
      error: 'forbidden',
      message: `Requires one of: ${allowedRoles.join(', ')}`
    });
  };
}

/**
 * Combined auth + household context middleware
 */
async function requireAuthWithHousehold(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Authentication required'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    return res.status(401).json({
      error: 'invalid_token',
      message: 'Invalid or expired token'
    });
  }

  // Now check household
  await requireHouseholdContext(req, res, next);
}

/**
 * Set active household cookie
 */
function setActiveHousehold(res, householdId) {
  res.cookie(ACTIVE_HOUSEHOLD_COOKIE, householdId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
}

/**
 * Clear active household cookie
 */
function clearActiveHousehold(res) {
  res.clearCookie(ACTIVE_HOUSEHOLD_COOKIE);
}

module.exports = {
  requireAuth,
  requireHouseholdContext,
  requireRole,
  requireAuthWithHousehold,
  setActiveHousehold,
  clearActiveHousehold,
  extractToken,
  getActiveHouseholdId,
  ACTIVE_HOUSEHOLD_COOKIE
};
