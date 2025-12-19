/**
 * Shared Module Index
 * 
 * Central export for all shared utilities, services, hooks, and components.
 * 
 * Usage:
 * import { useEngagement, ToastContainer, NotificationService } from './shared';
 */

// Context
export { EngagementProvider, useEngagement } from './context';

// Hooks
export { 
  useNotification, 
  useAchievements, 
  useStreak, 
  useFeedback 
} from './hooks';

// Components
export { 
  ToastContainer, 
  AchievementPopup, 
  StreakBanner, 
  FeedbackModal 
} from './components';

// Services
export { 
  NotificationService,
  AchievementService,
  StreakService,
  FeedbackService,
  ACHIEVEMENT_DEFINITIONS,
  STREAK_MILESTONES,
  FEEDBACK_TYPES,
  RATING_SCALE,
  NPS_CATEGORIES
} from './services/engagement';

// Utils
export { fetchWithAuth, API_BASE, getToken, setToken, removeToken } from './utils/api';
