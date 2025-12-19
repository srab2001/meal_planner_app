# Coaching Module Documentation

## Overview

The Coaching Module provides AI-powered health coaching through an interactive chat interface. It offers personalized guidance based on user context including meal plans, nutrition data, and health scores.

## Architecture

```
modules/coaching/
├── index.js                 # Module exports
├── CoachingApp.js           # Main routing component
├── components/
│   ├── CoachingChat.js      # AI chat interface
│   ├── CoachingChat.css
│   ├── CoachingDashboard.js # Health score display
│   ├── CoachingDashboard.css
│   ├── GoalManager.js       # SMART goal tracking
│   ├── GoalManager.css
│   ├── HabitTracker.js      # Daily habits
│   ├── HabitTracker.css
│   ├── Programs.js          # Coaching programs
│   └── Programs.css
├── styles/
│   └── CoachingApp.css
└── __tests__/
    ├── sanity.test.js
    └── integration.test.js
```

## Features

### 1. AI Chat Interface

Interactive coaching chat with:
- Context-aware responses
- Meal plan integration
- Health score analysis
- Suggested prompts
- Chat history persistence
- **Medical guardrails** (see `/docs/coaching_guardrails.md`)

### 2. Health Dashboard

Visual health score display:
- Overall health score (0-100)
- Category breakdowns
- Trend indicators
- Improvement suggestions

### 3. Goal Manager

SMART goal tracking:
- **S**pecific goal setting
- **M**easurable progress
- **A**chievable targets
- **R**elevant to user
- **T**ime-bound deadlines

### 4. Habit Tracker

Daily habit monitoring:
- Custom habit creation
- Daily check-ins
- Streak tracking
- Completion rates

### 5. Coaching Programs

Structured wellness programs:
- Beginner-friendly programs
- Progressive difficulty
- Guided journeys
- Completion badges

## Components

### CoachingApp

Main container with navigation between views.

```javascript
import { CoachingApp } from './modules/coaching';

<CoachingApp
  user={user}
  onBack={() => setCurrentView('switchboard')}
  onLogout={handleLogout}
/>
```

**Props:**
- `user` - Current authenticated user object
- `onBack` - Callback to return to switchboard
- `onLogout` - Callback to log out user

### CoachingChat

AI-powered chat interface.

```javascript
<CoachingChat
  user={user}
  healthScore={healthScore}
  mealPlanData={mealPlanData}
  nutritionData={nutritionData}
/>
```

**Features:**
- Context-aware responses using meal plan data
- Local response generation (no API required)
- API fallback for enhanced responses
- Medical guardrails
- Audit logging

### CoachingDashboard

Health score visualization.

```javascript
<CoachingDashboard
  user={user}
  onViewChat={() => setView('chat')}
/>
```

### GoalManager

SMART goal tracking interface.

```javascript
<GoalManager user={user} />
```

### HabitTracker

Daily habit check-in.

```javascript
<HabitTracker user={user} />
```

### Programs

Coaching program enrollment.

```javascript
<Programs user={user} />
```

## Context Integration

### Meal Plan Context

The chat uses meal plan data to provide relevant suggestions:

```javascript
// When user asks to swap a meal
const mealSummary = summarizeMealPlan(mealPlanData);
// Returns: { totalDays, meals, dinners }

// Response includes specific meals from user's plan
"I see you have 5 days planned. Here's a fish swap for your Tuesday dinner..."
```

### Nutrition Context

Nutrition data enhances recommendations:

```javascript
// Chat receives nutrition context
context: {
  hasNutritionData: !!nutritionData,
  // Used for calorie-aware suggestions
}
```

### Health Score Context

Health scores guide coaching tone:

```javascript
// Score >= 80: Celebration and optimization
// Score >= 60: Encouragement and tips
// Score < 60: Gentle guidance and small steps
```

## Audit Logging

All interactions are logged for safety and analytics:

```javascript
import auditLogger from '../../../shared/services/AuditLogger';

// Chat message sent
auditLogger.log({
  category: auditLogger.CATEGORIES.CHAT,
  action: 'message_sent',
  level: auditLogger.LEVELS.INFO,
  details: { messageLength: 42 }
});

// Guardrail triggered
auditLogger.log({
  category: auditLogger.CATEGORIES.SECURITY,
  action: 'guardrail_triggered',
  level: auditLogger.LEVELS.WARNING,
  details: { reason: 'medical_treatment_request' }
});

// Meal swap suggestion
auditLogger.log({
  category: auditLogger.CATEGORIES.CHAT,
  action: 'meal_swap_suggestion',
  level: auditLogger.LEVELS.INFO,
  details: { hasMealPlan: true, requestType: 'fish' }
});
```

## Data Storage

### Chat History
```javascript
localStorage.getItem('coaching_chat_history')
// Array of message objects (last 100)
```

### Goals
```javascript
localStorage.getItem('coaching_goals')
// Array of SMART goal objects
```

### Habits
```javascript
localStorage.getItem('coaching_habits')
// Object with habit definitions and completions
```

### Program Enrollments
```javascript
localStorage.getItem('coaching_programs')
// Array of enrolled program IDs
```

## Medical Guardrails

The coaching module includes safety guardrails to prevent medical advice.

**Blocked:**
- Diagnosis requests ("do I have diabetes?")
- Treatment recommendations ("treat my hypertension")
- Medication advice ("what dosage should I take?")

**Allowed:**
- General wellness tips
- Meal planning help
- Motivation and goal setting
- Healthy lifestyle guidance

See `/docs/coaching_guardrails.md` for full details.

## Suggested Prompts

Default suggestions for users:

1. 🎯 "Help me set a realistic health goal"
2. 🍽️ "How can I improve my eating habits?"
3. 💪 "I need motivation to stay on track"
4. 📊 "Analyze my health score and give tips"
5. 🥗 "Suggest healthy meal ideas"
6. 😴 "Tips for better sleep and recovery"

## API Integration

### Backend Endpoint (Optional)

```javascript
POST /api/coaching/chat
{
  "message": "swap one dinner for fish",
  "context": {
    "healthScore": 72,
    "hasMealPlan": true,
    "hasNutritionData": true,
    "mealPlanSummary": { ... }
  }
}
```

### Response
```json
{
  "response": "Here's a fish-based dinner swap...",
  "guardrailTriggered": false
}
```

## Testing

```bash
# Run coaching module tests
node client/src/modules/coaching/__tests__/sanity.test.js
node client/src/modules/coaching/__tests__/integration.test.js
```

### Test Scenarios

1. **Meal Swap Request**
   - Input: "Swap one dinner for fish"
   - Expected: Returns fish recipe suggestion

2. **Guardrail Test**
   - Input: "Treat my diabetes with diet"
   - Expected: Returns safety response, logs warning

3. **Health Score Analysis**
   - Input: "Analyze my health score"
   - Expected: Score-appropriate response

## Changelog

### v1.1.0 (Current)
- Added medical guardrails
- Enhanced meal plan context
- Meal swap suggestions
- Audit logging for all interactions

### v1.0.0
- Initial release
- Chat interface
- Health dashboard
- Goal manager
- Habit tracker
- Programs
