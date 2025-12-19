/**
 * Engagement Services - Main Entry Point
 * 
 * Provides engagement features for all ASR Health Portal apps:
 * - Notifications (toasts, alerts, in-app messages)
 * - Achievements (badges, milestones)
 * - Streaks (daily activity tracking)
 * - Feedback (ratings, NPS, comments)
 * 
 * Usage:
 * import { NotificationService, useNotification } from '../shared/services/engagement';
 * OR
 * import { useNotification } from '../shared/hooks';
 */

// Services (singleton instances)
export { default as NotificationService } from './NotificationService';
export { default as AchievementService, ACHIEVEMENT_DEFINITIONS } from './AchievementService';
export { default as StreakService, STREAK_MILESTONES } from './StreakService';
export { default as FeedbackService, FEEDBACK_TYPES, RATING_SCALE, NPS_CATEGORIES } from './FeedbackService';

// Re-export hooks from hooks directory for convenience
export { 
  useNotification, 
  useAchievements, 
  useStreak, 
  useFeedback 
} from '../../hooks';
