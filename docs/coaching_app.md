# Coaching App Module Documentation

## Overview

The Coaching App provides AI-powered health coaching through the ASR Health Portal. It combines ChatGPT integration, structured programs, goal management, and habit tracking to help users achieve their wellness objectives.

---

## Architecture

### File Structure

```
modules/coaching/
├── CoachingApp.js              # Main component (350 lines)
├── index.js                    # Module exports
├── components/
│   ├── CoachingDashboard.js    # Health score and overview
│   ├── CoachingChat.js         # AI chat interface (567 lines)
│   ├── Programs.js             # Program browser and tracker
│   ├── GoalManager.js          # SMART goal management
│   └── HabitTracker.js         # Daily habit tracking
├── services/
│   ├── index.js                # Service exports
│   ├── ChatGPTService.js       # OpenAI API integration
│   ├── ChatHistoryService.js   # Message persistence
│   ├── CoachingAuditService.js # Specialized audit logging
│   └── ProgramTemplates.js     # Program definitions
├── styles/
│   ├── CoachingApp.css
│   ├── CoachingChat.css
│   └── Programs.css
└── __tests__/
    ├── sanity.test.js
    └── integration.test.js
```

### Component Hierarchy

```
CoachingApp
├── Header (back, title, user info, logout)
├── Navigation Tabs
│   ├── Dashboard
│   ├── AI Coach
│   ├── Programs
│   ├── Goals
│   └── Habits
└── Content Area
    ├── CoachingDashboard
    │   ├── Health Score Card
    │   ├── Quick Stats
    │   └── Recent Activity
    ├── CoachingChat
    │   ├── Message History
    │   ├── Suggested Prompts
    │   └── Input Area
    ├── Programs
    │   ├── Category Tabs
    │   ├── Program Cards
    │   └── Module Viewer
    ├── GoalManager
    │   └── SMART Goal Cards
    └── HabitTracker
        └── Daily Habit Checklist
```

---

## Features

### 1. AI Chat (ChatGPT Integration)

The chat interface connects to OpenAI's ChatGPT API with:

**Context Injection:**
- Current meal plan summary
- Nutrition data
- Health score
- Active program progress

**Guardrails:**
- Medical condition detection
- Treatment request blocking
- Safety response generation
- Audit logging of triggers

**Chat History:**
- Per-user persistence
- Last 200 messages stored
- 90-day retention
- Export/import capability

### 2. Coaching Programs

Three main program categories:

| Program | Duration | Focus |
|---------|----------|-------|
| General Wellness Foundations | 4 weeks | Overall health basics |
| Sustainable Weight Management | 6 weeks | Healthy weight loss |
| Heart-Friendly Eating | 4 weeks | Cardiovascular health |

Each program includes:
- Structured modules (6-12 per program)
- Learning content with markdown
- Action items per module
- Progress tracking
- Completion certificates

### 3. Goal Management

SMART goal framework:
- **S**pecific - Clear objectives
- **M**easurable - Trackable metrics
- **A**chievable - Realistic targets
- **R**elevant - Personal connection
- **T**ime-bound - Deadlines

### 4. Habit Tracking

Daily habit checklist with:
- Custom habit creation
- Streak tracking
- Completion history
- Visual progress indicators

---

## Services

### ChatGPTService

```javascript
import { chatGPTService } from './services';

// Send message with context
const result = await chatGPTService.sendMessage(
  "Help me plan healthier dinners",
  {
    mealPlan: currentMealPlan,
    nutritionSummary: weeklyNutrition,
    healthScore: 75
  }
);

// Result: { success: true, response: "...", usage: {...} }
```

**Configuration:**
- Model: gpt-4o-mini
- Max tokens: 1000
- Temperature: 0.7
- Timeout: 30 seconds

### ChatHistoryService

```javascript
import { chatHistoryService } from './services';

// Initialize for user
chatHistoryService.initialize(userId);

// Add message
chatHistoryService.addMessage({
  role: 'user',
  content: 'How can I eat more vegetables?'
});

// Get recent messages
const messages = chatHistoryService.getRecentMessages(50);

// Get statistics
const stats = chatHistoryService.getStatistics();
```

### CoachingAuditService

```javascript
import { coachingAuditService } from './services';

// Start session
coachingAuditService.startSession(user);

// Log events
coachingAuditService.logChatMessageSent({ message, hasContext: true });
coachingAuditService.logGuardrailTriggered({ reason: 'medical_request' });
coachingAuditService.logProgramEnrolled({ programId, programName });

// End session
coachingAuditService.endSession();

// Generate report
const report = coachingAuditService.getAuditReport(startDate, endDate);
```

### ProgramTemplates

```javascript
import { 
  getAllPrograms, 
  getProgramById, 
  initializeUserPrograms 
} from './services';

// Get all templates
const programs = getAllPrograms();

// Get specific program
const weightProgram = getProgramById('weight-management');

// Initialize for new user
const userPrograms = initializeUserPrograms();
```

---

## Data Flow

### Chat Message Flow

```
User Input
    ↓
[Guardrail Check]
    ↓ (if triggered)
[Safety Response] → Display
    ↓ (if passed)
[Build Context String]
    ↓
[API Call to Backend]
    ↓
[Backend → OpenAI API]
    ↓
[Response Processing]
    ↓
[Audit Logging]
    ↓
[History Update]
    ↓
Display Response
```

### Program Enrollment Flow

```
User clicks "Enroll"
    ↓
[Update program.enrolled = true]
    ↓
[Set program.startedAt]
    ↓
[Audit: program_enrolled]
    ↓
[Save to localStorage]
    ↓
Show Program Details
```

---

## Context Awareness

The AI coach has access to:

1. **Meal Plan Data** (read-only)
   - Current week's meals
   - Recipe names and types
   - Meal schedule

2. **Nutrition Summary** (read-only)
   - Average daily calories
   - Macro breakdown
   - Weekly trends

3. **Health Score**
   - Overall score (0-100)
   - Category breakdown
   - Trend direction

4. **Active Program**
   - Program name
   - Progress percentage
   - Current module

### Context String Example

```
**User Context:**
**Current Meal Plan:** 7-day plan with meals like: Grilled Chicken Salad, Salmon with Quinoa, Mediterranean Bowl, Veggie Stir Fry, Turkey Meatballs...
**Nutrition Summary:** ~1800 cal/day avg, 120g protein, 180g carbs, 60g fat
**Health Score:** 72/100
**Active Program:** Sustainable Weight Management (42% complete)

**User Message:**
I'm struggling to stay motivated this week
```

---

## Storage

### localStorage Keys

| Key | Data |
|-----|------|
| `coaching_chat_history_{userId}` | Chat messages array |
| `coaching_goals` | User's SMART goals |
| `coaching_habits` | Daily habits list |
| `coaching_programs` | Program progress |
| `last_coaching_checkin` | Last app open timestamp |

---

## Theme Integration

Uses ASR theme CSS variables:

```css
/* Primary */
--asr-purple-600: #7c3aed
--asr-purple-500: #8b5cf6

/* Accents */
--asr-orange-500: #f97316
--asr-red-500: #ef4444

/* Backgrounds */
--asr-gray-50 through --asr-gray-900
```

---

## Switchboard Integration

Added to `AppSwitchboard.js`:

```javascript
{
  id: 'coaching',
  name: 'AI Coach',
  description: 'Personalized health coaching and programs',
  icon: '🎯',
  color: 'var(--asr-purple-500)',
  available: true
}
```

---

## Testing

### Unit Tests

```bash
npm test -- --testPathPattern=coaching
```

### Manual Testing Checklist

1. ✅ Chat sends messages and receives responses
2. ✅ Guardrails trigger on medical questions
3. ✅ Context is injected into prompts
4. ✅ Programs display and enroll correctly
5. ✅ Module completion updates progress
6. ✅ Goals can be created and tracked
7. ✅ Habits check off and track streaks
8. ✅ History persists across sessions
9. ✅ Audit logs are generated

---

## API Endpoints

### Backend Routes (for ChatGPT proxy)

```
POST /api/coaching/chat
Body: { messages, config }
Response: { response, usage }

GET /api/coaching/programs
Response: { programs: [...] }

POST /api/coaching/audit
Body: { events: [...] }
Response: { success: true }
```

---

## Security Considerations

1. **API Key Protection**
   - OpenAI key stored server-side only
   - Frontend calls backend proxy

2. **Content Filtering**
   - Medical guardrails before API call
   - Response validation

3. **Rate Limiting**
   - Backend should implement rate limits
   - Consider token budget per user

4. **Data Privacy**
   - Message content logged minimally
   - Export excludes sensitive previews

---

## Future Enhancements

1. **Voice Input** - Speech-to-text for chat
2. **Coach Personas** - Different coaching styles
3. **Progress Photos** - Visual tracking
4. **Social Features** - Share achievements
5. **Calendar Integration** - Sync with meal plans
6. **Push Notifications** - Habit reminders
