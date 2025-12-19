/**
 * NutritionSnapshotService
 * 
 * Caches nutrition calculations per meal plan for performance.
 * Avoids recomputing unless meal plan data changes.
 * 
 * Storage: localStorage with plan hash for cache invalidation
 */

const CACHE_KEY = 'nutrition_snapshot_cache';
const CACHE_VERSION = '1.0';

export class NutritionSnapshotService {
  constructor() {
    this.cache = this._loadCache();
  }

  /**
   * Load cache from localStorage
   */
  _loadCache() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.version === CACHE_VERSION) {
          return parsed.snapshots || {};
        }
      }
    } catch (error) {
      console.warn('[NutritionSnapshot] Cache read error:', error);
    }
    return {};
  }

  /**
   * Save cache to localStorage
   */
  _saveCache() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        version: CACHE_VERSION,
        snapshots: this.cache,
        lastUpdated: new Date().toISOString()
      }));
    } catch (error) {
      console.warn('[NutritionSnapshot] Cache write error:', error);
    }
  }

  /**
   * Generate hash from meal plan data for cache invalidation
   */
  _generatePlanHash(mealPlanData) {
    if (!mealPlanData) return null;
    
    // Create hash from plan ID + meals count + first/last meal names
    const meals = mealPlanData.meals || [];
    const hashData = {
      id: mealPlanData.id,
      mealCount: meals.length,
      firstMeal: meals[0]?.name || '',
      lastMeal: meals[meals.length - 1]?.name || '',
      createdAt: mealPlanData.createdAt
    };
    
    return btoa(JSON.stringify(hashData)).substring(0, 32);
  }

  /**
   * Get cached snapshot if valid, otherwise compute and cache
   * @param {string} userId - User ID
   * @param {Object} mealPlanData - Current meal plan data
   * @returns {Object|null} Nutrition snapshot
   */
  getSnapshot(userId, mealPlanData) {
    if (!mealPlanData) return null;

    const planHash = this._generatePlanHash(mealPlanData);
    const cacheKey = `${userId}_${planHash}`;

    // Check if we have a valid cached snapshot
    if (this.cache[cacheKey]) {
      console.log('[NutritionSnapshot] ✅ Using cached snapshot');
      return this.cache[cacheKey];
    }

    // Compute new snapshot
    console.log('[NutritionSnapshot] 📊 Computing new snapshot...');
    const snapshot = this._computeSnapshot(mealPlanData);
    
    // Cache it
    this.cache[cacheKey] = snapshot;
    this._cleanOldSnapshots(userId);
    this._saveCache();

    return snapshot;
  }

  /**
   * Check if snapshot needs recomputation
   */
  needsRecompute(userId, mealPlanData) {
    if (!mealPlanData) return false;
    
    const planHash = this._generatePlanHash(mealPlanData);
    const cacheKey = `${userId}_${planHash}`;
    
    return !this.cache[cacheKey];
  }

  /**
   * Compute nutrition snapshot from meal plan data
   * READ-ONLY - does not modify meal plan
   */
  _computeSnapshot(mealPlanData) {
    const meals = mealPlanData.meals || [];
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Per-meal nutrition
    const perMealNutrition = meals.map((meal, index) => ({
      id: meal.id || `meal_${index}`,
      name: meal.name || 'Unnamed Meal',
      day: meal.day || 'Unknown',
      mealType: meal.mealType || 'meal',
      calories: parseInt(meal.calories) || 0,
      protein_g: parseInt(meal.protein) || 0,
      carbs_g: parseInt(meal.carbs) || 0,
      fat_g: parseInt(meal.fat) || 0,
      fiber_g: parseInt(meal.fiber) || 0,
      sodium_mg: parseInt(meal.sodium) || 0
    }));

    // Per-day breakdown
    const perDayBreakdown = daysOfWeek.map(day => {
      const dayMeals = perMealNutrition.filter(meal => 
        meal.day?.toLowerCase() === day.toLowerCase()
      );

      return {
        day,
        meals: dayMeals,
        mealCount: dayMeals.length,
        totals: dayMeals.reduce((acc, meal) => ({
          calories: acc.calories + meal.calories,
          protein_g: acc.protein_g + meal.protein_g,
          carbs_g: acc.carbs_g + meal.carbs_g,
          fat_g: acc.fat_g + meal.fat_g,
          fiber_g: acc.fiber_g + meal.fiber_g,
          sodium_mg: acc.sodium_mg + meal.sodium_mg
        }), { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sodium_mg: 0 })
      };
    });

    // Weekly summary
    const weeklyTotals = perDayBreakdown.reduce((acc, day) => ({
      calories: acc.calories + day.totals.calories,
      protein_g: acc.protein_g + day.totals.protein_g,
      carbs_g: acc.carbs_g + day.totals.carbs_g,
      fat_g: acc.fat_g + day.totals.fat_g,
      fiber_g: acc.fiber_g + day.totals.fiber_g,
      sodium_mg: acc.sodium_mg + day.totals.sodium_mg
    }), { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sodium_mg: 0 });

    const daysWithMeals = perDayBreakdown.filter(d => d.mealCount > 0).length || 1;
    
    const dailyAverages = {
      calories: Math.round(weeklyTotals.calories / daysWithMeals),
      protein_g: Math.round(weeklyTotals.protein_g / daysWithMeals),
      carbs_g: Math.round(weeklyTotals.carbs_g / daysWithMeals),
      fat_g: Math.round(weeklyTotals.fat_g / daysWithMeals),
      fiber_g: Math.round(weeklyTotals.fiber_g / daysWithMeals),
      sodium_mg: Math.round(weeklyTotals.sodium_mg / daysWithMeals)
    };

    // Macro percentages
    const totalMacroCalories = (dailyAverages.protein_g * 4) + 
                               (dailyAverages.carbs_g * 4) + 
                               (dailyAverages.fat_g * 9);
    
    const macroPercentages = totalMacroCalories > 0 ? {
      protein: Math.round((dailyAverages.protein_g * 4 / totalMacroCalories) * 100),
      carbs: Math.round((dailyAverages.carbs_g * 4 / totalMacroCalories) * 100),
      fat: Math.round((dailyAverages.fat_g * 9 / totalMacroCalories) * 100)
    } : { protein: 0, carbs: 0, fat: 0 };

    return {
      planId: mealPlanData.id,
      computedAt: new Date().toISOString(),
      totalMeals: meals.length,
      daysWithMeals,
      
      // Weekly summary
      weekly: {
        totals: weeklyTotals,
        averages: dailyAverages,
        macroPercentages
      },
      
      // Per-day breakdown
      daily: perDayBreakdown,
      
      // Per-meal data
      meals: perMealNutrition
    };
  }

  /**
   * Clean old snapshots for user (keep only latest 3)
   */
  _cleanOldSnapshots(userId) {
    const userSnapshots = Object.keys(this.cache)
      .filter(key => key.startsWith(`${userId}_`));
    
    if (userSnapshots.length > 3) {
      // Sort by computedAt and remove oldest
      const sorted = userSnapshots.sort((a, b) => {
        const dateA = new Date(this.cache[a].computedAt || 0);
        const dateB = new Date(this.cache[b].computedAt || 0);
        return dateB - dateA;
      });
      
      sorted.slice(3).forEach(key => {
        delete this.cache[key];
      });
    }
  }

  /**
   * Clear all cached snapshots
   */
  clearCache() {
    this.cache = {};
    localStorage.removeItem(CACHE_KEY);
    console.log('[NutritionSnapshot] Cache cleared');
  }

  /**
   * Get cache stats for debugging
   */
  getCacheStats() {
    return {
      snapshotCount: Object.keys(this.cache).length,
      cacheVersion: CACHE_VERSION,
      keys: Object.keys(this.cache)
    };
  }
}

// Export singleton instance
export const nutritionSnapshotService = new NutritionSnapshotService();
export default nutritionSnapshotService;
