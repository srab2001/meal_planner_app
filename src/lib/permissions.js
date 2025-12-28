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
 */
async function getUserHouseholdRole(userId, householdId) {
  const db = getCoreDb();

  const membership = await db.household_memberships.findFirst({
    where: { user_id: userId, household_id: householdId, is_active: true }
  });

  return membership?.role || null;
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

  const role = await getUserHouseholdRole(userId, householdId);
  if (!role) return false;

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
  return allowedRoles.includes(role);
}

// ============================================
// HOUSEHOLD PERMISSIONS
// ============================================

/**
 * Check if user can edit household (members, invites, settings)
 */
async function canEditHousehold(userId, householdId) {
  if (await isGlobalAdmin(userId)) return true;

  const role = await getUserHouseholdRole(userId, householdId);
  return ['owner', 'household_admin', 'admin'].includes(role);
}

/**
 * Check if user can delete household
 */
async function canDeleteHousehold(userId, householdId) {
  if (await isGlobalAdmin(userId)) return true;

  const role = await getUserHouseholdRole(userId, householdId);
  return role === 'owner';
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

  const role = await getUserHouseholdRole(userId, householdId);
  const targetRole = await getUserHouseholdRole(targetUserId, householdId);

  // Owner can change anyone except other owners
  if (role === 'owner' && targetRole !== 'owner') return true;

  // Admin can change members and viewers
  if (['household_admin', 'admin'].includes(role) &&
      ['member', 'viewer'].includes(targetRole)) return true;

  return false;
}

// ============================================
// PANTRY PERMISSIONS
// ============================================

/**
 * Check if user can edit pantry (add/consume/waste items)
 */
async function canEditPantry(userId, householdId) {
  if (await isGlobalAdmin(userId)) return true;

  const role = await getUserHouseholdRole(userId, householdId);
  return ['owner', 'household_admin', 'admin', 'member'].includes(role);
}

/**
 * Check if user can view pantry
 */
async function canViewPantry(userId, householdId) {
  if (await isGlobalAdmin(userId)) return true;

  const role = await getUserHouseholdRole(userId, householdId);
  return !!role; // Any role can view
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
  const role = await getUserHouseholdRole(userId, householdId);
  if (['owner', 'household_admin'].includes(role)) {
    // Verify target is in same household
    const targetRole = await getUserHouseholdRole(targetUserId, householdId);
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
  const role = await getUserHouseholdRole(userId, householdId);
  const targetRole = await getUserHouseholdRole(targetUserId, householdId);
  return !!role && !!targetRole;
}

// ============================================
// COMPLIANCE PERMISSIONS
// ============================================

/**
 * Check if user can check-in compliance items
 */
async function canCheckin(userId, householdId) {
  if (await isGlobalAdmin(userId)) return true;

  const role = await getUserHouseholdRole(userId, householdId);
  return ['owner', 'household_admin', 'admin', 'member'].includes(role);
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

  // Pantry
  canEditPantry,
  canViewPantry,

  // Medical
  canEditMedical,
  canViewMedical,

  // Compliance
  canCheckin,

  // Middleware
  requirePermission
};
