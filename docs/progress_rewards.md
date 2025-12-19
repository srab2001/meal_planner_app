# Progress & Rewards Module Documentation

## Overview

The Progress & Rewards module gamifies the meal planning experience by tracking user activity, rewarding consistency, and enabling friend referrals. It consists of three main features: Weekly Streaks, Achievement Badges, and Referral Codes.

---

## Architecture

### File Structure

```
modules/progress/
├── ProgressApp.js              # Main UI component (510 lines)
├── styles/
│   └── ProgressApp.css         # ASR-themed styling (800+ lines)
└── services/
    ├── StreakService.js        # Weekly streak tracking (213 lines)
    ├── BadgeService.js         # Achievement badges (309 lines)
    └── ReferralService.js      # Referral system (335 lines)
```

### Component Hierarchy

```
ProgressApp
├── Header (title, back navigation)
├── Navigation (Overview | Badges | Referrals tabs)
├── Content Area
│   ├── OverviewView
│   │   ├── Streak Section (current/longest streak)
│   │   ├── Recent Badges
│   │   └── Quick Stats
│   ├── BadgesView
│   │   ├── Category Tabs
│   │   └── Badge Grid (earned/locked)
│   └── ReferralsView
│       ├── Your Code Section
│       ├── Apply Code Section (with tooltips)
│       ├── Stats (successful referrals)
│       └── Referral Rules
└── Footer
```

---

## Feature 1: Weekly Streaks

### How It Works

1. **Week Detection**: Uses ISO week number (Monday-Sunday)
2. **Increment Logic**: Streak increases when user generates a meal plan in a new week
3. **Streak Reset**: If user misses a week, streak resets to 0
4. **Protection**: Multiple plan generations in same week only count once

### StreakService API

```javascript
import StreakService from './services/StreakService';

// Record that user generated a plan
const result = StreakService.recordPlanGeneration(userId);
// Returns: { currentStreak, longestStreak, lastPlanDate, weekStreakUpdated }

// Get streak data
const streak = StreakService.getStreak(userId);
// Returns: { currentStreak, longestStreak, lastPlanDate, lastPlanWeek }

// Check status
const status = StreakService.getStreakStatus(userId);
// Returns: { streak, isAtRisk, message }
```

### Week Number Calculation

```javascript
getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
```

### Storage

- Key: `meal_planner_streak_{userId}`
- Format: JSON with `currentStreak`, `longestStreak`, `lastPlanDate`, `lastPlanWeek`

---

## Feature 2: Achievement Badges

### Badge Categories

| Category | Examples | Criteria |
|----------|----------|----------|
| streak | 🔥 First Flame, 🔥 On Fire | Complete 1, 4, 12, 26, 52 week streaks |
| plans | 📋 Plan Maker, 📋 Menu Master | Generate 1, 10, 50, 100, 500 plans |
| referral | 🤝 First Friend, 🤝 Influencer | Refer 1, 5, 10, 25 friends |
| engagement | ⭐ Early Bird, ⭐ Night Owl | Various engagement milestones |
| special | 🏆 Founding Member, 🎂 Anniversary | Time-based achievements |

### Badge Definition Structure

```javascript
const BADGE_DEFINITIONS = {
  first_flame: {
    id: 'first_flame',
    name: 'First Flame',
    description: 'Complete your first weekly streak',
    icon: '🔥',
    category: 'streak',
    rarity: 'common',
    requirement: { type: 'streak', value: 1 },
    borderColor: '#f97316'
  }
};
```

### Rarity Levels

| Rarity | Border Color | % of Users |
|--------|-------------|------------|
| common | `#22c55e` (green) | 50%+ |
| uncommon | `#3b82f6` (blue) | 20-50% |
| rare | `#8b5cf6` (purple) | 5-20% |
| epic | `#f97316` (orange) | 1-5% |
| legendary | `#eab308` (gold) | <1% |

### BadgeService API

```javascript
import BadgeService from './services/BadgeService';

// Get all badges for user
const badges = BadgeService.getAllBadges(userId);

// Get badges by category
const streakBadges = BadgeService.getBadgesByCategory(userId, 'streak');

// Check and award new badges
const newBadges = BadgeService.checkAndAwardBadges(userId, userStats);

// Get badge by ID
const badge = BadgeService.getBadgeById('first_flame');
```

---

## Feature 3: Referral Codes

### Security Features

1. **Anti-Self-Referral**: Codes contain hashed user ID; applying own code is blocked
2. **One-Time Redemption**: User can only apply ONE referral code ever
3. **Referral Limit**: Maximum 20 successful referrals per user
4. **Case-Insensitive**: Codes converted to uppercase before validation

### Code Format

```
ASR + [4 random chars] + [4 char user hash]
Example: ASRX7K91234
```

### Validation Flow

```
1. User enters code
2. Extract code hash (last 4 chars)
3. Hash current user ID
4. Compare hashes → Block if same (self-referral)
5. Check if user was already referred → Block if true
6. Check referrer's limit → Block if ≥ 20
7. Apply code → Give discount
```

### ReferralService API

```javascript
import ReferralService from './services/ReferralService';

// Generate user's referral code
const code = ReferralService.generateReferralCode(userId);
// Returns: "ASRX7K91234"

// Apply a referral code
const result = await ReferralService.applyReferralCode(userId, 'ASRX7K91234');
// Returns: { success, message, error, referrerId }

// Get referral statistics
const stats = ReferralService.getReferralStats(userId);
// Returns: { code, successfulReferrals, wasReferred, referredBy, rewards }

// Share via native share API
await ReferralService.shareReferralCode(userId);
```

### Error Codes

| Code | Message | Cause |
|------|---------|-------|
| INVALID_CODE | Invalid referral code format | Code not 12 chars or missing ASR prefix |
| SELF_REFERRAL | Cannot use your own referral code | User hash matches code hash |
| ALREADY_REFERRED | You have already used a referral code | User previously applied a code |
| USER_NOT_FOUND | Referrer not found | Code doesn't match any user |
| LIMIT_REACHED | Referrer has reached their limit | Referrer has 20 referrals |

---

## UI Components

### OverviewView

Displays at-a-glance progress:
- Current streak with flame animation
- Longest streak record
- Last plan generation date
- Recently earned badges (up to 3)
- Quick stats summary

### BadgesView

Badge collection interface:
- Category filter tabs (All, Streak, Plans, Referral, Engagement, Special)
- Grid layout of badge cards
- Earned badges show border color and date
- Locked badges show grayed out with "?" icon
- Badge count per category

### ReferralsView

Referral management:
- Display user's unique referral code
- Copy to clipboard button
- Native share integration
- Apply friend's code input with hover tooltips
- Success/error messaging
- Referral statistics
- Rules explanation

---

## Hover Tooltips

Input fields have `title` attributes for hover help:

| Element | Tooltip Text |
|---------|--------------|
| Code Input | "Enter a referral code from a friend. Format: ASR followed by 8 characters..." |
| Apply Button | "Click to apply the referral code. This action cannot be undone..." |
| Help Text | "Referral codes are unique 12-character codes that start with 'ASR'..." |

---

## CSS Theme Integration

The module uses ASR theme CSS variables:

```css
/* Primary Colors */
--asr-purple-50 through --asr-purple-900
--asr-gray-50 through --asr-gray-900

/* Accent Colors */
--asr-orange-500  /* Streak flames */
--asr-red-500     /* Error states */

/* Typography */
Font sizes: 12px (small), 14px (body), 16px (emphasis), 20px (h2), 24px (h1)
```

---

## Storage Keys

| Key Pattern | Data |
|-------------|------|
| `meal_planner_streak_{userId}` | Streak data |
| `meal_planner_badges_{userId}` | Earned badges |
| `meal_planner_referral_{userId}` | Referral code and stats |
| `meal_planner_referred_by_{userId}` | Who referred this user |

---

## Integration Points

### With MealPlanService

```javascript
// When generating a new meal plan
const plan = await MealPlanService.generatePlan(userId, options);
if (plan.success) {
  StreakService.recordPlanGeneration(userId);
  BadgeService.checkAndAwardBadges(userId, { plansGenerated: stats.total });
}
```

### With SubscriptionService

```javascript
// When referral code is applied
const result = await ReferralService.applyReferralCode(userId, code);
if (result.success) {
  SubscriptionService.applyDiscount(userId, 10); // 10% discount
}
```

---

## Testing Checklist

See `docs/phase_rewards_runbook.md` for complete testing procedures.

Quick verification:
1. ✅ Generate plan → streak increments (once per week)
2. ✅ Generate second plan same week → streak unchanged
3. ✅ View badges → categories filter correctly
4. ✅ Copy referral code → clipboard updated
5. ✅ Apply own code → "Cannot use your own code" error
6. ✅ Apply valid code → success message, discount applied
7. ✅ Apply code again → "Already used a code" error

---

## Future Enhancements

1. **Push Notifications**: Remind users if streak at risk (Friday/Saturday)
2. **Leaderboards**: Weekly/monthly top streakers
3. **Badge Showcase**: Profile page to display favorite badges
4. **Referral Tiers**: Bronze/Silver/Gold referrer status
5. **Streak Recovery**: One "freeze" token per month
