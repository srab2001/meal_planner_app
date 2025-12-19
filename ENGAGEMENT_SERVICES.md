# Engagement Services Documentation

## Overview

The Engagement Services module provides gamification and user engagement features for all ASR Health Portal apps. It includes:

- **Notifications** - Toast notifications, alerts, in-app messaging
- **Achievements** - Badges, milestones, and gamification rewards
- **Streaks** - Daily activity tracking
- **Feedback** - User ratings, NPS scores, and feedback collection

All services use ASR theme colors for consistent styling.

## Architecture

```
client/src/shared/
├── services/engagement/
│   ├── index.js              # Main exports
│   ├── NotificationService.js # Toast notifications
│   ├── AchievementService.js  # Achievement/badge tracking
│   ├── StreakService.js       # Activity streak tracking
│   └── FeedbackService.js     # User feedback collection
├── hooks/
│   ├── index.js              # Hook exports
│   ├── useNotification.js    # React hook for notifications
│   ├── useAchievements.js    # React hook for achievements
│   ├── useStreak.js          # React hook for streaks
│   └── useFeedback.js        # React hook for feedback
├── components/
│   ├── index.js              # Component exports
│   ├── ToastContainer.js/css # Toast notification UI
│   ├── AchievementPopup.js/css # Achievement unlock popup
│   ├── StreakBanner.js/css   # Streak display banner
│   └── FeedbackModal.js/css  # Feedback collection modal
└── context/
    ├── index.js              # Context exports
    └── EngagementContext.js  # Provider and useEngagement hook
```

## Quick Start

### 1. Wrap Your App with EngagementProvider

```jsx
// App.js
import { EngagementProvider } from './shared/context/EngagementContext';

function App() {
  return (
    <EngagementProvider toastPosition="top-right">
      <div className="App">
        {/* Your app content */}
      </div>
    </EngagementProvider>
  );
}
```

### 2. Use the Engagement Hook

```jsx
// AnyComponent.js
import { useEngagement } from '../shared/context/EngagementContext';

function AnyComponent() {
  const { 
    showSuccess, 
    showError, 
    achievements,
    streak 
  } = useEngagement();

  const handleSave = async () => {
    try {
      await saveData();
      showSuccess('Data saved successfully!');
      achievements.checkAndUnlock('FIRST_SAVE', true);
    } catch (error) {
      showError('Failed to save: ' + error.message);
    }
  };

  return (
    <div>
      <p>Current Streak: {streak.currentStreak} days</p>
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
```

## Services Documentation

### NotificationService

Show toast notifications to users.

```javascript
import { NotificationService } from '../shared/services/engagement';

// Show different notification types
NotificationService.success('Operation completed!');
NotificationService.error('Something went wrong');
NotificationService.warning('Please check your input');
NotificationService.info('Did you know...');

// Custom notification
NotificationService.show('Custom message', {
  type: 'success',
  icon: '🎉',
  duration: 5000,
  persistent: false
});
```

**Hook Usage:**
```jsx
import { useNotification } from '../shared/hooks';

function MyComponent() {
  const { showSuccess, showError, notifications, clear } = useNotification();
  // ...
}
```

### AchievementService

Track and unlock user achievements.

```javascript
import { AchievementService, ACHIEVEMENT_DEFINITIONS } from '../shared/services/engagement';

// Check if unlocked
const isUnlocked = AchievementService.isUnlocked('FIRST_MEAL_PLAN');

// Unlock an achievement
const achievement = AchievementService.unlock('FIRST_MEAL_PLAN');

// Conditional unlock
AchievementService.checkAndUnlock('RECIPE_COLLECTOR', favoritesCount >= 10);

// Get stats
const stats = AchievementService.getStats();
// { total: 13, unlocked: 2, totalPoints: 35, ... }

// Get achievements by category
const mealAchievements = AchievementService.getByCategory('meal_planning');
```

**Available Achievements:**
| ID | Title | Description | Points |
|----|-------|-------------|--------|
| FIRST_MEAL_PLAN | First Steps | Created your first meal plan | 10 |
| WEEK_PLANNER | Week Planner | Planned a full week of meals | 25 |
| RECIPE_COLLECTOR | Recipe Collector | Saved 10 favorite recipes | 20 |
| RECIPE_MASTER | Recipe Master | Saved 50 favorite recipes | 50 |
| CALORIE_TRACKER | Calorie Tracker | Viewed your nutrition dashboard | 10 |
| BALANCED_DIET | Balanced Diet | Hit your macro targets for a day | 30 |
| STREAK_3 | Getting Started | Maintained a 3-day streak | 15 |
| STREAK_7 | Week Warrior | Maintained a 7-day streak | 35 |
| STREAK_30 | Monthly Master | Maintained a 30-day streak | 100 |
| FEEDBACK_GIVER | Feedback Giver | Submitted your first feedback | 10 |
| EXPLORER | Explorer | Used all app features | 50 |

**Hook Usage:**
```jsx
import { useAchievements } from '../shared/hooks';

function MyComponent() {
  const { 
    unlocked, 
    stats, 
    newAchievement, 
    unlock, 
    checkAndUnlock 
  } = useAchievements();
  // ...
}
```

### StreakService

Track daily user activity streaks.

```javascript
import { StreakService, STREAK_MILESTONES } from '../shared/services/engagement';

// Record today's activity
const result = StreakService.recordActivity();
// { streakMaintained: true, currentStreak: 5, isNewMilestone: false }

// Get current streak
const currentStreak = StreakService.getCurrentStreak();

// Get full stats
const stats = StreakService.getStats();
// { currentStreak: 5, longestStreak: 12, totalActiveDays: 45, ... }

// Get display info
const displayInfo = StreakService.getDisplayInfo();
// { streak: 5, icon: '🔥', color: 'var(--asr-orange-500)', title: 'Getting Started' }
```

**Streak Milestones:**
| Days | Title | Icon |
|------|-------|------|
| 3 | Getting Started | 🔥 |
| 7 | Week Warrior | 🔥 |
| 14 | Two Week Champion | 🔥 |
| 30 | Monthly Master | 👑 |
| 60 | Dedication Pro | 💎 |
| 90 | Quarter Legend | 🏆 |
| 180 | Half Year Hero | ⭐ |
| 365 | Year Champion | 🌟 |

**Hook Usage:**
```jsx
import { useStreak } from '../shared/hooks';

function MyComponent() {
  const { 
    currentStreak, 
    longestStreak, 
    recordActivity, 
    displayInfo 
  } = useStreak();
  // ...
}
```

### FeedbackService

Collect user feedback, ratings, and NPS scores.

```javascript
import { FeedbackService, RATING_SCALE, NPS_CATEGORIES } from '../shared/services/engagement';

// Submit rating (1-5)
FeedbackService.submitRating(5, 'Great app!', { screen: 'meal-plan' });

// Submit NPS (0-10)
FeedbackService.submitNPS(9, 'Love the meal planning feature');

// Submit feature request
FeedbackService.submitFeatureRequest(
  'Dark Mode',
  'Please add a dark mode option',
  'high'
);

// Submit bug report
FeedbackService.submitBugReport(
  'Button not working',
  'The save button does not respond on iOS',
  'medium'
);

// Check if should prompt for feedback
const { shouldPrompt, reason } = FeedbackService.shouldPromptForFeedback();
```

**Hook Usage:**
```jsx
import { useFeedback } from '../shared/hooks';

function MyComponent() {
  const { 
    submitRating, 
    submitNPS, 
    shouldPrompt, 
    ratingScale 
  } = useFeedback();
  // ...
}
```

## UI Components

### ToastContainer

Automatically rendered by EngagementProvider. Displays toast notifications.

```jsx
// Already included by EngagementProvider, but can be used standalone:
import { ToastContainer } from '../shared/components';

<ToastContainer position="top-right" maxToasts={5} />
```

**Positions:** `top-right`, `top-left`, `bottom-right`, `bottom-left`, `top-center`, `bottom-center`

### AchievementPopup

Automatically rendered by EngagementProvider. Shows when an achievement is unlocked.

```jsx
// Already included by EngagementProvider, but can be used standalone:
import { AchievementPopup } from '../shared/components';

<AchievementPopup autoHide={true} duration={5000} />
```

### StreakBanner

Display the user's current streak.

```jsx
import { StreakBanner } from '../shared/components';

// Full banner
<StreakBanner showProgress={true} />

// Compact version
<StreakBanner compact={true} />
```

### FeedbackModal

Modal for collecting feedback.

```jsx
import { FeedbackModal } from '../shared/components';

const [showFeedback, setShowFeedback] = useState(false);

<FeedbackModal 
  isOpen={showFeedback}
  onClose={() => setShowFeedback(false)}
  type="rating" // 'rating', 'nps', or 'general'
  title="How was your experience?"
  context={{ screen: 'meal-plan' }}
/>
```

## ASR Theme Integration

All engagement components use ASR theme CSS variables:

```css
/* Primary colors */
--asr-purple-500: #8b5cf6;
--asr-purple-600: #7c3aed;

/* Secondary colors */
--asr-red-500: #ef4444;
--asr-red-600: #dc2626;

/* Accent colors */
--asr-orange-500: #f97316;
--asr-orange-600: #ea580c;

/* Neutral colors */
--asr-gray-800: #1f2937;
--asr-gray-900: #111827;
```

See `ASR_THEME_GUIDE.md` for complete color reference.

## Storage

Engagement data is stored in localStorage:

- `asr_achievements` - Achievement unlock state and progress
- `asr_streaks` - Streak data and activity history
- `asr_feedback` - Feedback submissions
- `asr_feedback_settings` - Feedback prompt settings
- `asr_notifications` - Notification queue (temporary)

## Future Enhancements

1. **Backend Sync** - Sync engagement data with server for cross-device persistence
2. **Leaderboards** - Compare achievements with other users
3. **Custom Achievements** - App-specific achievement definitions
4. **Push Notifications** - Server-sent engagement notifications
5. **Analytics Integration** - Track engagement metrics

## Integration Checklist

- [x] EngagementProvider wraps App.js
- [x] MealPlanView uses useEngagement hook
- [x] First meal plan achievement trigger
- [x] Recipe favorite achievement triggers
- [x] Toast notifications for key actions
- [ ] Feedback prompt on logout (future)
- [ ] Streak display on dashboard (future)
- [ ] Achievement gallery view (future)
