# Coaching App - Architecture Design

## Overview

The **Coaching App** is a new standalone application within the ASR Health Portal ecosystem. It provides personalized health coaching by analyzing data from both the Meal Plan and Nutrition modules, offering AI-powered recommendations, goal tracking, habit formation, and progress insights.

**Key Differentiator:** Unlike Meal Plan (planning) and Nutrition (tracking), Coaching is about **analysis, recommendations, and behavior change**.

---

## Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Data Consumer** | READS from Meal Plan + Nutrition; owns no meal/food data |
| **AI-Powered Insights** | Uses aggregated data to generate personalized recommendations |
| **Goal-Oriented** | Focuses on long-term health outcomes, not daily logging |
| **Separation of Concerns** | Own module folder, isolated state, dedicated routes |
| **Shared Infrastructure** | Reuse auth, theme, engagement services from shared/ |

---

## App Identity

```javascript
// AppSwitchboard entry
{
  id: 'coaching',
  name: 'Coach',
  description: 'AI-powered health coaching and personalized recommendations',
  icon: '🎯',
  color: 'var(--asr-purple-500)',
  available: true
}
```

---

## Core Features

### 1. Health Dashboard
- **Unified View**: Aggregates Meal Plan adherence + Nutrition tracking
- **Health Score**: Single 0-100 metric based on multiple factors
- **Trend Indicators**: Up/down arrows showing weekly direction

### 2. AI Coach
- **Daily Check-ins**: "How are you feeling today?"
- **Smart Recommendations**: Based on gaps in nutrition/meal plan
- **Motivational Messages**: Contextual encouragement
- **Weekly Summaries**: AI-generated progress reports

### 3. Goal Management
- **Multi-dimensional Goals**: Weight, nutrition, habits, fitness
- **SMART Goal Framework**: Specific, Measurable, Achievable, Relevant, Time-bound
- **Progress Tracking**: Visual progress toward each goal
- **Milestone Celebrations**: Achievement unlocks at key points

### 4. Habit Tracker
- **Custom Habits**: "Drink 8 glasses of water", "No late-night snacking"
- **Streak Tracking**: Consecutive days maintained
- **Habit Stacking**: Link habits to existing routines
- **Visual Calendar**: Heat map of habit completion

### 5. Weekly Reports
- **Cross-Module Analysis**: Meal Plan + Nutrition combined
- **Insights & Patterns**: "You eat more on weekends"
- **Recommendations**: Actionable next steps
- **Exportable Reports**: PDF/share functionality

### 6. Coaching Sessions (Premium)
- **AI Chat Interface**: Conversational coaching
- **Meal Plan Review**: Coach analyzes your plan
- **Nutrition Audit**: Deep-dive into eating patterns
- **Action Plans**: Structured improvement roadmap

---

## Folder Structure

```
meal_planner_app/
├── client/
│   └── src/
│       ├── modules/
│       │   │
│       │   ├── meal-planner/         # Meal Plan App (existing)
│       │   ├── nutrition/            # Nutrition App (existing)
│       │   │
│       │   └── coaching/             # ⭐ NEW: Coaching App
│       │       ├── index.js          # Module entry point & exports
│       │       ├── CoachingApp.js    # Module root component
│       │       │
│       │       ├── components/
│       │       │   ├── CoachingDashboard.js      # Main overview
│       │       │   ├── CoachingDashboard.css
│       │       │   ├── HealthScore.js            # 0-100 health metric
│       │       │   ├── HealthScore.css
│       │       │   ├── AICoach.js                # AI recommendations UI
│       │       │   ├── AICoach.css
│       │       │   ├── DailyCheckin.js           # Daily mood/status
│       │       │   ├── DailyCheckin.css
│       │       │   ├── GoalManager.js            # Create/edit goals
│       │       │   ├── GoalManager.css
│       │       │   ├── GoalProgress.js           # Visual progress
│       │       │   ├── GoalProgress.css
│       │       │   ├── HabitTracker.js           # Habit management
│       │       │   ├── HabitTracker.css
│       │       │   ├── HabitCalendar.js          # Heat map view
│       │       │   ├── HabitCalendar.css
│       │       │   ├── WeeklyReport.js           # Combined insights
│       │       │   ├── WeeklyReport.css
│       │       │   ├── CoachingChat.js           # AI chat interface
│       │       │   ├── CoachingChat.css
│       │       │   ├── InsightCard.js            # Reusable insight display
│       │       │   ├── InsightCard.css
│       │       │   ├── ProgressRing.js           # Circular progress
│       │       │   ├── ProgressRing.css
│       │       │   ├── TrendIndicator.js         # Up/down arrows
│       │       │   └── TrendIndicator.css
│       │       │
│       │       ├── hooks/
│       │       │   ├── useCoaching.js            # Coaching state management
│       │       │   ├── useHealthScore.js         # Health score calculation
│       │       │   ├── useGoals.js               # Goal CRUD operations
│       │       │   ├── useHabits.js              # Habit tracking ops
│       │       │   ├── useInsights.js            # AI insight fetching
│       │       │   ├── useMealPlanData.js        # READ meal plan (shared)
│       │       │   └── useNutritionData.js       # READ nutrition (shared)
│       │       │
│       │       ├── utils/
│       │       │   ├── healthScoreCalculator.js  # Score algorithm
│       │       │   ├── insightGenerator.js       # Pattern detection
│       │       │   ├── goalHelpers.js            # Goal utilities
│       │       │   └── coachingPrompts.js        # AI prompt templates
│       │       │
│       │       └── styles/
│       │           └── coaching-theme.css        # Module-specific overrides
│       │
│       └── shared/
│           ├── hooks/
│           │   ├── useMealPlanData.js   # Shared: READ meal plan
│           │   └── useNutritionData.js  # Shared: READ nutrition
│           └── ...
│
├── server.js                         # Backend (add coaching routes)
└── migrations/
    └── 011_coaching_tables.sql       # Coaching-specific tables
```

---

## Routes Architecture

### Frontend Routes (View States)

```javascript
// App.js - currentView states for Coaching

// Coaching Module
'coaching'           // Module root → CoachingDashboard
'co-checkin'         // Daily check-in flow
'co-goals'           // Goal management
'co-habits'          // Habit tracker
'co-report'          // Weekly/monthly reports
'co-chat'            // AI coaching chat (premium)
'co-insights'        // Detailed insights view
```

### Backend API Routes

```javascript
// ============================================
// COACHING MODULE ROUTES (NEW)
// ============================================

// --- Health Score ---
GET    /api/coaching/health-score           // Get current health score
GET    /api/coaching/health-score/history   // Score history over time

// --- Daily Check-ins ---
GET    /api/coaching/checkin/:date          // Get check-in for date
POST   /api/coaching/checkin                // Submit daily check-in
GET    /api/coaching/checkin/streak         // Get check-in streak

// --- Goals ---
GET    /api/coaching/goals                  // Get all user goals
POST   /api/coaching/goals                  // Create new goal
PUT    /api/coaching/goals/:goalId          // Update goal
DELETE /api/coaching/goals/:goalId          // Delete goal
POST   /api/coaching/goals/:goalId/progress // Log goal progress

// --- Habits ---
GET    /api/coaching/habits                 // Get all habits
POST   /api/coaching/habits                 // Create new habit
PUT    /api/coaching/habits/:habitId        // Update habit
DELETE /api/coaching/habits/:habitId        // Delete habit
POST   /api/coaching/habits/:habitId/log    // Log habit completion
GET    /api/coaching/habits/:habitId/calendar // Get habit calendar data

// --- AI Insights ---
GET    /api/coaching/insights               // Get AI-generated insights
GET    /api/coaching/insights/daily         // Today's recommendations
GET    /api/coaching/insights/weekly        // Weekly summary insights
POST   /api/coaching/chat                   // AI coaching chat (premium)

// --- Reports ---
GET    /api/coaching/reports/weekly         // Weekly coaching report
GET    /api/coaching/reports/monthly        // Monthly progress report
GET    /api/coaching/reports/export/:type   // Export report (PDF/JSON)

// ============================================
// CROSS-MODULE DATA ACCESS (READ-ONLY)
// ============================================

// These are existing routes the Coaching app will READ from:
GET    /api/meal-plan                       // From Meal Plan module
GET    /api/favorites                       // From Meal Plan module
GET    /api/nutrition/summary/:date         // From Nutrition module
GET    /api/nutrition/goals                 // From Nutrition module
GET    /api/nutrition/reports/weekly        // From Nutrition module
```

---

## Database Schema (New Tables)

```sql
-- migrations/011_coaching_tables.sql

-- ============================================
-- DAILY CHECK-INS
-- ============================================
CREATE TABLE IF NOT EXISTS coaching_checkins (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  mood VARCHAR(20), -- 'great', 'good', 'okay', 'low', 'struggling'
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, checkin_date)
);

-- ============================================
-- HEALTH SCORE HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS health_score_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  score_date DATE NOT NULL,
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  nutrition_score INTEGER CHECK (nutrition_score BETWEEN 0 AND 100),
  consistency_score INTEGER CHECK (consistency_score BETWEEN 0 AND 100),
  habit_score INTEGER CHECK (habit_score BETWEEN 0 AND 100),
  goal_score INTEGER CHECK (goal_score BETWEEN 0 AND 100),
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, score_date)
);

-- ============================================
-- GOALS
-- ============================================
CREATE TABLE IF NOT EXISTS coaching_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  goal_type VARCHAR(50) NOT NULL, -- 'weight', 'nutrition', 'habit', 'fitness', 'custom'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_value DECIMAL(10,2),
  target_unit VARCHAR(50), -- 'lbs', 'kg', 'days', 'times', etc.
  current_value DECIMAL(10,2) DEFAULT 0,
  start_date DATE NOT NULL,
  target_date DATE,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'paused', 'abandoned'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Goal progress entries
CREATE TABLE IF NOT EXISTS goal_progress (
  id SERIAL PRIMARY KEY,
  goal_id INTEGER REFERENCES coaching_goals(id) ON DELETE CASCADE,
  progress_date DATE NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- HABITS
-- ============================================
CREATE TABLE IF NOT EXISTS coaching_habits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  habit_name VARCHAR(255) NOT NULL,
  description TEXT,
  frequency VARCHAR(20) DEFAULT 'daily', -- 'daily', 'weekdays', 'weekly', 'custom'
  frequency_target INTEGER DEFAULT 1, -- times per frequency period
  reminder_time TIME,
  icon VARCHAR(10), -- emoji
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Habit completion log
CREATE TABLE IF NOT EXISTS habit_log (
  id SERIAL PRIMARY KEY,
  habit_id INTEGER REFERENCES coaching_habits(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  completed BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(habit_id, log_date)
);

-- ============================================
-- AI INSIGHTS CACHE
-- ============================================
CREATE TABLE IF NOT EXISTS coaching_insights (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'pattern', 'recommendation'
  insight_date DATE NOT NULL,
  title VARCHAR(255),
  content TEXT NOT NULL,
  priority INTEGER DEFAULT 5, -- 1-10, higher = more important
  is_read BOOLEAN DEFAULT false,
  action_taken BOOLEAN DEFAULT false,
  expires_at DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- COACHING CHAT HISTORY (Premium)
-- ============================================
CREATE TABLE IF NOT EXISTS coaching_chat_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'user', 'coach'
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_checkins_user_date ON coaching_checkins(user_id, checkin_date);
CREATE INDEX idx_health_score_user_date ON health_score_history(user_id, score_date);
CREATE INDEX idx_goals_user_status ON coaching_goals(user_id, status);
CREATE INDEX idx_habits_user_active ON coaching_habits(user_id, is_active);
CREATE INDEX idx_habit_log_date ON habit_log(habit_id, log_date);
CREATE INDEX idx_insights_user_date ON coaching_insights(user_id, insight_date);
CREATE INDEX idx_chat_session ON coaching_chat_history(session_id, created_at);
```

---

## Health Score Algorithm

### Score Components (0-100 each)

```javascript
// utils/healthScoreCalculator.js

const SCORE_WEIGHTS = {
  nutrition: 0.30,    // 30% - Are you hitting nutrition goals?
  consistency: 0.25,  // 25% - How consistent are your habits?
  habits: 0.20,       // 20% - Habit completion rate
  goals: 0.15,        // 15% - Progress toward goals
  checkins: 0.10      // 10% - Regular check-in engagement
};

function calculateHealthScore(userData) {
  const scores = {
    nutrition: calculateNutritionScore(userData.nutritionData),
    consistency: calculateConsistencyScore(userData.mealPlanAdherence),
    habits: calculateHabitScore(userData.habitLogs),
    goals: calculateGoalScore(userData.goals),
    checkins: calculateCheckinScore(userData.checkins)
  };
  
  const overallScore = Object.entries(SCORE_WEIGHTS).reduce(
    (total, [key, weight]) => total + (scores[key] * weight), 
    0
  );
  
  return {
    overall: Math.round(overallScore),
    breakdown: scores,
    trend: calculateTrend(userData.previousScores)
  };
}
```

### Score Calculation Details

| Component | Calculation Method |
|-----------|-------------------|
| **Nutrition** | % of days within calorie/macro targets (7-day rolling) |
| **Consistency** | % of planned meals actually logged |
| **Habits** | % of habits completed this week |
| **Goals** | Average % progress across active goals |
| **Check-ins** | Days checked in / 7 (weekly) |

---

## AI Coach Prompts

### Daily Insight Generation

```javascript
// utils/coachingPrompts.js

const DAILY_INSIGHT_PROMPT = `
You are a supportive health coach. Based on the following user data, 
generate a personalized daily insight.

User Data:
- Health Score: {healthScore}/100
- Yesterday's Nutrition: {nutritionSummary}
- Meal Plan Adherence: {adherencePercent}%
- Active Goals: {goalsList}
- Habit Streak: {habitStreak} days
- Recent Mood: {recentMoods}

Generate a brief, encouraging insight (2-3 sentences) that:
1. Acknowledges something positive
2. Identifies one area for improvement
3. Provides a specific, actionable tip

Tone: Warm, supportive, not preachy. Like a friend who's also a coach.
`;

const WEEKLY_SUMMARY_PROMPT = `
You are a health coach providing a weekly summary.

This Week's Data:
- Health Score Trend: {scoreTrend}
- Nutrition Goal Achievement: {nutritionGoalPercent}%
- Meals Logged: {mealsLogged}
- Habits Completed: {habitsCompleted}/{habitsTotal}
- Goal Progress: {goalProgress}

Generate a weekly summary that includes:
1. Top achievement to celebrate
2. Pattern or trend observed
3. Focus area for next week
4. Motivational closing

Keep it under 150 words. Be specific with data where helpful.
`;
```

---

## Component Specifications

### CoachingDashboard.js

```javascript
/**
 * Main Coaching Dashboard
 * 
 * Displays:
 * - Health Score ring (prominent)
 * - Today's AI insight
 * - Quick habit check-off
 * - Goal progress summary
 * - Weekly trends mini-chart
 */

function CoachingDashboard() {
  const { healthScore, loading } = useHealthScore();
  const { todayInsight } = useInsights();
  const { habits, toggleHabit } = useHabits();
  const { goals } = useGoals();
  
  return (
    <div className="coaching-dashboard">
      <header className="dashboard-header">
        <h1>Your Health Coach</h1>
        <DailyCheckinButton />
      </header>
      
      <section className="score-section">
        <HealthScore 
          score={healthScore.overall} 
          trend={healthScore.trend}
          breakdown={healthScore.breakdown}
        />
      </section>
      
      <section className="insight-section">
        <InsightCard insight={todayInsight} />
      </section>
      
      <section className="habits-quick">
        <h2>Today's Habits</h2>
        <HabitQuickList 
          habits={habits} 
          onToggle={toggleHabit} 
        />
      </section>
      
      <section className="goals-summary">
        <h2>Goal Progress</h2>
        <GoalProgressList goals={goals} />
      </section>
    </div>
  );
}
```

### HealthScore.js

```javascript
/**
 * Circular progress ring showing health score
 * 
 * Features:
 * - Animated fill on load
 * - Color changes based on score (red → yellow → green)
 * - Tap to see breakdown
 * - Trend arrow indicator
 */

function HealthScore({ score, trend, breakdown, onViewDetails }) {
  const scoreColor = getScoreColor(score);
  
  return (
    <div className="health-score-container">
      <ProgressRing 
        progress={score} 
        max={100}
        color={scoreColor}
        size={180}
        strokeWidth={12}
      >
        <div className="score-inner">
          <span className="score-value">{score}</span>
          <TrendIndicator direction={trend} />
        </div>
      </ProgressRing>
      
      <button 
        className="view-breakdown" 
        onClick={onViewDetails}
      >
        View Breakdown
      </button>
      
      {breakdown && (
        <div className="score-breakdown">
          <ScoreBreakdownBar 
            label="Nutrition" 
            value={breakdown.nutrition} 
          />
          <ScoreBreakdownBar 
            label="Consistency" 
            value={breakdown.consistency} 
          />
          <ScoreBreakdownBar 
            label="Habits" 
            value={breakdown.habits} 
          />
          <ScoreBreakdownBar 
            label="Goals" 
            value={breakdown.goals} 
          />
        </div>
      )}
    </div>
  );
}

function getScoreColor(score) {
  if (score >= 80) return 'var(--asr-green-500)';
  if (score >= 60) return 'var(--asr-orange-500)';
  if (score >= 40) return 'var(--asr-orange-600)';
  return 'var(--asr-red-500)';
}
```

### HabitTracker.js

```javascript
/**
 * Full habit management view
 * 
 * Features:
 * - List of all habits with today's status
 * - Add new habit
 * - Streak display per habit
 * - Calendar heat map (last 30 days)
 */

function HabitTracker() {
  const { 
    habits, 
    addHabit, 
    deleteHabit, 
    toggleHabit, 
    getStreak 
  } = useHabits();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  
  return (
    <div className="habit-tracker">
      <header>
        <h1>Habit Tracker</h1>
        <button onClick={() => setShowAddModal(true)}>
          + New Habit
        </button>
      </header>
      
      <section className="habits-list">
        {habits.map(habit => (
          <HabitCard 
            key={habit.id}
            habit={habit}
            streak={getStreak(habit.id)}
            onToggle={() => toggleHabit(habit.id)}
            onSelect={() => setSelectedHabit(habit)}
          />
        ))}
      </section>
      
      {selectedHabit && (
        <HabitCalendar 
          habit={selectedHabit}
          onClose={() => setSelectedHabit(null)}
        />
      )}
      
      {showAddModal && (
        <AddHabitModal 
          onSave={addHabit}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
```

---

## Cross-Module Data Flow

### Read-Only Access Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                        COACHING APP                              │
│                                                                  │
│   ┌───────────────────────────────────────────────────────────┐ │
│   │                    useHealthScore()                        │ │
│   │                                                            │ │
│   │  Aggregates data from:                                     │ │
│   │  ├── useMealPlanData() ──────► GET /api/meal-plan          │ │
│   │  ├── useNutritionData() ─────► GET /api/nutrition/summary  │ │
│   │  ├── useGoals() ─────────────► GET /api/coaching/goals     │ │
│   │  └── useHabits() ────────────► GET /api/coaching/habits    │ │
│   └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│   Data Ownership:                                               │
│   ├── Meal Plan data ──── READ ONLY (owned by Meal Plan App)   │
│   ├── Nutrition data ──── READ ONLY (owned by Nutrition App)   │
│   ├── Goals data ──────── READ/WRITE (owned by Coaching App)   │
│   ├── Habits data ─────── READ/WRITE (owned by Coaching App)   │
│   └── Insights data ───── READ/WRITE (owned by Coaching App)   │
└─────────────────────────────────────────────────────────────────┘
```

### Shared Hooks (in shared/hooks/)

```javascript
// shared/hooks/useMealPlanData.js
// Used by: Nutrition App (import), Coaching App (analysis)

export function useMealPlanData() {
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchWithAuth('/api/meal-plan')
      .then(data => setMealPlan(data))
      .finally(() => setLoading(false));
  }, []);
  
  return { mealPlan, loading };
}

// shared/hooks/useNutritionData.js  
// Used by: Coaching App (analysis)

export function useNutritionData(dateRange = 7) {
  const [nutritionData, setNutritionData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - dateRange);
      
      const summaries = await fetchWithAuth(
        `/api/nutrition/summary/week/${formatDate(startDate)}`
      );
      setNutritionData(summaries);
      setLoading(false);
    };
    fetchData();
  }, [dateRange]);
  
  return { nutritionData, loading };
}
```

---

## Premium Features (Paywall)

### Free Tier
- Health Score (basic)
- 3 habits max
- 2 goals max
- Daily insights (1 per day)
- Weekly summary (basic)

### Premium Tier ($4.99/month)
- Health Score with full breakdown
- Unlimited habits
- Unlimited goals
- AI coaching chat
- Detailed weekly reports
- Export to PDF
- Custom insights frequency
- Historical analysis (90+ days)

---

## UI/UX Design Guidelines

### Color Scheme (ASR Theme)

```css
/* coaching-theme.css */

.coaching-app {
  /* Primary accent for Coaching */
  --coaching-primary: var(--asr-purple-500);
  --coaching-secondary: var(--asr-purple-600);
  
  /* Score colors */
  --score-excellent: #22c55e;  /* Green - 80+ */
  --score-good: #f59e0b;       /* Orange - 60-79 */
  --score-needs-work: #ef4444; /* Red - below 60 */
  
  /* Mood colors */
  --mood-great: #22c55e;
  --mood-good: #84cc16;
  --mood-okay: #f59e0b;
  --mood-low: #f97316;
  --mood-struggling: #ef4444;
}
```

### Component Styling

- **Cards**: Rounded corners (12px), subtle shadow, white background
- **Progress Rings**: Animated SVG, gradient fills
- **Habit Checkboxes**: Large touch targets (44px min), satisfying animation
- **Insights**: Gradient border accent, icon prefix
- **Goals**: Progress bars with milestone markers

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create module folder structure
- [ ] Implement CoachingApp.js root component
- [ ] Add to AppSwitchboard
- [ ] Basic routing setup
- [ ] Database migration (tables)

### Phase 2: Core Features (Week 2)
- [ ] CoachingDashboard with placeholder data
- [ ] HealthScore component (UI only)
- [ ] Daily check-in flow
- [ ] Basic goal CRUD

### Phase 3: Habits (Week 3)
- [ ] HabitTracker component
- [ ] Habit completion logging
- [ ] Streak calculation
- [ ] HabitCalendar heat map

### Phase 4: Integration (Week 4)
- [ ] Connect to Meal Plan data (read-only)
- [ ] Connect to Nutrition data (read-only)
- [ ] Health score calculation algorithm
- [ ] Cross-module data aggregation

### Phase 5: AI Features (Week 5)
- [ ] Daily insight generation
- [ ] Weekly summary generation
- [ ] Basic AI chat (premium)
- [ ] Insight caching

### Phase 6: Polish (Week 6)
- [ ] Animations and transitions
- [ ] Export/share functionality
- [ ] Premium paywall integration
- [ ] Performance optimization

---

## Testing Strategy

### Unit Tests
- Health score calculation accuracy
- Habit streak calculation
- Goal progress percentage
- Date range utilities

### Integration Tests
- Cross-module data fetching
- API endpoint responses
- Database operations

### E2E Tests
- Complete check-in flow
- Add habit → complete → view streak
- Create goal → log progress → completion

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily Check-in Rate | >50% of active users | Users completing check-in / DAU |
| Habit Completion | >70% | Habits marked complete / total due |
| Health Score Engagement | >3 views/week | Score views per user per week |
| Premium Conversion | >5% | Premium subscribers / total users |
| Retention (30-day) | >40% | Users active day 30 / users day 1 |

---

## Security Considerations

- **Data Isolation**: All coaching data filtered by user_id
- **Cross-Module Access**: Read-only access to Meal Plan/Nutrition
- **Rate Limiting**: AI chat limited to 50 messages/day
- **Input Validation**: All user inputs sanitized
- **Premium Verification**: Server-side subscription check

---

## Future Enhancements

1. **Social Features**: Share achievements, friend challenges
2. **Wearable Integration**: Apple Health, Fitbit, Garmin
3. **Voice Check-ins**: "Hey Coach, I had a great day"
4. **Personalized AI**: Learning user preferences over time
5. **Group Coaching**: Family or team challenges
6. **Professional Integration**: Connect with real dietitians/coaches

---

## Appendix: API Response Examples

### Health Score Response
```json
{
  "overall": 72,
  "breakdown": {
    "nutrition": 68,
    "consistency": 85,
    "habits": 70,
    "goals": 60,
    "checkins": 100
  },
  "trend": "up",
  "previousScore": 68,
  "calculatedAt": "2025-12-18T10:00:00Z"
}
```

### Daily Insight Response
```json
{
  "id": 1234,
  "type": "daily",
  "title": "Great Protein Week!",
  "content": "You've hit your protein goal 5 out of the last 7 days - that's building real momentum! Today, try adding a Greek yogurt snack to keep the streak going.",
  "priority": 7,
  "createdAt": "2025-12-18T06:00:00Z"
}
```

### Habit with Streak Response
```json
{
  "id": 5,
  "habitName": "Drink 8 glasses of water",
  "icon": "💧",
  "color": "#3b82f6",
  "frequency": "daily",
  "streak": {
    "current": 12,
    "best": 21,
    "completedToday": true
  },
  "last30Days": [1,1,1,0,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
}
```
