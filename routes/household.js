/**
 * Household API Routes
 *
 * IMPORTANT: Uses CORE DB (Neon) NOT Render DB
 * See docs/ISOLATION.md for database isolation rules.
 *
 * Endpoints:
 * - POST /api/core/household - Create new household
 * - GET /api/core/household/:id - Get household details
 * - PUT /api/core/household/:id - Update household
 * - GET /api/core/household/my - Get user's households
 * - POST /api/core/household/:id/members - Add member to household
 */

const express = require('express');
const router = express.Router();
const { getCoreDb } = require('../src/lib/coreDb');

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

const VALID_ROLES = ['owner', 'admin', 'member', 'viewer'];
const VALID_DIETS = ['none', 'vegetarian', 'vegan', 'keto', 'paleo', 'gluten-free', 'dairy-free', 'halal', 'kosher'];

function validateHouseholdName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Household name is required' };
  }
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 100) {
    return { valid: false, error: 'Household name must be 1-100 characters' };
  }
  return { valid: true, value: trimmed };
}

function validateHouseholdSize(size) {
  const num = parseInt(size, 10);
  if (isNaN(num) || num < 1 || num > 50) {
    return { valid: false, error: 'Household size must be between 1 and 50' };
  }
  return { valid: true, value: num };
}

function validateRole(role) {
  if (!role || !VALID_ROLES.includes(role)) {
    return { valid: false, error: `Role must be one of: ${VALID_ROLES.join(', ')}` };
  }
  return { valid: true, value: role };
}

function validateDiet(diet) {
  if (!diet) return { valid: true, value: null };
  if (!VALID_DIETS.includes(diet)) {
    return { valid: false, error: `Diet must be one of: ${VALID_DIETS.join(', ')}` };
  }
  return { valid: true, value: diet };
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Verify authentication
 */
const verifyAuth = (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

/**
 * Verify user is member of household
 */
const verifyHouseholdMember = async (req, res, next) => {
  const householdId = req.params.id || req.body.household_id;
  if (!householdId) {
    return res.status(400).json({ error: 'Household ID is required' });
  }

  const db = getCoreDb();
  const membership = await db.household_memberships.findFirst({
    where: {
      user_id: req.user.id,
      household_id: householdId,
      is_active: true
    }
  });

  if (!membership) {
    return res.status(403).json({ error: 'Access denied to this household' });
  }

  req.householdId = householdId;
  req.membershipRole = membership.role;
  next();
};

/**
 * Verify user is owner/admin of household
 */
const verifyHouseholdAdmin = (req, res, next) => {
  if (!['owner', 'admin'].includes(req.membershipRole)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /my - Get user's households
 */
router.get('/my', verifyAuth, async (req, res) => {
  try {
    const db = getCoreDb();

    const memberships = await db.household_memberships.findMany({
      where: {
        user_id: req.user.id,
        is_active: true
      },
      include: {
        household: true
      },
      orderBy: {
        joined_at: 'desc'
      }
    });

    const households = memberships.map(m => ({
      id: m.household.id,
      name: m.household.name,
      size: m.household.size,
      role: m.role,
      joinedAt: m.joined_at,
      sharePantryInventory: m.household.share_pantry_inventory,
      shareShoppingList: m.household.share_shopping_list,
      shareMealPlans: m.household.share_meal_plans
    }));

    res.json({ households });
  } catch (err) {
    console.error('Error fetching user households:', err);
    res.status(500).json({ error: 'Failed to fetch households' });
  }
});

/**
 * POST / - Create new household
 */
router.post('/', verifyAuth, async (req, res) => {
  try {
    const {
      name,
      size = 1,
      members = [],
      sharePantryInventory = true,
      shareShoppingList = true,
      shareMealPlans = true,
      primaryShopperId = null
    } = req.body;

    // Validate household name
    const nameValidation = validateHouseholdName(name);
    if (!nameValidation.valid) {
      return res.status(400).json({ error: nameValidation.error });
    }

    // Validate size
    const sizeValidation = validateHouseholdSize(size);
    if (!sizeValidation.valid) {
      return res.status(400).json({ error: sizeValidation.error });
    }

    // Validate members
    for (const member of members) {
      if (member.role) {
        const roleValidation = validateRole(member.role);
        if (!roleValidation.valid) {
          return res.status(400).json({ error: roleValidation.error });
        }
      }
      if (member.diet) {
        const dietValidation = validateDiet(member.diet);
        if (!dietValidation.valid) {
          return res.status(400).json({ error: dietValidation.error });
        }
      }
    }

    const db = getCoreDb();

    // Create household
    const household = await db.households.create({
      data: {
        name: nameValidation.value,
        size: sizeValidation.value,
        share_pantry_inventory: sharePantryInventory,
        share_shopping_list: shareShoppingList,
        share_meal_plans: shareMealPlans,
        primary_shopper_id: primaryShopperId
      }
    });

    // Add current user as owner
    await db.household_memberships.create({
      data: {
        user_id: req.user.id,
        household_id: household.id,
        role: 'owner',
        display_name: req.user.display_name || req.user.email,
        diet_preference: members.find(m => m.isCurrentUser)?.diet || null
      }
    });

    // Create default pantry for household
    await db.pantries.create({
      data: {
        household_id: household.id,
        name: 'Main Pantry'
      }
    });

    // Store pending members (will need invites later)
    const pendingMembers = members.filter(m => !m.isCurrentUser && m.name);

    res.status(201).json({
      household: {
        id: household.id,
        name: household.name,
        size: household.size,
        sharePantryInventory: household.share_pantry_inventory,
        shareShoppingList: household.share_shopping_list,
        shareMealPlans: household.share_meal_plans
      },
      pendingMembers: pendingMembers.length,
      message: 'Household created successfully'
    });
  } catch (err) {
    console.error('Error creating household:', err);
    res.status(500).json({ error: 'Failed to create household' });
  }
});

/**
 * GET /:id - Get household details
 */
router.get('/:id', verifyAuth, verifyHouseholdMember, async (req, res) => {
  try {
    const db = getCoreDb();

    const household = await db.households.findUnique({
      where: { id: req.householdId },
      include: {
        memberships: {
          where: { is_active: true },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                display_name: true,
                picture: true
              }
            }
          }
        }
      }
    });

    if (!household) {
      return res.status(404).json({ error: 'Household not found' });
    }

    res.json({
      household: {
        id: household.id,
        name: household.name,
        size: household.size,
        sharePantryInventory: household.share_pantry_inventory,
        shareShoppingList: household.share_shopping_list,
        shareMealPlans: household.share_meal_plans,
        primaryShopperId: household.primary_shopper_id,
        members: household.memberships.map(m => ({
          id: m.id,
          userId: m.user_id,
          displayName: m.display_name || m.user.display_name || m.user.email,
          email: m.user.email,
          picture: m.user.picture,
          role: m.role,
          dietPreference: m.diet_preference,
          joinedAt: m.joined_at
        }))
      }
    });
  } catch (err) {
    console.error('Error fetching household:', err);
    res.status(500).json({ error: 'Failed to fetch household' });
  }
});

/**
 * PUT /:id - Update household
 */
router.put('/:id', verifyAuth, verifyHouseholdMember, verifyHouseholdAdmin, async (req, res) => {
  try {
    const {
      name,
      size,
      sharePantryInventory,
      shareShoppingList,
      shareMealPlans,
      primaryShopperId
    } = req.body;

    const updateData = {};

    if (name !== undefined) {
      const nameValidation = validateHouseholdName(name);
      if (!nameValidation.valid) {
        return res.status(400).json({ error: nameValidation.error });
      }
      updateData.name = nameValidation.value;
    }

    if (size !== undefined) {
      const sizeValidation = validateHouseholdSize(size);
      if (!sizeValidation.valid) {
        return res.status(400).json({ error: sizeValidation.error });
      }
      updateData.size = sizeValidation.value;
    }

    if (sharePantryInventory !== undefined) {
      updateData.share_pantry_inventory = Boolean(sharePantryInventory);
    }

    if (shareShoppingList !== undefined) {
      updateData.share_shopping_list = Boolean(shareShoppingList);
    }

    if (shareMealPlans !== undefined) {
      updateData.share_meal_plans = Boolean(shareMealPlans);
    }

    if (primaryShopperId !== undefined) {
      updateData.primary_shopper_id = primaryShopperId;
    }

    const db = getCoreDb();
    const household = await db.households.update({
      where: { id: req.householdId },
      data: updateData
    });

    res.json({
      household: {
        id: household.id,
        name: household.name,
        size: household.size,
        sharePantryInventory: household.share_pantry_inventory,
        shareShoppingList: household.share_shopping_list,
        shareMealPlans: household.share_meal_plans,
        primaryShopperId: household.primary_shopper_id
      }
    });
  } catch (err) {
    console.error('Error updating household:', err);
    res.status(500).json({ error: 'Failed to update household' });
  }
});

/**
 * POST /:id/members - Add/update member
 */
router.post('/:id/members', verifyAuth, verifyHouseholdMember, verifyHouseholdAdmin, async (req, res) => {
  try {
    const { userId, displayName, role = 'member', dietPreference } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const roleValidation = validateRole(role);
    if (!roleValidation.valid) {
      return res.status(400).json({ error: roleValidation.error });
    }

    const dietValidation = validateDiet(dietPreference);
    if (!dietValidation.valid) {
      return res.status(400).json({ error: dietValidation.error });
    }

    const db = getCoreDb();

    // Check if membership already exists
    const existing = await db.household_memberships.findFirst({
      where: {
        user_id: userId,
        household_id: req.householdId
      }
    });

    let membership;
    if (existing) {
      // Update existing membership
      membership = await db.household_memberships.update({
        where: { id: existing.id },
        data: {
          role: roleValidation.value,
          display_name: displayName || existing.display_name,
          diet_preference: dietValidation.value,
          is_active: true
        }
      });
    } else {
      // Create new membership
      membership = await db.household_memberships.create({
        data: {
          user_id: userId,
          household_id: req.householdId,
          role: roleValidation.value,
          display_name: displayName,
          diet_preference: dietValidation.value
        }
      });
    }

    res.json({
      member: {
        id: membership.id,
        userId: membership.user_id,
        role: membership.role,
        displayName: membership.display_name,
        dietPreference: membership.diet_preference
      }
    });
  } catch (err) {
    console.error('Error adding member:', err);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

/**
 * PUT /:id/members/:memberId - Update member
 */
router.put('/:id/members/:memberId', verifyAuth, verifyHouseholdMember, async (req, res) => {
  try {
    const { memberId } = req.params;
    const { displayName, role, dietPreference } = req.body;

    const db = getCoreDb();

    // Get the membership
    const membership = await db.household_memberships.findFirst({
      where: {
        id: memberId,
        household_id: req.householdId
      }
    });

    if (!membership) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Users can update their own profile, admins can update anyone
    const isOwnProfile = membership.user_id === req.user.id;
    const isAdmin = ['owner', 'admin'].includes(req.membershipRole);

    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({ error: 'Cannot update other members' });
    }

    // Only admins can change roles
    if (role !== undefined && !isAdmin) {
      return res.status(403).json({ error: 'Only admins can change roles' });
    }

    const updateData = {};

    if (displayName !== undefined) {
      updateData.display_name = displayName;
    }

    if (role !== undefined && isAdmin) {
      const roleValidation = validateRole(role);
      if (!roleValidation.valid) {
        return res.status(400).json({ error: roleValidation.error });
      }
      updateData.role = roleValidation.value;
    }

    if (dietPreference !== undefined) {
      const dietValidation = validateDiet(dietPreference);
      if (!dietValidation.valid) {
        return res.status(400).json({ error: dietValidation.error });
      }
      updateData.diet_preference = dietValidation.value;
    }

    const updated = await db.household_memberships.update({
      where: { id: memberId },
      data: updateData
    });

    res.json({
      member: {
        id: updated.id,
        userId: updated.user_id,
        role: updated.role,
        displayName: updated.display_name,
        dietPreference: updated.diet_preference
      }
    });
  } catch (err) {
    console.error('Error updating member:', err);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

module.exports = router;
