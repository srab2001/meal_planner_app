/**
 * Audit Logging - CORE DB
 *
 * Centralized audit logging for all security-relevant actions.
 * Uses CORE DB only.
 */

const { getCoreDb } = require('./coreDb');

/**
 * Log an audit event
 *
 * @param {Object} event - Audit event details
 * @param {string} event.userId - User performing the action (null for system)
 * @param {string} event.householdId - Household context (if applicable)
 * @param {string} event.action - Action type (create, update, delete, view, login, etc.)
 * @param {string} event.resourceType - Type of resource (user, household, pantry_item, etc.)
 * @param {string} event.resourceId - ID of the resource (if applicable)
 * @param {Object} event.details - Additional context (old/new values, etc.)
 * @param {Object} event.req - Express request object (for IP/user agent)
 */
async function logAudit(event) {
  const db = getCoreDb();

  try {
    await db.audit_log.create({
      data: {
        user_id: event.userId || null,
        household_id: event.householdId || null,
        action: event.action,
        resource_type: event.resourceType,
        resource_id: event.resourceId || null,
        details: event.details || null,
        ip_address: event.req?.ip || event.req?.headers?.['x-forwarded-for'] || null,
        user_agent: event.req?.headers?.['user-agent'] || null
      }
    });
  } catch (err) {
    // Log but don't throw - audit failures shouldn't break functionality
    console.error('[AuditLog] Failed to log event:', err.message, event);
  }
}

// ============================================
// CONVENIENCE METHODS
// ============================================

/**
 * Log a login event
 */
async function logLogin(userId, req, details = {}) {
  await logAudit({
    userId,
    action: 'login',
    resourceType: 'session',
    details: { ...details, method: details.method || 'unknown' },
    req
  });
}

/**
 * Log a logout event
 */
async function logLogout(userId, req) {
  await logAudit({
    userId,
    action: 'logout',
    resourceType: 'session',
    req
  });
}

/**
 * Log resource creation
 */
async function logCreate(userId, householdId, resourceType, resourceId, details, req) {
  await logAudit({
    userId,
    householdId,
    action: 'create',
    resourceType,
    resourceId,
    details,
    req
  });
}

/**
 * Log resource update
 */
async function logUpdate(userId, householdId, resourceType, resourceId, details, req) {
  await logAudit({
    userId,
    householdId,
    action: 'update',
    resourceType,
    resourceId,
    details,
    req
  });
}

/**
 * Log resource deletion
 */
async function logDelete(userId, householdId, resourceType, resourceId, details, req) {
  await logAudit({
    userId,
    householdId,
    action: 'delete',
    resourceType,
    resourceId,
    details,
    req
  });
}

/**
 * Log permission denied
 */
async function logPermissionDenied(userId, householdId, resourceType, action, req) {
  await logAudit({
    userId,
    householdId,
    action: 'permission_denied',
    resourceType,
    details: { attempted_action: action },
    req
  });
}

/**
 * Log role change
 */
async function logRoleChange(userId, householdId, targetUserId, oldRole, newRole, req) {
  await logAudit({
    userId,
    householdId,
    action: 'role_change',
    resourceType: 'user_role',
    resourceId: targetUserId,
    details: { old_role: oldRole, new_role: newRole },
    req
  });
}

/**
 * Log invite action
 */
async function logInvite(userId, householdId, inviteId, action, details, req) {
  await logAudit({
    userId,
    householdId,
    action: `invite_${action}`, // invite_sent, invite_accepted, invite_revoked
    resourceType: 'invite',
    resourceId: inviteId,
    details,
    req
  });
}

// ============================================
// QUERY HELPERS
// ============================================

/**
 * Get recent audit logs for a household
 */
async function getHouseholdLogs(householdId, options = {}) {
  const db = getCoreDb();
  const { limit = 50, offset = 0, action, resourceType } = options;

  const where = { household_id: householdId };
  if (action) where.action = action;
  if (resourceType) where.resource_type = resourceType;

  return db.audit_log.findMany({
    where,
    orderBy: { created_at: 'desc' },
    take: limit,
    skip: offset
  });
}

/**
 * Get recent audit logs for a user
 */
async function getUserLogs(userId, options = {}) {
  const db = getCoreDb();
  const { limit = 50, offset = 0 } = options;

  return db.audit_log.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    take: limit,
    skip: offset
  });
}

module.exports = {
  logAudit,
  logLogin,
  logLogout,
  logCreate,
  logUpdate,
  logDelete,
  logPermissionDenied,
  logRoleChange,
  logInvite,
  getHouseholdLogs,
  getUserLogs
};
