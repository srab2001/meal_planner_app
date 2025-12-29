/**
 * Permission Helpers - CORE DB RBAC
 *
 * All permission checks use CORE DB only.
 * No cross-DB joins.
 */

const { getCoreDb } = require('./coreDb');

// Role hierarchy (higher index = more permissions)
const ROLE_HIERARCHY = ['viewer', 'member', 'admin', 'household_admin', 'owner'];

/**
 * Check if role1 >= role2 in hierarchy
 */
function hasRoleLevel(userRole, requiredRole) {
  const userLevel = ROLE_HIERARCHY.indexOf(userRole);
  const requiredLevel = ROLE_HIERARCHY.indexOf(requiredRole);
  return userLevel >= requiredLevel;
}

/**
 * Get user's role in a household
 * @param {Object} params - { userId, householdId }
 * @returns {Promise<{ membershipRole: string|null }>}
 */
async function getUserHouseholdRole({ userId, householdId }) {
  const db = getCoreDb();

  const membership = await db.household_memberships.findFirst({
    where: { user_id: userId, household_id: householdId, is_active: true }
  });

  return { membershipRole: membership?.role || null };
}

/**
 * Synchronous check: can this role view pantry?
 * @param {string|null} membershipRole
 * @returns {boolean}
 */
function canViewPantryRole(membershipRole) {
  if (!membershipRole) return false;
  return ['owner', 'admin', 'member', 'viewer'].includes(membershipRole);
}

/**
 * Synchronous check: can this role edit pantry?
 * @param {string|null} membershipRole
 * @returns {boolean}
 */
function canEditPantryRole(membershipRole) {
  if (!membershipRole) return false;
  return ['owner', 'admin', 'member'].includes(membershipRole);
}

/**
 * Check if user is global admin
 */
async function isGlobalAdmin(userId) {
  const db = getCoreDb();

  const adminRole = await db.user_roles.findFirst({
    where: {
      user_id: userId,
      household_id: null,
      role: { name: 'admin' }
    },
    include: { role: true }
  });

  return !!adminRole;
}

// ============================================
// APP VISIBILITY
// ============================================

/**
 * Check if user can view an app
 */
async function canViewApp(userId, householdId, appId) {
  // Global admin can view all
  if (await isGlobalAdmin(userId)) return true;

  const { membershipRole } = await getUserHouseholdRole({ userId, householdId });
  if (!membershipRole) return false;

  // App-specific visibility rules
  const appRules = {
    'meal-planner': ['viewer', 'member', 'admin', 'household_admin', 'owner'],
    'fitness': ['viewer', 'member', 'admin', 'household_admin', 'owner'],
    'coaching': ['viewer', 'member', 'admin', 'household_admin', 'owner'],
    'pantry': ['viewer', 'member', 'admin', 'household_admin', 'owner'],
    'compliance': ['viewer', 'member', 'admin', 'household_admin', 'owner'],
    'household': ['viewer', 'member', 'admin', 'household_admin', 'owner'],
    'medical': ['viewer', 'member', 'admin', 'household_admin', 'owner'],
    'admin': [] // Global admin only, handled above
  };

  const allowedRoles = appRules[appId] || [];
  return allowedRoles.includes(membershipRole);
}

// ============================================
// HOUSEHOLD PERMISSIONS
// ============================================

/**
 * Check if user can edit household (members, invites, settings)
 */
async function canEditHousehold(userId, householdId) {
  if (await isGlobalAdmin(userId)) return true;

  const { membershipRole } = await getUserHouseholdRole({ userId, householdId });
  return ['owner', 'household_admin', 'admin'].includes(membershipRole);
}

/**
 * Check if user can delete household
 */
async function canDeleteHousehold(userId, householdId) {
  if (await isGlobalAdmin(userId)) return true;

  const { membershipRole } = await getUserHouseholdRole({ userId, householdId });
  return membershipRole === 'owner';
}

/**
 * Check if user can invite members
 */
async function canInviteMembers(userId, householdId) {
  return canEditHousehold(userId, householdId);
}

/**
 * Check if user can change member roles
 */
async function canChangeRoles(userId, householdId, targetUserId) {
  if (userId === targetUserId) return false; // Can't change own role

  if (await isGlobalAdmin(userId)) return true;

  const { membershipRole } = await getUserHouseholdRole({ userId, householdId });
  const { membershipRole: targetRole } = await getUserHouseholdRole({ userId: targetUserId, householdId });

  // Owner can change anyone except other owners
  if (membershipRole === 'owner' && targetRole !== 'owner') return true;

  // Admin can change members and viewers
  if (['household_admin', 'admin'].includes(membershipRole) &&
      ['member', 'viewer'].includes(targetRole)) return true;

  return false;
}

// ============================================
// PANTRY PERMISSIONS
// ============================================

/**
 * Check if user can edit pantry (add/consume/waste items)
 * Async version that fetches role from DB
 */
async function canEditPantry(userId, householdId) {
  if (await isGlobalAdmin(userId)) return true;

  const { membershipRole } = await getUserHouseholdRole({ userId, householdId });
  return canEditPantryRole(membershipRole);
}

/**
 * Check if user can view pantry
 * Async version that fetches role from DB
 */
async function canViewPantry(userId, householdId) {
  if (await isGlobalAdmin(userId)) return true;

  const { membershipRole } = await getUserHouseholdRole({ userId, householdId });
  return canViewPantryRole(membershipRole);
}

// ============================================
// MEDICAL PERMISSIONS
// ============================================

/**
 * Check if user can edit medical profile
 * Users can only edit their own medical profile
 */
async function canEditMedical(userId, householdId, targetUserId) {
  // Users can edit their own profile
  if (userId === targetUserId) return true;

  // Global admin can edit anyone
  if (await isGlobalAdmin(userId)) return true;

  // Household admin/owner can edit household members' profiles
  const { membershipRole } = await getUserHouseholdRole({ userId, householdId });
  if (['owner', 'household_admin'].includes(membershipRole)) {
    // Verify target is in same household
    const { membershipRole: targetRole } = await getUserHouseholdRole({ userId: targetUserId, householdId });
    return !!targetRole;
  }

  return false;
}

/**
 * Check if user can view medical profile
 */
async function canViewMedical(userId, householdId, targetUserId) {
  // Users can view their own profile
  if (userId === targetUserId) return true;

  // Global admin can view anyone
  if (await isGlobalAdmin(userId)) return true;

  // Household members can view each other (for meal planning purposes)
  const { membershipRole } = await getUserHouseholdRole({ userId, householdId });
  const { membershipRole: targetRole } = await getUserHouseholdRole({ userId: targetUserId, householdId });
  return !!membershipRole && !!targetRole;
}

// ============================================
// COMPLIANCE PERMISSIONS
// ============================================

/**
 * Check if user can check-in compliance items
 */
async function canCheckin(userId, householdId) {
  if (await isGlobalAdmin(userId)) return true;

  const { membershipRole } = await getUserHouseholdRole({ userId, householdId });
  return ['owner', 'household_admin', 'admin', 'member'].includes(membershipRole);
}

// ============================================
// MIDDLEWARE HELPERS
// ============================================

/**
 * Express middleware to check permission
 */
function requirePermission(permissionFn, getParams) {
  return async (req, res, next) => {
    try {
      const params = getParams(req);
      const hasPermission = await permissionFn(...params);

      if (!hasPermission) {
        return res.status(403).json({
          error: 'forbidden',
          message: 'You do not have permission to perform this action'
        });
      }

      next();
    } catch (err) {
      console.error('[Permissions] Error checking permission:', err);
      return res.status(500).json({
        error: 'permission_check_failed',
        message: 'Failed to verify permissions'
      });
    }
  };
}

/**
 * Get visible apps for user in household
 */
async function getVisibleApps(userId, householdId) {
  const apps = [
    'meal-planner', 'fitness', 'coaching', 'pantry',
    'compliance', 'household', 'medical'
  ];

  const visible = [];
  for (const appId of apps) {
    if (await canViewApp(userId, householdId, appId)) {
      visible.push(appId);
    }
  }

  // Check admin separately
  if (await isGlobalAdmin(userId)) {
    visible.push('admin');
  }

  return visible;
}

module.exports = {
  // Role helpers
  hasRoleLevel,
  getUserHouseholdRole,
  isGlobalAdmin,

  // App visibility
  canViewApp,
  getVisibleApps,

  // Household
  canEditHousehold,
  canDeleteHousehold,
  canInviteMembers,
  canChangeRoles,

  // Pantry (async - fetch role from DB)
  canEditPantry,
  canViewPantry,

  // Pantry (sync - use after role is already fetched)
  canEditPantryRole,
  canViewPantryRole,

  // Medical
  canEditMedical,
  canViewMedical,

  // Compliance
  canCheckin,

  // Middleware
  requirePermission
};
