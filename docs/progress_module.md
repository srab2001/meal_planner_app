# Progress Module Documentation

## Overview

The Progress module provides gamification and engagement features for the ASR Health Portal, including:

- **Streak Tracking**: Track weekly plan generation consistency
- **Achievement Badges**: Unlock badges for various accomplishments
- **Referral System**: Refer friends and earn rewards

## Architecture

```
modules/progress/
├── index.js                    # Module exports
├── ProgressApp.js              # Main component
├── services/
│   ├── StreakService.js        # Streak tracking logic
│   ├── BadgeService.js         # Badge definitions and awarding
│   └── ReferralService.js      # Referral code management
└── styles/
    └── ProgressApp.css         # Module styles
```

## Components

### ProgressApp

Main container component with three views:
- **Overview**: Summary of streaks, badges, and referrals
- **Badges**: Full badge collection view
- **Referrals**: Referral code sharing and redemption

**Props:**
- `user` - Current authenticated user
- `onBack` - Callback to return to switchboard
- `onLogout` - Callback to logout user

## Services

### StreakService

Tracks weekly plan generation consistency.

```javascript
import { StreakService } from './modules/progress';

// Record a plan generation
StreakService.recordPlanGeneration(userId);

// Get current streak data
const streakData = StreakService.getStreakData(userId);
// Returns: { currentStreak, longestStreak, totalPlans, lastPlanDate, weekStart }
```

**Key Features:**
- Week-based tracking (Monday start)
- Only one plan per week counts toward streak
- Automatic streak reset if week is missed
- LocalStorage persistence

### BadgeService

Manages achievement badge definitions and awards.

```javascript
import { BadgeService } from './modules/progress';

// Get all badge definitions
const badges = BadgeService.getAllBadges();

// Get user's earned badges
const userBadges = BadgeService.getUserBadges(userId);

// Check and award badges based on user data
BadgeService.checkAndAwardBadges(userId, userData);
```

**Badge Categories:**

| Category | Badges |
|----------|--------|
| Engagement | FIRST_STEPS, STREAK_STARTER, STREAK_MASTER, STREAK_LEGEND |
| Community | SOCIAL_BUTTERFLY, REFERRAL_PRO, COMMUNITY_CHAMPION |
| Planning | RECIPE_MASTER, MEAL_EXPLORER, BUDGET_BOSS |
| Nutrition | NUTRITION_NOVICE, NUTRITION_EXPERT |
| Milestones | EARLY_ADOPTER, YEAR_ONE, DEDICATED_CHEF |

**Badge Tiers:**
- 🥉 Bronze - Basic achievements
- 🥈 Silver - Intermediate achievements
- 🥇 Gold - Advanced achievements
- 💎 Platinum - Elite achievements

### ReferralService

Manages referral code generation and redemption.

```javascript
import { ReferralService } from './modules/progress';

// Generate a referral code for user
const code = ReferralService.generateReferralCode(userId, userName);

// Redeem a referral code
const result = ReferralService.redeemReferral(newUserId, code);
// Returns: { success, error?, referrerId?, reward? }

// Get user's referral statistics
const stats = ReferralService.getReferralStats(userId);
// Returns: { code, referrals[], timesUsed, remainingUses, totalRewards }
```

## Anti-Abuse Measures

### Self-Referral Prevention
- Users cannot redeem their own referral code
- System checks userId against referral code owner

### Redemption Limits
- Maximum 10 redemptions per referral code
- Prevents unlimited reward farming

### One-Time Referral
- Each user can only be referred once
- Subsequent redemption attempts are rejected

### Rate Limiting (Ready for Backend)
- Structure supports rate limiting implementation
- Can track redemptions per time period

## Data Storage

Currently uses localStorage for persistence:

```javascript
// Streak data
localStorage.getItem('asr_streak_data_{userId}')

// Badge data
localStorage.getItem('asr_user_badges_{userId}')

// Referral data
localStorage.getItem('asr_referral_data_{userId}')
localStorage.getItem('asr_referral_codes') // All codes index
```

## Integration with Other Modules

### Meal Planner Integration
- Badge awards trigger on plan generation
- Streak updates on weekly plan creation

### Coaching Integration
- Program completion triggers badge checks
- Coaching streaks tracked separately (future)

## Styling

Uses ASR Design System tokens:
- `--asr-purple-*` for primary elements
- `--asr-orange-*` for streak accents
- `--asr-gray-*` for neutral elements

Special colors:
- Streak card: Orange gradient (#ff6b35 → #f7931e)
- Success states: Green (#166534)
- Warning states: Yellow (#92400e)

## Future Enhancements

1. **Backend Persistence** - Migrate from localStorage to database
2. **Real Rewards** - Connect badges/referrals to actual perks
3. **Leaderboards** - Community streak competitions
4. **Custom Badges** - Admin-created special badges
5. **Push Notifications** - Streak reminders

## Testing

```bash
# Run progress module tests
npm test -- --testPathPattern=progress

# Test specific service
npm test -- StreakService.test.js
```

## Changelog

### v1.0.0 (Current)
- Initial release
- Streak tracking with week-based validation
- 15 achievement badges across 5 categories
- Referral system with anti-abuse measures
- Full UI with three views
