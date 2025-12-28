/**
 * CORE DB Client Wrapper
 *
 * System of record for users, roles, households, medical, pantry, compliance.
 * Uses Neon PostgreSQL (core_db_next).
 */

const { PrismaClient } = require('@prisma/client');

// Singleton instance
let coreDbInstance = null;

/**
 * Get CORE DB Prisma client instance
 * Uses singleton pattern to prevent connection pool exhaustion
 */
function getCoreDb() {
  if (!coreDbInstance) {
    coreDbInstance = new PrismaClient({
      datasources: {
        db: {
          url: process.env.CORE_DATABASE_URL
        }
      },
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error']
    });
  }
  return coreDbInstance;
}

/**
 * Disconnect CORE DB client (for cleanup)
 */
async function disconnectCoreDb() {
  if (coreDbInstance) {
    await coreDbInstance.$disconnect();
    coreDbInstance = null;
  }
}

/**
 * Provision user on login
 * - Upsert user by email
 * - Create household if first login
 * - Create membership as owner
 * - Assign default roles
 */
async function provisionUserOnLogin(userData) {
  const db = getCoreDb();

  const { email, displayName, picture, googleId } = userData;

  // Upsert user
  const user = await db.users.upsert({
    where: { email },
    update: {
      display_name: displayName || undefined,
      picture: picture || undefined,
      google_id: googleId || undefined,
      last_login_at: new Date(),
      updated_at: new Date()
    },
    create: {
      email,
      display_name: displayName,
      picture,
      google_id: googleId,
      status: 'active',
      last_login_at: new Date()
    }
  });

  // Check if user has any household memberships
  const existingMembership = await db.household_memberships.findFirst({
    where: { user_id: user.id }
  });

  if (!existingMembership) {
    // First login - create household and membership
    const household = await db.households.create({
      data: {
        name: `${displayName || email}'s Household`
      }
    });

    await db.household_memberships.create({
      data: {
        user_id: user.id,
        household_id: household.id,
        role: 'owner',
        is_active: true
      }
    });

    // Get or create member role
    let memberRole = await db.roles.findUnique({
      where: { name: 'member' }
    });

    if (!memberRole) {
      memberRole = await db.roles.create({
        data: {
          name: 'member',
          description: 'Standard household member',
          permissions: JSON.stringify(['read', 'write'])
        }
      });
    }

    // Assign member role for this household
    await db.user_roles.create({
      data: {
        user_id: user.id,
        role_id: memberRole.id,
        household_id: household.id
      }
    });

    console.log(`[CORE DB] Provisioned new user: ${email}, household: ${household.id}`);

    return { user, household, isNewUser: true };
  }

  // Existing user - get their active household
  const membership = await db.household_memberships.findFirst({
    where: {
      user_id: user.id,
      is_active: true
    },
    include: { household: true }
  });

  console.log(`[CORE DB] Existing user login: ${email}`);

  return {
    user,
    household: membership?.household || null,
    isNewUser: false
  };
}

/**
 * Get user with households and roles
 */
async function getUserWithContext(userId) {
  const db = getCoreDb();

  const user = await db.users.findUnique({
    where: { id: userId },
    include: {
      household_memberships: {
        where: { is_active: true },
        include: { household: true }
      },
      user_roles: {
        include: { role: true, household: true }
      }
    }
  });

  return user;
}

/**
 * Get household context for user
 */
async function getHouseholdContext(userId, householdId) {
  const db = getCoreDb();

  const membership = await db.household_memberships.findFirst({
    where: {
      user_id: userId,
      household_id: householdId,
      is_active: true
    },
    include: {
      household: true,
      user: true
    }
  });

  if (!membership) {
    return null;
  }

  // Get user's role in this household
  const userRole = await db.user_roles.findFirst({
    where: {
      user_id: userId,
      household_id: householdId
    },
    include: { role: true }
  });

  return {
    user: membership.user,
    household: membership.household,
    membership,
    role: userRole?.role || null
  };
}

/**
 * Seed default roles (run once during setup)
 */
async function seedRoles() {
  const db = getCoreDb();

  const defaultRoles = [
    { name: 'admin', description: 'Global administrator', permissions: ['*'] },
    { name: 'household_admin', description: 'Household administrator', permissions: ['manage_members', 'read', 'write', 'delete'] },
    { name: 'member', description: 'Standard member', permissions: ['read', 'write'] },
    { name: 'viewer', description: 'Read-only access', permissions: ['read'] }
  ];

  for (const role of defaultRoles) {
    await db.roles.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
        description: role.description,
        permissions: JSON.stringify(role.permissions)
      }
    });
  }

  console.log('[CORE DB] Default roles seeded');
}

/**
 * Seed restriction rules (medical guardrails)
 */
async function seedRestrictionRules() {
  const db = getCoreDb();

  const rules = [
    { rule_key: 'diabetes_sugar', condition: 'diabetes', restriction: 'sugar', max_daily_value: 25, unit: 'g', severity: 'required' },
    { rule_key: 'diabetes_carbs', condition: 'diabetes', restriction: 'carbohydrates', max_daily_value: 130, unit: 'g', severity: 'suggested' },
    { rule_key: 'hypertension_sodium', condition: 'hypertension', restriction: 'sodium', max_daily_value: 1500, unit: 'mg', severity: 'required' },
    { rule_key: 'celiac_gluten', condition: 'celiac', restriction: 'gluten', max_daily_value: 0, unit: 'mg', severity: 'critical' },
    { rule_key: 'kidney_potassium', condition: 'kidney_disease', restriction: 'potassium', max_daily_value: 2000, unit: 'mg', severity: 'required' },
    { rule_key: 'kidney_phosphorus', condition: 'kidney_disease', restriction: 'phosphorus', max_daily_value: 800, unit: 'mg', severity: 'required' },
    { rule_key: 'heart_cholesterol', condition: 'heart_disease', restriction: 'cholesterol', max_daily_value: 200, unit: 'mg', severity: 'suggested' },
    { rule_key: 'heart_saturated_fat', condition: 'heart_disease', restriction: 'saturated_fat', max_daily_value: 13, unit: 'g', severity: 'required' }
  ];

  for (const rule of rules) {
    await db.restriction_rules.upsert({
      where: { rule_key: rule.rule_key },
      update: {},
      create: rule
    });
  }

  console.log('[CORE DB] Restriction rules seeded');
}

module.exports = {
  getCoreDb,
  disconnectCoreDb,
  provisionUserOnLogin,
  getUserWithContext,
  getHouseholdContext,
  seedRoles,
  seedRestrictionRules
};
