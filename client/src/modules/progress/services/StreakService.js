/**
 * StreakService - Track weekly plan generation streaks
 * 
 * Rules:
 * - Streak increments when user generates a meal plan
 * - Streak resets if no plan generated in a calendar week
 * - Tracks longest streak for achievements
 */

class StreakServiceClass {
  constructor() {
    this.STORAGE_KEY = 'asr_streak_data';
  }

  /**
   * Get current streak data
   */
  getStreakData() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading streak data:', e);
    }
    
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastPlanDate: null,
      lastPlanWeek: null,
      totalPlansGenerated: 0,
      weeklyPlanHistory: []
    };
  }

  /**
   * Save streak data
   */
  saveStreakData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving streak data:', e);
    }
  }

  /**
   * Get ISO week number for a date
   */
  getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
  }

  /**
   * Record a plan generation and update streak
   * Returns updated streak data and any new achievements
   */
  recordPlanGeneration(userId) {
    const data = this.getStreakData();
    const now = new Date();
    const currentWeek = this.getWeekNumber(now);
    
    // Track total plans
    data.totalPlansGenerated++;
    
    // Check if this is a new week
    if (data.lastPlanWeek !== currentWeek) {
      // Check if streak should continue or reset
      const lastWeekDate = data.lastPlanDate ? new Date(data.lastPlanDate) : null;
      
      if (lastWeekDate) {
        const lastWeek = this.getWeekNumber(lastWeekDate);
        const weeksDiff = this.getWeeksDifference(lastWeek, currentWeek);
        
        if (weeksDiff === 1) {
          // Consecutive week - increment streak
          data.currentStreak++;
        } else if (weeksDiff > 1) {
          // Missed weeks - reset streak
          data.currentStreak = 1;
        }
        // weeksDiff === 0 means same week, already counted
      } else {
        // First plan ever
        data.currentStreak = 1;
      }
      
      // Update longest streak
      if (data.currentStreak > data.longestStreak) {
        data.longestStreak = data.currentStreak;
      }
      
      // Record this week
      data.lastPlanWeek = currentWeek;
      
      // Add to history (keep last 52 weeks)
      data.weeklyPlanHistory.push({
        week: currentWeek,
        date: now.toISOString(),
        userId
      });
      if (data.weeklyPlanHistory.length > 52) {
        data.weeklyPlanHistory.shift();
      }
    }
    
    data.lastPlanDate = now.toISOString();
    this.saveStreakData(data);
    
    // Check for achievements
    const achievements = this.checkStreakAchievements(data);
    
    return {
      streakData: data,
      achievements
    };
  }

  /**
   * Calculate weeks difference between two ISO week strings
   */
  getWeeksDifference(week1, week2) {
    const [year1, w1] = week1.split('-W').map(Number);
    const [year2, w2] = week2.split('-W').map(Number);
    
    // Rough calculation (doesn't account for year boundaries perfectly)
    return (year2 - year1) * 52 + (w2 - w1);
  }

  /**
   * Check for streak-based achievements
   */
  checkStreakAchievements(data) {
    const achievements = [];
    
    // Streak milestones
    const streakMilestones = [
      { streak: 1, id: 'FIRST_PLAN', name: 'First Steps', icon: '🎯' },
      { streak: 2, id: 'TWO_WEEK_STREAK', name: 'Getting Started', icon: '🌱' },
      { streak: 4, id: 'MONTH_STREAK', name: 'Monthly Planner', icon: '📅' },
      { streak: 8, id: 'TWO_MONTH_STREAK', name: 'Dedicated', icon: '💪' },
      { streak: 12, id: 'QUARTER_STREAK', name: 'Quarterly Champion', icon: '🏆' },
      { streak: 26, id: 'HALF_YEAR_STREAK', name: 'Half-Year Hero', icon: '⭐' },
      { streak: 52, id: 'YEAR_STREAK', name: 'Year of Meals', icon: '👑' }
    ];
    
    for (const milestone of streakMilestones) {
      if (data.currentStreak === milestone.streak) {
        achievements.push({
          type: 'streak',
          ...milestone,
          message: `${milestone.streak} week streak!`
        });
      }
    }
    
    // Total plans milestones
    const planMilestones = [
      { count: 5, id: 'FIVE_PLANS', name: 'Regular Planner', icon: '📝' },
      { count: 10, id: 'TEN_PLANS', name: 'Planning Pro', icon: '📊' },
      { count: 25, id: 'TWENTYFIVE_PLANS', name: 'Meal Master', icon: '🎖️' },
      { count: 50, id: 'FIFTY_PLANS', name: 'Planning Expert', icon: '🥇' },
      { count: 100, id: 'HUNDRED_PLANS', name: 'Centurion', icon: '💯' }
    ];
    
    for (const milestone of planMilestones) {
      if (data.totalPlansGenerated === milestone.count) {
        achievements.push({
          type: 'total_plans',
          ...milestone,
          message: `${milestone.count} plans generated!`
        });
      }
    }
    
    return achievements;
  }

  /**
   * Get streak display info
   */
  getStreakDisplay() {
    const data = this.getStreakData();
    const now = new Date();
    const currentWeek = this.getWeekNumber(now);
    
    // Check if streak is still active (generated this week or last week)
    let isActive = false;
    if (data.lastPlanWeek) {
      const weeksDiff = this.getWeeksDifference(data.lastPlanWeek, currentWeek);
      isActive = weeksDiff <= 1;
    }
    
    return {
      currentStreak: isActive ? data.currentStreak : 0,
      longestStreak: data.longestStreak,
      totalPlans: data.totalPlansGenerated,
      isActive,
      lastPlanDate: data.lastPlanDate,
      needsPlanThisWeek: !data.lastPlanWeek || data.lastPlanWeek !== currentWeek
    };
  }
}

export const StreakService = new StreakServiceClass();
