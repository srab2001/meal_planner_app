/**
 * BadgeService - Achievement badge management
 * 
 * Tracks earned badges and criteria for new badges
 */

// Badge definitions with criteria
export const BADGE_DEFINITIONS = {
  // Streak badges
  FIRST_PLAN: {
    id: 'FIRST_PLAN',
    name: 'First Steps',
    description: 'Generated your first meal plan',
    icon: '🎯',
    category: 'streak',
    rarity: 'common'
  },
  TWO_WEEK_STREAK: {
    id: 'TWO_WEEK_STREAK',
    name: 'Getting Started',
    description: 'Maintained a 2-week planning streak',
    icon: '🌱',
    category: 'streak',
    rarity: 'common'
  },
  MONTH_STREAK: {
    id: 'MONTH_STREAK',
    name: 'Monthly Planner',
    description: 'Maintained a 4-week planning streak',
    icon: '📅',
    category: 'streak',
    rarity: 'uncommon'
  },
  TWO_MONTH_STREAK: {
    id: 'TWO_MONTH_STREAK',
    name: 'Dedicated',
    description: 'Maintained an 8-week planning streak',
    icon: '💪',
    category: 'streak',
    rarity: 'rare'
  },
  QUARTER_STREAK: {
    id: 'QUARTER_STREAK',
    name: 'Quarterly Champion',
    description: 'Maintained a 12-week planning streak',
    icon: '🏆',
    category: 'streak',
    rarity: 'epic'
  },
  HALF_YEAR_STREAK: {
    id: 'HALF_YEAR_STREAK',
    name: 'Half-Year Hero',
    description: 'Maintained a 26-week planning streak',
    icon: '⭐',
    category: 'streak',
    rarity: 'legendary'
  },
  YEAR_STREAK: {
    id: 'YEAR_STREAK',
    name: 'Year of Meals',
    description: 'Maintained a 52-week planning streak',
    icon: '👑',
    category: 'streak',
    rarity: 'legendary'
  },
  
  // Plan count badges
  FIVE_PLANS: {
    id: 'FIVE_PLANS',
    name: 'Regular Planner',
    description: 'Generated 5 meal plans',
    icon: '📝',
    category: 'plans',
    rarity: 'common'
  },
  TEN_PLANS: {
    id: 'TEN_PLANS',
    name: 'Planning Pro',
    description: 'Generated 10 meal plans',
    icon: '📊',
    category: 'plans',
    rarity: 'uncommon'
  },
  TWENTYFIVE_PLANS: {
    id: 'TWENTYFIVE_PLANS',
    name: 'Meal Master',
    description: 'Generated 25 meal plans',
    icon: '🎖️',
    category: 'plans',
    rarity: 'rare'
  },
  FIFTY_PLANS: {
    id: 'FIFTY_PLANS',
    name: 'Planning Expert',
    description: 'Generated 50 meal plans',
    icon: '🥇',
    category: 'plans',
    rarity: 'epic'
  },
  HUNDRED_PLANS: {
    id: 'HUNDRED_PLANS',
    name: 'Centurion',
    description: 'Generated 100 meal plans',
    icon: '💯',
    category: 'plans',
    rarity: 'legendary'
  },
  
  // Referral badges
  FIRST_REFERRAL: {
    id: 'FIRST_REFERRAL',
    name: 'Sharing is Caring',
    description: 'Referred your first friend',
    icon: '🤝',
    category: 'referral',
    rarity: 'common'
  },
  FIVE_REFERRALS: {
    id: 'FIVE_REFERRALS',
    name: 'Community Builder',
    description: 'Referred 5 friends',
    icon: '👥',
    category: 'referral',
    rarity: 'uncommon'
  },
  TEN_REFERRALS: {
    id: 'TEN_REFERRALS',
    name: 'Ambassador',
    description: 'Referred 10 friends',
    icon: '🌟',
    category: 'referral',
    rarity: 'rare'
  },
  
  // Engagement badges
  RECIPE_SAVER: {
    id: 'RECIPE_SAVER',
    name: 'Recipe Collector',
    description: 'Saved 10 recipes to favorites',
    icon: '❤️',
    category: 'engagement',
    rarity: 'common'
  },
  NUTRITION_TRACKER: {
    id: 'NUTRITION_TRACKER',
    name: 'Nutrition Tracker',
    description: 'Used the nutrition module 5 times',
    icon: '🥗',
    category: 'engagement',
    rarity: 'common'
  },
  EARLY_ADOPTER: {
    id: 'EARLY_ADOPTER',
    name: 'Early Adopter',
    description: 'Joined during beta',
    icon: '🚀',
    category: 'special',
    rarity: 'rare'
  }
};

class BadgeServiceClass {
  constructor() {
    this.STORAGE_KEY = 'asr_badges';
  }

  /**
   * Get all earned badges
   */
  getEarnedBadges() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading badges:', e);
    }
    return [];
  }

  /**
   * Save badges
   */
  saveBadges(badges) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(badges));
    } catch (e) {
      console.error('Error saving badges:', e);
    }
  }

  /**
   * Award a badge to user
   * Returns the badge if newly awarded, null if already had it
   */
  awardBadge(badgeId) {
    const badges = this.getEarnedBadges();
    
    // Check if already earned
    if (badges.some(b => b.id === badgeId)) {
      return null;
    }
    
    const badgeDefinition = BADGE_DEFINITIONS[badgeId];
    if (!badgeDefinition) {
      console.error('Unknown badge:', badgeId);
      return null;
    }
    
    const newBadge = {
      ...badgeDefinition,
      earnedAt: new Date().toISOString()
    };
    
    badges.push(newBadge);
    this.saveBadges(badges);
    
    return newBadge;
  }

  /**
   * Award multiple badges at once
   * Returns array of newly awarded badges
   */
  awardBadges(badgeIds) {
    const newBadges = [];
    for (const id of badgeIds) {
      const badge = this.awardBadge(id);
      if (badge) {
        newBadges.push(badge);
      }
    }
    return newBadges;
  }

  /**
   * Check if user has a specific badge
   */
  hasBadge(badgeId) {
    const badges = this.getEarnedBadges();
    return badges.some(b => b.id === badgeId);
  }

  /**
   * Get badges grouped by category
   */
  getBadgesByCategory() {
    const earned = this.getEarnedBadges();
    const earnedIds = new Set(earned.map(b => b.id));
    
    const categories = {};
    
    for (const [id, badge] of Object.entries(BADGE_DEFINITIONS)) {
      const category = badge.category;
      if (!categories[category]) {
        categories[category] = {
          earned: [],
          locked: []
        };
      }
      
      if (earnedIds.has(id)) {
        const earnedBadge = earned.find(b => b.id === id);
        categories[category].earned.push(earnedBadge);
      } else {
        categories[category].locked.push(badge);
      }
    }
    
    return categories;
  }

  /**
   * Get badge statistics
   */
  getStats() {
    const earned = this.getEarnedBadges();
    const total = Object.keys(BADGE_DEFINITIONS).length;
    
    const byRarity = {
      common: { earned: 0, total: 0 },
      uncommon: { earned: 0, total: 0 },
      rare: { earned: 0, total: 0 },
      epic: { earned: 0, total: 0 },
      legendary: { earned: 0, total: 0 }
    };
    
    for (const badge of Object.values(BADGE_DEFINITIONS)) {
      byRarity[badge.rarity].total++;
    }
    
    for (const badge of earned) {
      if (byRarity[badge.rarity]) {
        byRarity[badge.rarity].earned++;
      }
    }
    
    return {
      earned: earned.length,
      total,
      percentage: Math.round((earned.length / total) * 100),
      byRarity
    };
  }
}

export const BadgeService = new BadgeServiceClass();
