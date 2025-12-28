/**
 * CORE DB API Routes
 *
 * System of record routes for households, permissions, status counts.
 * All routes use CORE DB only - no cross-DB joins.
 *
 * Endpoints:
 * - GET /api/core/households - List user's households
 * - GET /api/core/visible-apps - Get RBAC-filtered app list
 * - GET /api/core/status-counts - Get dashboard status counts
 */

const express = require('express');
const router = express.Router();
const { getCoreDb } = require('../src/lib/coreDb');
const { getVisibleApps } = require('../src/lib/permissions');

/**
 * Middleware: Verify authentication via token
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.substring(7);

  // For demo tokens, create a demo user
  if (token.startsWith('demo-token-')) {
    req.user = {
      id: 'demo-user-001',
      email: 'demo@asr.app',
      name: 'Demo User'
    };
    return next();
  }

  // For real tokens, verify against stored session
  // This would normally verify JWT or session token
  // For now, decode from localStorage (sent as base64 or similar)
  try {
    // Simplified: in production, verify JWT signature
    req.user = req.user || { id: 'unknown' };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ============================================
// HOUSEHOLDS
// ============================================

/**
 * GET /api/core/households
 * List households the user belongs to
 */
router.get('/households', requireAuth, async (req, res) => {
  try {
    const db = getCoreDb();
    const userId = req.user.id;

    // For demo user, return a demo household
    if (userId === 'demo-user-001') {
      return res.json({
        households: [
          {
            id: 'demo-household-001',
            name: 'Demo Household',
            role: 'owner',
            memberCount: 1
          }
        ]
      });
    }

    const memberships = await db.household_memberships.findMany({
      where: { user_id: userId, is_active: true },
      include: {
        household: {
          include: {
            memberships: {
              where: { is_active: true },
              select: { id: true }
            }
          }
        }
      }
    });

    const households = memberships.map(m => ({
      id: m.household.id,
      name: m.household.name,
      role: m.role,
      memberCount: m.household.memberships.length
    }));

    res.json({ households });
  } catch (err) {
    console.error('[Core API] Error fetching households:', err);
    res.status(500).json({ error: 'Failed to fetch households' });
  }
});

// ============================================
// VISIBLE APPS (RBAC)
// ============================================

/**
 * GET /api/core/visible-apps
 * Get apps the user can access based on RBAC
 */
router.get('/visible-apps', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const householdId = req.query.household_id;

    if (!householdId) {
      return res.status(400).json({ error: 'household_id required' });
    }

    // For demo user, return all apps
    if (userId === 'demo-user-001') {
      return res.json({
        apps: [
          'meal-planner', 'fitness', 'coaching', 'pantry',
          'compliance', 'household', 'medical'
        ]
      });
    }

    const apps = await getVisibleApps(userId, householdId);
    res.json({ apps });
  } catch (err) {
    console.error('[Core API] Error fetching visible apps:', err);
    res.status(500).json({ error: 'Failed to fetch visible apps' });
  }
});

// ============================================
// STATUS COUNTS
// ============================================

/**
 * GET /api/core/status-counts
 * Get dashboard status counts for a household
 */
router.get('/status-counts', requireAuth, async (req, res) => {
  try {
    const householdId = req.query.household_id;
    const userId = req.user.id;

    if (!householdId) {
      return res.status(400).json({ error: 'household_id required' });
    }

    // For demo user, return demo counts
    if (userId === 'demo-user-001') {
      return res.json({
        pantryExpiring: 3,
        complianceMissed: 2,
        constraintsCount: 5
      });
    }

    const db = getCoreDb();

    // Get pantry items expiring in next 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const pantry = await db.pantries.findFirst({
      where: { household_id: householdId }
    });

    let pantryExpiring = 0;
    if (pantry) {
      pantryExpiring = await db.pantry_items.count({
        where: {
          pantry_id: pantry.id,
          status: 'available',
          expiration_date: {
            lte: sevenDaysFromNow,
            gte: new Date()
          }
        }
      });
    }

    // Get missed compliance items (pending and past due)
    const complianceMissed = await db.plan_items.count({
      where: {
        plan: { household_id: householdId },
        status: 'pending',
        scheduled_at: { lt: new Date() }
      }
    });

    // Get active constraints for household members
    const memberships = await db.household_memberships.findMany({
      where: { household_id: householdId, is_active: true },
      select: { user_id: true }
    });

    const userIds = memberships.map(m => m.user_id);

    const constraintsCount = await db.user_constraints.count({
      where: {
        user_id: { in: userIds },
        is_active: true
      }
    });

    res.json({
      pantryExpiring,
      complianceMissed,
      constraintsCount
    });
  } catch (err) {
    console.error('[Core API] Error fetching status counts:', err);
    res.status(500).json({ error: 'Failed to fetch status counts' });
  }
});

module.exports = router;
