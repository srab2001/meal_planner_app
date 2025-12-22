# FITNESS APP - USER FLOWS QUICK REFERENCE

**Prepared By:** Product Designer & UX Architect  
**Date:** December 21, 2025  
**Document:** Flow summary and index

---

## 🎯 OVERVIEW: 7 END-TO-END USER FLOWS

All flows documented in **FITNESS_USER_FLOWS.md** (comprehensive 50+ page document)

---

## FLOW 1: VIEWING FITNESS DASHBOARD

### Quick Summary
- **Entry:** User opens Fitness App
- **Goal:** View overall fitness activity and status
- **Key Screens:** Dashboard with widgets, stats, activity feed
- **Time:** 30 seconds to 2 minutes
- **Exit to:** Any other flow or App Switchboard

### Key User Actions
- Load dashboard
- View activity summary
- See scheduled workouts
- Check progress charts
- Click to navigate to other flows

### Critical Elements
- Loading state (0-2 sec)
- Workout summary widget
- Recent activity feed
- Active plan display
- Progress visualization

### Error Scenarios
- Network error → Retry or offline mode
- No workouts → Show empty state with prompts
- Incomplete profile → Show profile completion form
- Wearable sync failed → Show warning banner

---

## FLOW 2: CREATING A WORKOUT PLAN

### Quick Summary
- **Entry:** Click "Create New Plan" button
- **Goal:** Build customized 4-20 week workout plan
- **Key Screens:** Multi-step form (3 steps)
- **Time:** 10-15 minutes
- **Exit to:** Flow 3 (log first workout) or Dashboard

### 3-Step Process
**Step 1: Plan Basics**
- Enter plan name
- Select primary goal (6 types)
- Choose difficulty level
- Set duration (4-20 weeks)
- Select frequency (2-6 days/week)

**Step 2: Workout Selection**
- Choose from templates OR build custom
- Browse workout library (filtered)
- Arrange weekly schedule
- Ensure workout variety

**Step 3: Review and Confirm**
- Review full plan summary
- Set notifications (optional)
- Confirm creation

### Key User Actions
- Fill multi-step form
- Select options from dropdowns/radio buttons
- Browse workout library
- Drag-and-drop workouts to calendar
- Confirm plan creation

### Critical Elements
- Form validation at each step
- Visual weekly calendar
- Workout library with filters
- Estimated time commitment display
- Confirmation screen

### Error Scenarios
- Missing required fields → Highlight, show error
- Invalid duration → Show warning
- No workouts selected → Disable submit button
- Schedule conflict → Show warning
- Network error on save → Offer retry or offline save

---

## FLOW 3: LOGGING WORKOUTS

### Quick Summary
- **Entry:** Click "Start Workout" or "Log Workout"
- **Goal:** Record exercise sets, reps, weights, and effort
- **Key Screens:** Active workout screen with timer
- **Time:** 20-90 minutes (depending on workout)
- **Exit to:** Dashboard or Flow 4 (progress)

### Workout Logging Process
**Initiation**
- Start planned workout OR create quick workout
- System starts timer and shows first exercise

**For Each Exercise**
- Log completed set (reps + weight)
- Set rest timer (60 sec default, customizable)
- Log RPE (1-10 scale)
- Log form rating (optional)
- Move to next set or next exercise

**At Completion**
- Review total duration/volume/calories
- Add optional notes
- Confirm save

### Key User Actions
- Start workout timer
- Log sets (reps, weight, RPE per set)
- Rest between sets
- Manually log or skip exercises
- Add workout notes
- Confirm completion

### Critical Elements
- Active timer (continuously updating)
- Exercise list with progress
- Set/rep/weight inputs
- Rest timer with audio cue
- Calorie burn estimate
- Form feedback (if available)

### Error Scenarios
- Lost internet → Continue offline, sync later
- Invalid input → Show validation error
- App crashes → Restore from last saved set
- No exercises in plan → Show error, offer alternatives
- Timer malfunction → Manual duration entry

---

## FLOW 4: TRACKING PROGRESS OVER TIME

### Quick Summary
- **Entry:** Click "View Progress" or progress chart
- **Goal:** Analyze workout history and trends
- **Key Screens:** Dashboard with charts, metrics, workout list
- **Time:** 5-20 minutes
- **Exit to:** Flow 5 (goals), Flow 7 (edit workout), or Dashboard

### Progress Views
**Overview (Default)**
- Summary metrics (workouts, duration, volume, calories)
- Time period selector (week/month/3mo/year/all-time)
- Visual indicators (average vs goal lines)

**Charts & Graphs**
- Weekly activity bar chart
- Duration trend line
- Calorie burn area chart
- Exercise frequency bar chart
- Strength progression line (by exercise)

**Detailed View**
- Select specific date → View that day's workouts
- Click workout → See full details
- Personal records (PRs) by exercise
- Period comparison (this week vs last week)

### Key User Actions
- Select time period (week/month/year)
- View summary cards
- Interact with charts (hover, click, zoom)
- Select specific workout for details
- View PRs and achievements
- Compare time periods

### Critical Elements
- Time period selector
- Summary metric cards
- Interactive charts
- Workout list/calendar
- PR display
- Comparison view

### Error Scenarios
- No data for period → Show empty state, suggest date change
- Sync failed → Show warning, offer retry
- Chart rendering error → Show data table fallback

---

## FLOW 5: VIEWING GOALS AND MILESTONES

### Quick Summary
- **Entry:** Click "Goals & Milestones" or goal widget
- **Goal:** Set, track, and achieve fitness goals
- **Key Screens:** Goal list, goal details, goal creation form
- **Time:** 10-30 minutes (goal viewing/creation)
- **Exit to:** Dashboard or create new goal

### Goal Types
1. **Strength:** Increase max weight on exercise
2. **Cardio:** Improve distance/duration
3. **Weight Loss:** Reach target body weight
4. **Consistency:** Complete X workouts per week
5. **Flexibility:** Improve range of motion
6. **Habit:** Complete specific exercise X times
7. **Custom:** User-defined goal

### Goal Lifecycle
**View Current Goals**
- See active goals with progress bars
- See completed goals (archived)
- See milestones (sub-goals)
- View goal insights and pace analysis

**Create New Goal**
1. Select goal type
2. Define specifics (current → target)
3. Set target date
4. Configure notifications
5. Create goal

**Track Progress**
- Auto-update from logged workouts
- Manual logging (weight loss goals)
- View milestone breakdowns
- Receive notifications on progress
- View trend predictions

**Manage Goals**
- Edit target or date (before started)
- Mark as achieved (celebration!)
- Pause or delete goal
- Set notifications

### Key User Actions
- Create goal (multi-step form)
- Set target date (calendar picker)
- Review goal progress
- Expand goal details
- View milestones
- Log manual progress
- Mark achieved
- Edit/pause/delete

### Critical Elements
- Goal type selector
- Target value + date inputs
- Progress bar visualization
- Milestone breakdown
- Pace analysis/insights
- Achievement celebration screen
- Notification preferences

### Error Scenarios
- Invalid target (less than current) → Show error
- Unrealistic pace → Show warning, allow override
- Goal type not applicable → Show message
- Weight not entered → Offer to enter or continue manual

---

## FLOW 6: LINKING FITNESS DATA TO NUTRITION (READ-ONLY)

### Quick Summary
- **Entry:** Click "Nutrition" or "View Nutrition Impact"
- **Goal:** See how fitness affects nutrition recommendations
- **Key Screens:** Nutrition module showing fitness-adjusted data
- **Time:** 3-10 minutes
- **Exit to:** Nutrition Module or back to Fitness

### What User Sees (Read-Only)
- Last 7 days fitness activity summary
- Current calorie target (base)
- **Adjusted** calorie target based on fitness
- Current macros (from meal plan)
- **Recommended** macros based on fitness profile
- Post-workout meal suggestions
- Weekly meal plan with fitness annotations
- Micro-nutrient recommendations
- Hydration recommendations

### Fitness Determines Nutrition Adjustments
- **Strength focus** (2+ sessions/week)
  - Higher protein (25-30%)
  - Moderate carbs (40-45%)
  - Normal fats (25-30%)

- **Cardio focus** (2+ sessions/week)
  - Moderate protein (20-25%)
  - Higher carbs (45-50%)
  - Normal fats (25-30%)

- **Balanced** (mix of both)
  - 40/30/30 macro split

### Key User Actions
- View activity-based recommendations
- See adjusted calorie targets
- See recommended macros
- View post-workout meals
- View weekly plan
- View micro-nutrient recommendations
- Navigate to Nutrition Module to make changes
- Return to Fitness

### Critical Elements
- Activity summary (from Fitness)
- Calorie calculation showing adjustment
- Macro comparison (current vs recommended)
- Color coding (green/yellow/red)
- Plain language explanations
- "Go to Nutrition Module" button for changes

### Important Constraints
- **READ-ONLY** view
- Cannot modify meal plan here
- Cannot log food here
- Cannot create shopping list here
- Must go to Nutrition Module to make changes

### Error Scenarios
- Nutrition API unavailable → Show message, offer retry
- User has no meal plan → Show message, offer to create
- Conflicting data → Show sync option
- Insufficient fitness data → Show generic guidelines

---

## FLOW 7: EDITING OR DELETING LOGGED WORKOUTS

### Quick Summary
- **Entry:** Click workout from Progress view
- **Goal:** Modify or remove workout data
- **Key Screens:** Workout details, edit form
- **Time:** 5-15 minutes
- **Exit to:** Flow 4 (progress) or Dashboard

### Edit Restrictions
- **Can edit:** Workouts within 24 hours
- **Cannot edit:** Archived workouts (>24 hours old)
- **Can only edit own workouts** (permissions check)

### What Can Be Edited
- Individual set data:
  - Reps (change from 8 to 10)
  - Weight (change from 275 to 280)
  - RPE (change perception rating)
- Add or remove sets
- Change exercise for that slot
- Update workout duration
- Update difficulty rating
- Update notes

### What CANNOT Be Edited
- Workout date (for recent) / Cannot change for old workouts
- Workout time (for recent)
- Complete exercise replacement to different one (remove + add)

### Deletion Impact
- Removing workout affects:
  - Progress statistics (recalculated)
  - Streaks (may reset if daily streak)
  - Achievements (may lose badges)
  - Goal progress (if related to goal)

### Key User Actions
- Access workout from progress view
- Click "Edit Workout"
- Edit individual set data
- Add or remove sets
- Change exercise
- Update duration/difficulty/notes
- Save or cancel
- OR: Delete entire workout
- Confirm deletion with warning

### Critical Elements
- Workout summary display
- Inline editing (click-to-edit fields)
- Real-time calculation updates
- Set add/remove buttons
- Unsaved changes warning
- Deletion confirmation modal
- Impact warning (streaks/badges)
- Validation error messages

### Error Scenarios
- Workout >24 hours old → Show "Cannot edit archived workouts"
- User not owner → Show "Permission denied"
- Network error on save → Offer retry or offline save
- Validation error → Highlight field, show error message
- Concurrent edit conflict → Show refresh options

---

## FLOW DEPENDENCY CHART

```
START: AppSwitchboard
│
└─→ FLOW 1: Dashboard (default landing)
    │
    ├─→ FLOW 2: Create Plan
    │   └─→ FLOW 3: Log Workout (first time)
    │
    ├─→ FLOW 3: Log Workout
    │   └─→ [Dashboard or FLOW 4]
    │
    ├─→ FLOW 4: Progress
    │   ├─→ FLOW 7: Edit/Delete Workout
    │   └─→ FLOW 5: Goals
    │
    ├─→ FLOW 5: Goals
    │   └─→ [Create new goal or Dashboard]
    │
    ├─→ FLOW 6: Nutrition
    │   └─→ Nutrition Module (external)
    │
    └─→ [Exit to AppSwitchboard]
```

---

## QUICK USER JOURNEY EXAMPLE

### New User's First 30 Minutes

**Minute 0-2:** FLOW 1
- Opens Fitness, sees empty dashboard
- Sees "Create Your First Plan" prompt

**Minute 2-15:** FLOW 2
- Creates 8-week "Summer Strength" plan
- Selects muscle gain goal
- Arranges 4 workouts/week
- Confirms creation

**Minute 15-16:** FLOW 1
- Dashboard updates to show plan
- Sees first workout: "Monday - Chest & Triceps"

**Minute 16-60:** FLOW 3
- Starts first workout
- Logs 5 exercises (bench press, incline press, dips, etc.)
- Completes ~40 minute workout
- Saves with notes: "Felt great, good form"

**Minute 60-70:** FLOW 4
- Views progress → Sees 1 workout logged
- Sees "Great job! Complete more workouts to see trends"

**Minute 70-75:** FLOW 5
- Creates goal: "Bench Press 315 lbs"
- Sets 12-week deadline
- Gets milestone breakdown

**Minute 75-80:** FLOW 6
- Clicks "View Nutrition Impact"
- Sees: "Strength training detected → Add 15g protein per meal"
- Clicks "Go to Nutrition" to adjust meal plan

**Minute 80+:** Navigation
- Returns to Fitness or Nutrition
- Continues using app

---

## USER FLOW STATISTICS

| Flow | Complexity | Time | Frequency |
|------|------------|------|-----------|
| **1** | Low | 30s-2min | Every session |
| **2** | Medium | 10-15min | Once per plan (8-20 weeks) |
| **3** | High | 20-90min | 2-6x per week |
| **4** | Medium | 5-20min | 2-3x per week |
| **5** | Medium | 10-30min | 1-2x per week (initial), then weekly review |
| **6** | Low | 3-10min | After workouts or weekly |
| **7** | Low | 5-15min | 1-2x per week (editing) |

---

## KEY DESIGN PRINCIPLES REFLECTED

### 1. **Progressive Disclosure**
- Dashboard shows summary, drills down to details
- Form steps guide user through complexity
- Detailed workout can be expanded

### 2. **Continuous Feedback**
- Real-time calculations during workout
- Progress updates after every action
- Celebration for achievements
- Warnings for issues

### 3. **Error Recovery**
- All error states can be resolved
- Offline mode prevents data loss
- Undo options where appropriate
- Clear messaging on what went wrong

### 4. **Consistency**
- Same patterns used across flows
- Consistent button placement and terminology
- Similar form patterns
- Consistent color coding (green/yellow/red)

### 5. **Flexibility**
- Can edit/delete recent workouts
- Can pause/restart goals
- Can customize plan
- Can view data multiple ways

### 6. **Integration**
- Fitness data informs Nutrition Module
- Read-only access to prevent conflicts
- Clear navigation between modules
- Complementary features, not redundant

---

## IMPLEMENTATION REFERENCE

For detailed specifications, see: **FITNESS_USER_FLOWS.md**

Each flow includes:
- Complete entry/exit points
- Step-by-step user actions
- System responses for success and error cases
- UI elements and states
- Validation rules
- Notifications and messaging
- Integration points with other modules

---

**Document Status:** ✅ COMPLETE  
**Next Step:** Use flows for wireframing and component design
