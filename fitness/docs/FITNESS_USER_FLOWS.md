# FITNESS APP - END-TO-END USER FLOWS

**Prepared By:** Product Designer & UX Architect  
**Date:** December 21, 2025  
**Status:** Flow Design (Pre-Implementation)

---

## FLOW 1: VIEWING FITNESS DASHBOARD

### Entry Point
- User is authenticated and on the Fitness Module main screen
- User clicks on "Fitness" tile from AppSwitchboard
- Or: User navigates back to Fitness from another module
- First load: Show loading state while fetching data

### User Actions
- Opens Fitness App
- System loads dashboard data
- User may scroll to view full dashboard
- User may interact with dashboard widgets
- User may click to navigate to other sections

### System Responses - Initial Load
- **Loading State (0-2 seconds)**
  - Show skeleton/spinner
  - Display message: "Loading your fitness dashboard..."
  - Disable all interactive elements

- **Data Fetch Success**
  - Display current fitness dashboard with:
    - Current week's workout count
    - Total minutes exercised (this week)
    - Workouts completed vs planned
    - Recent activity feed (last 5 workouts)
    - Active workout plan name
    - Next scheduled workout date/time
    - Progress visualization (weekly/monthly)
    - Quick action buttons:
      - "Start Workout"
      - "Log Workout"
      - "View Plans"
      - "My Progress"

- **Data Fetch Failure**
  - Show error message: "Unable to load dashboard"
  - Display options:
    - "Retry" button (re-fetch data)
    - "Continue Offline" button (show cached data)
  - Log error for debugging
  - Alert: "Some data may be outdated"

### Dashboard Widget Details
- **Workout Summary Card**
  - Completed workouts: X/Y this week
  - Total duration: XX hours YY minutes
  - Average intensity: Low/Medium/High
  - Click → View detailed stats

- **Active Plan Card**
  - Plan name
  - Goal type (Strength/Cardio/Flexibility/Weight Loss)
  - Progress: Week X of Y
  - Click → Edit plan or view workouts

- **Recent Activity Feed**
  - List of last 5-10 logged workouts
  - Format: [Date] [Exercise] [Duration] [Difficulty]
  - Click any item → View workout details

- **Next Scheduled Workout**
  - Date and time
  - Exercises planned
  - Estimated duration
  - Click → Start workout or edit

- **Progress Chart**
  - Weekly view: bars showing workouts completed
  - Monthly view: trend line of activity level
  - Click to toggle time period

### Error States

**Network Error**
- User action: None (system issue)
- System response: 
  - Display "Network Error - Unable to fetch data"
  - Show "Retry" button
  - Offer "View Offline Data" if cache exists
  - Disable navigation to other sections

**No Workouts Logged Yet (First Time)**
- User action: None (new user)
- System response:
  - Display empty state message: "No workouts yet"
  - Show motivational message: "Create your first workout plan to get started"
  - Highlight "Create Plan" button
  - Show example workout cards (read-only)

**Incomplete User Data**
- User action: None (data missing)
- System response:
  - Display warning: "Complete your profile to see personalized recommendations"
  - Show form to enter:
    - Fitness level (beginner/intermediate/advanced)
    - Primary goal (weight loss/muscle gain/endurance/maintenance)
    - Available days per week
  - Block some features until profile complete

**Sync Error with Wearable Device**
- User action: None (system issue)
- System response:
  - Display warning banner: "Fitness tracker sync failed"
  - Show last successful sync timestamp: "Last synced: 2 hours ago"
  - Offer: "Retry Sync" button
  - Warn: "Activity data may be incomplete"

### Exit State
- User clicks navigation button to:
  - "Create New Plan" → Flow 2
  - "Log Workout" → Flow 3
  - "View Progress" → Flow 4
  - "View Goals" → Flow 5
  - "Nutrition" → Opens Nutrition Module (read-only)
  - Back arrow → Returns to AppSwitchboard

---

## FLOW 2: CREATING A WORKOUT PLAN

### Entry Point
- User clicks "Create New Plan" button (from dashboard)
- User clicks "Create Plan" in empty state
- User has no active plan and is prompted to create one
- First-time user completing onboarding

### User Actions - Step 1: Plan Basics

**Action: Enter Plan Name**
- User taps on "Plan Name" input field
- User types plan name (e.g., "Summer Strength")
- System validates: 3-50 characters
- Placeholder text: "e.g., Summer Strength, Weight Loss, Marathon Training"

**Action: Select Primary Goal**
- User clicks on "Primary Goal" dropdown/radio buttons
- Options presented:
  - Muscle Gain (build strength)
  - Weight Loss (burn calories)
  - Endurance (improve cardio)
  - Flexibility (mobility)
  - General Wellness (balanced)
  - Sport-Specific (training for sport)
- User selects one goal
- System updates UI based on selection:
  - Muscle Gain → Show strength-focused exercises
  - Weight Loss → Show calorie-heavy exercises
  - Endurance → Show cardio-focused exercises

**Action: Select Difficulty Level**
- User clicks "Difficulty Level" radio buttons
- Options:
  - Beginner (new to fitness)
  - Intermediate (work out 2-3x/week)
  - Advanced (work out 4+x/week)
- User selects difficulty
- System validates matches user profile (if set)

**Action: Select Plan Duration**
- User clicks "Plan Duration" dropdown
- Options: 4, 8, 12, 16, 20 weeks
- User selects duration
- System shows: "Plan end date: [calculated date]"

**Action: Select Frequency**
- User selects "Workouts Per Week"
- Options: 2, 3, 4, 5, 6 days
- User clicks frequency
- System calculates total workouts: X workouts × Y weeks

### User Actions - Step 2: Workout Selection

**Action: Choose Workout Templates (if available)**
- System shows pre-built templates matching goal:
  - "Classic Strength" (for muscle gain)
  - "HIIT Cardio Blast" (for weight loss)
  - "Endurance Builder" (for cardio)
- User can:
  - Select template and customize
  - Build custom plan from scratch

**Action: Select Workouts from Library**
- User clicks "Add Workout to Week"
- System shows filtered workout library
- Filter options:
  - By type (strength/cardio/flexibility)
  - By duration (15/30/45/60 min)
  - By difficulty (beginner/intermediate/advanced)
  - By muscle group (chest/back/legs/etc.)
- User searches or browses
- User clicks workout name to preview:
  - Exercises in workout
  - Estimated duration
  - Difficulty level
  - Estimated calorie burn
- User clicks "Add to Plan"
- System adds workout to selected day

**Action: Arrange Workouts in Weekly Schedule**
- System shows weekly calendar grid:
  - Days of week (Mon-Sun)
  - Rest days marked
- User can:
  - Drag workout to different day
  - Change workout for specific day
  - Click day to add/edit workout
  - Specify time of day (optional)
- User ensures variety (no same muscles 2 days in a row)

### User Actions - Step 3: Review and Confirm

**Action: Review Full Plan**
- System displays:
  - Plan name
  - Goal
  - Duration (X weeks)
  - Weekly schedule overview
  - Total workouts: X
  - Estimated time commitment: X hours/week
  - Variety breakdown: X strength, Y cardio, Z flexibility

**Action: Set Notifications (Optional)**
- User clicks "Notification Settings"
- Options:
  - Workout reminders: On/Off
  - Reminder time: X minutes before
  - Daily reminder: On/Off
  - Weekly summary: On/Off
  - Achievement alerts: On/Off
- User adjusts preferences

**Action: Confirm Plan Creation**
- User clicks "Create Plan" button
- System validates all required fields:
  - Plan name: ✓
  - Goal: ✓
  - Duration: ✓
  - Frequency: ✓
  - At least 1 workout: ✓
  - Schedule valid: ✓

### System Responses - Success Path

**Plan Creation Success**
- System shows success screen:
  - Checkmark icon
  - Message: "Your plan '[Plan Name]' is ready!"
  - Shows first week of workouts
  - Shows "Plan starts: [date]"
- System logs event: plan_created
- System creates calendar entries for each workout
- System sends confirmation notification
- System updates dashboard to show active plan

**Next Action Options**
- "Start First Workout" → Flow 3
- "View Full Schedule" → Shows 4-week calendar
- "Go to Dashboard" → Returns to Flow 1
- "Edit Plan" → Re-enters edit mode

### System Responses - Error States

**Missing Required Field**
- System action: Highlight missing field in red
- Error message: "[Field Name] is required"
- User action: Fill in missing field
- System response: Clear error highlight, enable Next button

**Invalid Plan Name**
- System action: Highlight field in red
- Error message: "Plan name must be 3-50 characters"
- User action: Correct name
- System response: Clear error

**No Workouts Selected**
- System action: Disable "Create Plan" button
- Error message: "You must select at least 1 workout"
- User action: Add workouts via "Add Workout to Week"
- System response: Enable button when valid

**Schedule Conflict**
- System action: Show warning for two workouts same day
- Warning: "You have 2 workouts scheduled for Monday"
- User action: 
  - Option A: Remove one workout
  - Option B: Keep both (if intentional)
- System response: Allow if user confirms intention

**Network Error During Creation**
- System action: Show error modal
- Message: "Unable to save plan. Check internet connection."
- Options:
  - "Retry" → Attempt save again
  - "Save Offline" → Cache plan locally
  - "Cancel" → Discard changes
- User action: Select option
- System response:
  - If Retry: Attempt save, show success if works
  - If Save Offline: Show "Plan saved locally, will sync when online"
  - If Cancel: Warn "Changes will be lost", confirm cancellation

### Exit State
- Plan successfully created → User taken to Flow 3 (first workout) or Dashboard
- User cancelled → Return to dashboard
- User edited existing plan → Show updated plan on dashboard

---

## FLOW 3: LOGGING WORKOUTS

### Entry Point
- User clicks "Start Workout" on dashboard
- User clicks "Log Workout" button
- User's planned workout time arrives (notification)
- User clicks on workout in schedule
- User is on Fitness Dashboard or Workout Details screen

### User Actions - Start Workout

**Action: Initiate Workout**
- User clicks "Start Workout" or "Log Workout"
- System determines if user has active/planned workout:
  - If yes: Pre-populate with planned workout
  - If no: Show options:
    - "Use Planned Workout" (if exists)
    - "Create Quick Workout" (log improvised workout)
    - "Browse Library" (select from exercises)
- User selects option

**For Planned Workout Path:**
- System displays:
  - Workout name
  - Exercises: list with sets/reps/target weight
  - Estimated duration
  - "Start Workout" button
- User clicks "Start Workout"
- System starts timer
- UI transitions to Workout Logging Screen

### User Actions - Active Workout

**Workout Logging Screen Elements**
- Timer/clock showing elapsed time (start → current)
- Current exercise name and number (e.g., "Exercise 1 of 5")
- Exercise instructions and form tips
- Input fields for:
  - Sets completed (counter or input)
  - Reps per set (counter or input)
  - Weight used (lbs/kg dropdown + input)
  - RPE (Rate of Perceived Exertion): 1-10 scale
  - Notes (optional): "Good form", "Felt strong", etc.

**Action: Log Exercise Completion**
- User completes first set
- User logs set:
  - Taps "Log Set" or auto-detects rest time
  - Enters reps performed (if different from planned)
  - Enters weight used
  - System records timestamp
  - System updates UI: "Set 1 of 3 complete"

**Action: Rest Between Sets**
- System shows rest timer (user can adjust):
  - Default: 60 seconds
  - Countdown timer with audio cue at end
  - User can:
    - Skip rest → Continue immediately
    - Extend rest → Add time
    - Auto-continue → Move to next set when timer expires

**Action: Log Remaining Sets**
- User repeats log process for each set
- After final set of exercise:
  - System displays "Exercise X complete"
  - System offers:
    - "Next Exercise" button
    - "Add Notes" (optional)
    - "Skip this exercise" (if user unable to complete)

**Action: Skip Exercise (If Needed)**
- User clicks "Skip" or "Unable to Complete"
- System prompts: "Why are you skipping?"
  - Options: Pain/discomfort, Ran out of time, Forgot equipment, Too difficult
- User selects reason (optional)
- System notes skip reason for analytics
- System continues to next exercise

**Action: Complete Workout**
- User completes all exercises or clicks "End Workout"
- System displays:
  - Total time: XX minutes
  - Exercises completed: X/Y
  - Sets completed: X/Y
  - Estimated calories burned: XXX
- System offers options:
  - "Save and Finish" (required)
  - "Add Notes" (optional)
  - "Edit Session" (go back and change entries)

**Action: Add Workout Notes (Optional)**
- User clicks "Add Notes"
- System shows text area:
  - Placeholder: "How did the workout feel? Any comments?"
  - Max 500 characters
  - User types notes (e.g., "Great session, felt strong, form was solid")
- User clicks "Save Notes"
- System saves notes with workout

### System Responses - Active Workout

**Timer Running**
- System continuously:
  - Updates elapsed time display
  - Tracks rest intervals
  - Records all user inputs
  - Monitors data validation

**Set Completion**
- System logs:
  - Timestamp
  - Reps performed
  - Weight used
  - RPE (if provided)
  - Notes (if provided)
- System calculates:
  - Volume = sets × reps × weight
  - Estimated calories (based on exercise type, weight, intensity, duration)
  - Form feedback (if accelerometer available)

**Form Check (If Available)**
- System may use device camera to:
  - Check form quality
  - Alert if form deteriorates
  - Provide encouragement
  - Log form score
- Warning: "Form check enabled - camera will activate when ready"

**Exercise Transition**
- Between exercises, system shows:
  - Exercise completed summary
  - Preview of next exercise
  - Instructions/form tips for next exercise
  - "Start Next Exercise" button

**Workout Completion**
- System displays summary:
  - Total time: XX min
  - Total volume: XXX lbs
  - Total reps: XXX
  - Estimated calories: XXX
  - Exercises completed: X/Y
  - Difficulty rating: [1-10 input]
- System offers:
  - "Rate This Workout" (optional)
  - "View Summary" (detailed stats)
  - "Save and Finish" (required)

### Error States - Active Workout

**Lost Connection During Workout**
- System detects no internet
- System continues logging locally (cached)
- User sees warning: "Working offline - will sync when connected"
- On completion:
  - System saves locally
  - User sees message: "Workout saved offline. Will sync: [when]"

**Invalid Input**
- User enters weight as text instead of number
- System shows error: "Weight must be a number"
- User action: Clear and re-enter
- System response: Accept valid input, enable "Log Set"

**App Crashes During Workout**
- User loses progress from last saved set
- On restart, system shows:
  - "Workout interrupted. Last saved: Exercise 2, Set 2"
  - Options:
    - "Resume from last save" → Continue workout
    - "Start over" → Clear data and restart
    - "Save current progress" → Log what was completed
- User selects option

**No Exercises in Planned Workout**
- System detects invalid workout data
- System shows error: "This workout has no exercises"
- Options:
  - "Create Quick Workout" → Log freeform
  - "Select Different Workout" → Browse library
  - "Return to Dashboard" → Exit flow

**Timer/Sensor Malfunction**
- If device can't track elapsed time:
  - System shows message: "Unable to track time"
  - Manual time entry option: User enters duration
- User enters estimated duration in minutes
- System continues normally

### System Responses - Success Path

**Workout Saved Successfully**
- System displays completion screen:
  - Checkmark icon
  - Message: "Workout logged successfully!"
  - Summary stats:
    - Duration
    - Calories burned
    - Volume
    - Exercises completed
  - Options:
    - "View Details" → Show full workout summary
    - "Go to Dashboard" → Return to main screen
    - "Log Another Workout" → Start Flow 3 again

**Data Synced to Server**
- System logs workout data:
  - User ID
  - Plan ID
  - Workout date/time
  - All sets, reps, weights
  - Duration
  - Notes
  - Difficulty rating
- System updates:
  - Workout history
  - Statistics (weekly/monthly)
  - Progress tracking
  - Nutrition sync (calories burned info available)

**Notification Updates**
- System creates notification: "Great job completing your workout!"
- System updates:
  - Workout streak (if daily consecutive)
  - Achievement badges (if milestone hit)
  - Progress chart (new data point)

### Exit State
- Workout logged successfully → Dashboard or Stats view
- User cancelled mid-workout → Offer to save partial
- User skipped workout → Return to dashboard
- User clicks back → Confirm "Discard unsaved progress?"

---

## FLOW 4: TRACKING PROGRESS OVER TIME

### Entry Point
- User clicks "View Progress" or "My Stats" on dashboard
- User clicks on progress chart on dashboard
- User navigates to dedicated Progress screen
- User accesses from main navigation

### User Actions - View Overview

**Action: Select Time Period**
- System displays progress view with time period selector:
  - Options: This Week / Last Week / This Month / Last 3 Months / This Year / All Time
  - Default: This Month
- User clicks time period
- System updates all charts to selected period

**Action: View Summary Metrics**
- System displays cards with key metrics:
  - Total Workouts (count)
  - Total Duration (hours:minutes)
  - Total Volume (lbs)
  - Estimated Calories Burned (total)
  - Average Workout Duration
  - Most Frequent Exercise (e.g., "Bench Press")
  - Current Streak (days consecutive workouts)
  - Best Week (highest activity)
- User can click any metric for details

### User Actions - View Charts & Graphs

**Action: View Weekly Activity Chart**
- Chart type: Bar chart
- X-axis: Days of week (Mon-Sun)
- Y-axis: Workouts completed (count)
- Data: Number of workouts per day
- User can:
  - Click bar → View workouts that day
  - Click legend → Toggle exercise types
  - Hover → See exact values
- System shows:
  - Average line (baseline)
  - Target line (goal)
  - Actual performance

**Action: View Duration Trends**
- Chart type: Line graph
- X-axis: Weeks (or days if viewing short period)
- Y-axis: Minutes exercised
- Data: Total duration per week
- User can:
  - Click point → View detailed week
  - Zoom in/out (pinch/scroll)
  - Toggle view: Weekly/Daily
- System shows trend line (going up/down/flat)

**Action: View Calorie Burn Trends**
- Chart type: Area chart
- X-axis: Weeks or days
- Y-axis: Estimated calories burned
- Data: Calories per session or daily total
- User can:
  - Hover for values
  - Click to see workout details
  - Change aggregation: Daily/Weekly

**Action: View Exercise Frequency**
- Chart type: Horizontal bar chart
- Y-axis: Exercise names
- X-axis: Times performed
- Data: How often each exercise completed
- User can:
  - Click exercise → View all instances
  - See progression of weight/reps
  - Compare to previous period

**Action: View Strength Progression**
- Chart type: Line graph (by exercise)
- X-axis: Date of workout
- Y-axis: Weight (lbs)
- Data: Maximum weight used per session
- User can:
  - Select exercise from dropdown
  - View PR (personal record)
  - See progression slope
  - Click point → View that session

### User Actions - Detailed View

**Action: Select Specific Workout Date**
- User clicks on date in calendar or chart
- System displays workouts for that date:
  - Time completed
  - Duration
  - Exercises
  - Sets/reps/weight
  - Difficulty rating
  - Notes (if any)
- User can:
  - Click workout → View full details
  - Edit workout (if within 24 hours)
  - Delete workout
  - Share workout

**Action: View Workout Session Details**
- System displays complete workout record:
  - Date and time started/ended
  - Total duration
  - Exercise-by-exercise breakdown:
    - Exercise name
    - Sets × Reps × Weight
    - RPE for each set
    - Form rating (if available)
  - Total volume
  - Estimated calories burned
  - User notes
  - Difficulty rating (1-10)
  - Form feedback (if available)
- User options:
  - "Edit Workout" → Flow 7
  - "Delete Workout" → Confirm deletion
  - "Share Workout" → Generate shareable card
  - "Back to Progress" → Return to overview

**Action: View Personal Records (PRs)**
- System shows lifetime achievements:
  - Heaviest weight lifted per exercise
  - Most reps in single set
  - Longest workout duration
  - Most workouts in week
  - Longest active streak
  - Most calories burned in session
  - Most exercises completed in session
- User can:
  - Click PR → View full workout details
  - Filter by exercise
  - See date achieved
  - See previous PRs (e.g., "Previous: 225 lbs on Dec 15")

**Action: Compare Periods**
- User clicks "Compare Periods"
- System shows side-by-side comparison:
  - [Period 1] vs [Period 2]
  - Metrics:
    - Total Workouts: X vs Y (+Z%)
    - Total Duration: X vs Y (+Z%)
    - Total Volume: X vs Y (+Z%)
    - Avg Difficulty: X vs Y
  - Visual: Green (improvement) / Yellow (same) / Red (decline)

### System Responses - Data Loading

**Initial Load**
- System displays loading skeleton
- Message: "Loading your progress..."
- System fetches from database:
  - All logged workouts in period
  - Aggregated statistics
  - Trend calculations
  - PR data

**Data Processing**
- System calculates:
  - Total metrics (duration, volume, reps)
  - Averages (per week, per workout)
  - Trends (linear regression for trend lines)
  - PRs (max values for each metric/exercise)
  - Streaks (consecutive workout days)

**Data Visualization**
- System renders charts using data
- Charts are interactive:
  - Hover shows values
  - Click shows details
  - Can zoom/pan
  - Responsive to screen size

### Error States - Progress View

**No Data for Selected Period**
- System displays message: "No workouts in [Period]"
- Options:
  - "Select Different Period"
  - "Create Workout" → Flow 3
  - Show previous period (e.g., "Last week had 3 workouts")

**Data Sync Failed**
- System shows warning: "Some data may be outdated"
- Message: "Last synced: X hours ago"
- Options:
  - "Retry Sync" button
  - "View Cached Data" (continue with old data)

**Chart Rendering Error**
- System detects chart can't render
- System shows fallback: Data in table format
- Message: "Unable to display chart, showing data table"
- User can still view all data

**Insufficient Data for Trend**
- System shows message: "Need at least 2 workouts to show trends"
- Shows available data (single data point)
- Prompts: "Complete more workouts to see trends"

### Exit State
- User goes back to Dashboard → Returns to Flow 1
- User selects specific workout → Flow 7 (edit) or view details
- User clicks "View Goals" → Flow 5
- User navigates away → Save view preferences (time period)

---

## FLOW 5: VIEWING GOALS AND MILESTONES

### Entry Point
- User clicks "Goals & Milestones" from dashboard
- User clicks "View Goals" navigation
- User is prompted to set initial goals
- Goals are visible on dashboard widget
- User accesses dedicated Goals screen

### User Actions - View Current Goals

**Action: Load Goals Screen**
- System displays goals dashboard with sections:
  - Active Goals (currently pursuing)
  - Completed Goals (achieved)
  - Upcoming Milestones (on track)
  - Off-Track Goals (falling behind)

**Action: View Goal Card**
- Each goal displays:
  - Goal name (e.g., "Bench Press 315 lbs")
  - Goal type (Strength/Cardio/Weight Loss/Consistency)
  - Target value
  - Current value
  - Progress bar (% complete)
  - Time remaining
  - Status: On Track / At Risk / Off Track
  - Last updated: [date]

**Action: Expand Goal Details**
- User clicks goal card
- System displays:
  - Goal name and description
  - Target: [value]
  - Current: [value]
  - Progress: [X]%
  - Start date: [date]
  - Target completion: [date]
  - Days remaining: [X]
  - How to achieve:
    - Key metric (e.g., "Add 10 lbs per week")
    - Suggested frequency (e.g., "Bench Press 2x/week")
    - Estimated timeline if current pace maintained
  - Recent progress (last 5 workouts toward goal)
  - Insights (e.g., "You're 2% behind pace, but only by 1 workout")

**Action: View Milestone Breakdown**
- For complex goals, view milestone steps:
  - Milestone 1: Bench Press 275 lbs (Due: Jan 15)
  - Status: Achieved ✓
  - Milestone 2: Bench Press 295 lbs (Due: Feb 15)
  - Status: In Progress (at 290)
  - Milestone 3: Bench Press 315 lbs (Due: Mar 15)
  - Status: Not Started
- User can click milestone → See workouts contributing to it

### User Actions - Create New Goal

**Action: Start Goal Creation**
- User clicks "Create New Goal" button
- System shows goal creation form:
  - Goal Type dropdown: Strength / Endurance / Weight Loss / Muscle Gain / Consistency
  - Goal Name: [text input]
  - Target Value: [numeric input]
  - Target Date: [date picker]
  - Unit: [dropdown] (lbs / reps / km / minutes / workouts / etc.)

**Action: Select Goal Type**
- User clicks "Goal Type"
- Options displayed:
  - **Strength:** Increase max weight on specific exercise
  - **Cardio:** Improve endurance (run/bike distance or duration)
  - **Weight Loss:** Reach target body weight
  - **Muscle Gain:** Reach target body weight (with muscle)
  - **Consistency:** Complete X workouts per week
  - **Flexibility:** Achieve target range of motion
  - **Habit:** Complete specific exercise X times per week
  - **Custom:** User-defined goal
- User selects type

**Action: Define Goal Specifics**
- Based on type selected, system shows relevant inputs:
  - **Strength Goal:**
    - Exercise: [dropdown] (e.g., "Bench Press")
    - Current: [auto-filled from PR] (e.g., 275 lbs)
    - Target: [user enters] (e.g., 315 lbs)
  - **Cardio Goal:**
    - Activity: [dropdown] (Run/Bike/Swim/etc.)
    - Metric: Distance or Duration
    - Current: [auto-filled]
    - Target: [user enters]
  - **Weight Loss Goal:**
    - Current Weight: [auto-filled from profile]
    - Target Weight: [user enters]
  - **Consistency Goal:**
    - Target Workouts Per Week: [user enters] (2-7)
    - Type: Any / Strength only / Cardio only / etc.
  - **Custom Goal:**
    - Goal Name: [text]
    - Description: [text]
    - Target: [numeric]
    - Unit: [text]

**Action: Set Target Date**
- User clicks "Target Date" field
- Calendar picker appears
- System calculates timeline based on goal:
  - Suggested date based on realistic pace
  - Message: "To gain 10 lbs of muscle, plan for: 16-20 weeks"
- User can:
  - Accept suggested date
  - Select custom date
  - User selects date

**Action: Review and Create**
- System displays goal summary:
  - Goal Name
  - Type
  - Current → Target
  - Days/Weeks to completion
  - Suggested action plan
- User clicks "Create Goal"
- System saves goal to database

**Action: Set Goal Notifications**
- System prompts: "Enable reminders for this goal?"
- Options:
  - Weekly progress update: On/Off
  - Reminder if falling behind: On/Off
  - Encouragement notifications: On/Off
- User adjusts preferences
- System saves preferences

### User Actions - Track Goal Progress

**Action: Auto-Update Progress**
- System automatically updates goals when workouts logged:
  - Strength goals: Update max for exercise
  - Cardio goals: Update distance/time
  - Weight loss: Update from weight log (manual)
  - Consistency: Count workouts toward goal
  - Habit: Count specific exercises toward goal
- User sees progress update notifications

**Action: Manually Log Progress (For Non-Workout Goals)**
- For weight loss goals: User clicks "Log Weight"
- System shows form: Weight [input] + Date
- User enters current weight
- System updates goal progress
- If weight increases: Display message: "Weight up 1 lb. Still on track!"

**Action: View Goal Insights**
- System analyzes goal progress and shows insights:
  - "You're 5% ahead of pace!"
  - "You haven't done Bench Press in 4 days. Complete 2 sessions this week to stay on track."
  - "Your pace has slowed 10% this week. Continue at current pace to reach 315 lbs by Mar 15."
  - "You're likely to reach 315 lbs on Mar 10 (5 days early!)"

**Action: Edit Goal**
- User clicks "Edit Goal" (if goal not started or just started)
- System shows form with current values:
  - Can change target value
  - Can change target date
  - Cannot change goal type
- User updates values
- System saves changes
- System recalculates pace and milestones

**Action: Mark Goal as Achieved**
- When target is reached, system shows:
  - Celebration screen with congratulations
  - Achievement badge earned
  - Option: "Create Next Goal"
- If user manually achieved: Can click "Complete Goal" button
- System records completion and moves goal to "Completed" section

**Action: Pause or Delete Goal**
- User clicks menu → "Pause Goal" or "Delete Goal"
- System confirms action: "Are you sure? This can't be undone."
- User confirms
- Goal moved to "Paused" or deleted
- System stops sending notifications for goal

### System Responses - Goal Notifications

**Goal Progress Update**
- When workout logged toward goal:
  - Notification: "You're 10% closer to Bench Press 315!"
  - Shows current progress: "290 / 315 lbs"
  - Shows pace: "On track to reach goal by Mar 10"

**Goal Achieved**
- When user reaches goal target:
  - Big celebration notification
  - Message: "Congratulations! You reached 315 lbs Bench Press!"
  - Shows achievement badge
  - Shows time to completion: "Completed in 12 weeks"
  - Prompt: "Set new goal?"

**Goal At Risk**
- If user falls behind on pace:
  - Warning notification: "Your goal is at risk"
  - Detail: "You're 1 week behind. Do 2 more Bench Press sessions to get back on track."
  - Shows "View Detailed Breakdown"

**Goal Milestone Achieved**
- When completing a milestone:
  - Notification: "Milestone reached: Bench Press 290!"
  - Shows next milestone: "Next: 295 lbs (Due: Feb 22)"

### Error States - Goals

**Invalid Target**
- User enters target less than current value
- System shows error: "Target must be higher than current"
- User corrects value

**Date in Past**
- User selects target date in past
- System shows error: "Date must be in future"
- User selects different date

**Unrealistic Pace**
- User sets extreme goal with tight timeline
- System shows warning: "This requires gaining 10 lbs/week (very aggressive)"
- Options:
  - "Accept Challenge" → Continue with goal
  - "Adjust Goal" → Change target or date

**Goal Type Not Applicable**
- User selects "Strength" goal but no primary exercise
- System shows message: "Please select exercise first"
- User cannot complete goal creation

**Weight Not Entered**
- User tries to create weight loss goal without weight
- System shows message: "Log weight in profile first"
- System offers: "Go to Profile" or "Continue Without Weight (manual tracking)"

### Exit State
- Goal created successfully → Show on dashboard
- Goal viewed → Return to Goals list
- Goal achieved → Celebration, prompt for next goal
- User navigates back → Returns to Dashboard

---

## FLOW 6: LINKING FITNESS DATA TO NUTRITION (READ-ONLY)

### Entry Point
- User is viewing Fitness Dashboard
- User clicks "View Nutrition Impact" or "See Recommended Macros"
- User is in Fitness module and navigates to Nutrition
- User logged a workout and wants to see nutrition adjustment
- System proactively suggests nutrition review after workout

### User Actions - View Nutrition Connection

**Action: Click Nutrition Link**
- From Fitness Dashboard, user clicks:
  - "Nutrition" button in navigation
  - "View Recommended Macros" link
  - "Update Meal Plan" suggestion card
- System loads Nutrition Module in read-only mode

**Action: View Activity-Based Recommendations**
- Nutrition Module displays:
  - Last 7 days of fitness activity summary:
    - Total workouts: X
    - Total calories burned: XXX
    - Types of workouts: Y strength, Z cardio
    - Activity level detected: Light / Moderate / Heavy
  - Current daily calorie target (from meal plan)
  - Adjusted target based on today's activity:
    - "You completed 45 min workout (burned ~300 cal)"
    - "Recommended intake: 2,200 cal (200 extra from activity)"
  - Current macros on meal plan
  - Recommended macros based on fitness profile:
    - Strength training → Higher protein (25-30% of calories)
    - Cardio training → Higher carbs (45-50% of calories)
    - Mixed training → Balanced (40/30/30)

**Action: View Today's Post-Workout Meal**
- If user logged workout today, system shows:
  - Post-workout meals suggested by Nutrition Module
  - Meal recommendations timed for recovery:
    - Protein + carbs within 30-60 min of workout
    - Example: "Grilled chicken + brown rice"
    - Macros for this meal vs daily targets
  - Timing suggestion: "Complete workout at 5pm → Eat by 5:30pm"

**Action: View Weekly Nutrition Plan**
- User can view meal plan for the week
- System highlights recommendations for fitness:
  - Heavier meals on workout days
  - Lighter meals on rest days
  - High protein meals after strength training
  - High carb meals before cardio
- Meals shown with:
  - Name
  - Macros (protein/carbs/fats)
  - Calories
  - How it supports current fitness goals

**Action: View Micro-Nutrient Recommendations**
- Based on fitness activity, Nutrition Module displays:
  - Hydration recommendation (based on activity level)
  - Electrolyte needs (for cardio days)
  - Iron intake (for endurance training)
  - Magnesium (for recovery)
  - Timing of nutrient intake around workouts

### System Actions - Calculate Calorie Adjustments

**Fetch Fitness Data**
- System queries Fitness Module APIs:
  - GET /api/fitness/stats (current period)
  - Retrieves:
    - Total workouts (current week)
    - Total duration (minutes)
    - Total calories burned
    - Workout types (strength/cardio/flexibility)
    - Most recent workout (date/time/intensity)
  - Calculates:
    - Daily average activity
    - Weekly activity level (sedentary/light/moderate/heavy/very heavy)

**Calculate Calorie Impact**
- System uses fitness data to determine:
  - Daily activity multiplier (1.2 - 1.5 depending on level)
  - Workout-specific calorie burn:
    - Strength training: Higher after-burn (24-48 hours)
    - Cardio: Immediate burn + small after-burn
    - Flexibility: Low burn (maintenance focus)
  - Total daily energy expenditure (TDEE):
    - Base TDEE × activity multiplier = adjusted TDEE
  - Recommended calorie intake:
    - Goal-based (weight loss/gain/maintain) + TDEE

**Determine Macro Recommendations**
- System adjusts macro ratios based on fitness profile:
  - Strength focus (2+ strength sessions/week):
    - Protein: 25-30% (support muscle growth)
    - Carbs: 40-45% (fuel workouts)
    - Fats: 25-30% (hormones)
  - Cardio focus (2+ cardio sessions/week):
    - Protein: 20-25% (maintain muscle)
    - Carbs: 45-50% (fuel endurance)
    - Fats: 25-30% (fuel source)
  - Balanced (mix of both):
    - Protein: 25% (40/30/30 rule)
    - Carbs: 35-40%
    - Fats: 25-30%

**Generate Meal Suggestions**
- System calls Nutrition Module to suggest meals:
  - Matching new macro requirements
  - Timed appropriately (pre/post-workout)
  - Respecting dietary restrictions
  - Similar to user's meal history

### System Responses - Data Display

**Loading Nutrition Data**
- If Nutrition Module takes time to load:
  - Show loading skeleton
  - Message: "Loading nutrition recommendations..."
  - Show previously cached data if available

**Displaying Recommendations**
- Present data in clear format:
  - Cards with macro targets
  - Visual bars showing current vs recommended
  - Color coding (green = met, yellow = close, red = far off)
  - Text explanations in plain language

**Updates After Workout**
- When user completes workout (Flow 3):
  - System recalculates nutrition recommendations
  - Shows notification: "Your nutrition targets updated based on today's workout"
  - Offers: "View Updated Meal Plan"
  - Provides quick macro summary

### Important: READ-ONLY Access

**What User CANNOT Do in This View**
- Cannot modify meal plan (must go to Nutrition Module)
- Cannot change meal recipes
- Cannot override calorie targets
- Cannot log food intake (not in Fitness Module)
- Cannot create shopping list (not in Fitness Module)

**What User CAN Do**
- View calculations and recommendations
- See how fitness affects nutrition
- Click "Go to Nutrition Module" to make changes
- Share recommendations with others
- View historical nutritional data (view-only)

**Navigation to Nutrition Module**
- User clicks "Edit Meal Plan" or "Update Macros"
- System navigates to Nutrition Module (separate app)
- Nutrition Module is aware of fitness recommendations
- User can modify plan based on fitness insights
- Upon return to Fitness, data updates reflect Nutrition changes

### Error States - Nutrition Link

**Nutrition Data Unavailable**
- Fitness Module cannot reach Nutrition API
- System shows message: "Unable to load nutrition data"
- Options:
  - "Retry" → Try fetching again
  - "Go to Nutrition Module" → Navigate directly
  - "Continue in Fitness" → Stay in fitness view
- Show previously cached data if available

**User Has No Meal Plan**
- User hasn't created meal plan yet
- System shows message: "Create a meal plan to see personalized nutrition recommendations"
- Offers: "Create First Meal Plan" button
- Shows basic nutrition guidelines in meantime

**Conflicting Data**
- Fitness data and Nutrition data don't align (shouldn't happen but error handling)
- System shows: "Data inconsistency detected"
- Options:
  - "Sync Data" → Force refresh both modules
  - "Use Fitness Data" → Use fitness calculations
  - "Use Nutrition Data" → Use nutrition module calculations
- Support button: "Report Issue"

**Insufficient Fitness Data**
- User has logged <2 workouts
- System shows message: "Log more workouts for personalized recommendations"
- Shows generic nutrition guidelines
- Offers: "Create First Workout" or "Log Workout"

### Exit State
- User goes to Nutrition Module → Leaves Fitness App
- User returns to Fitness Dashboard → Closes nutrition view
- User clicks back → Returns to previous Fitness screen
- User clicks "Update Plan" → Opens Nutrition Module

---

## FLOW 7: EDITING OR DELETING LOGGED WORKOUTS

### Entry Point
- User is viewing Progress (Flow 4)
- User clicks on specific workout to view details
- User is on Workout Summary screen after completion
- User accesses workout history
- User searches for past workout and wants to modify

### User Actions - Access Workout

**Action: Navigate to Workout**
- User navigates to progress screen → clicks workout date
- Or: User scrolls workout history → clicks specific workout
- Or: User searches for workout by date/name
- System loads workout details screen with all logged data

**Action: View Workout Summary**
- System displays complete workout record:
  - Date and time (e.g., "Dec 20, 2025 5:00 PM")
  - Duration: XX minutes
  - Exercise list with all sets/reps/weights:
    - Exercise 1: Bench Press
      - Set 1: 8 reps @ 275 lbs
      - Set 2: 8 reps @ 275 lbs
      - Set 3: 7 reps @ 275 lbs
    - Exercise 2: Squats
      - Set 1: 10 reps @ 315 lbs
      - Etc.
  - Total volume: XXX lbs
  - Difficulty rating: X/10
  - Notes: [any notes entered]
  - RPE (Rate of Perceived Exertion): X/10
  - Estimated calories: XXX
  - Status: Completed / Partial / Skipped

**Action: Enter Edit Mode**
- User clicks "Edit Workout" button
- System validates:
  - Is workout within 24 hours? (Can only edit recent workouts)
  - Is user the owner? (Can only edit own workouts)
- If valid:
  - System enables edit mode
  - All fields become editable
  - Save and Cancel buttons appear
- If invalid:
  - System shows message: "Workouts can only be edited within 24 hours"
  - Or: "You don't have permission to edit this workout"
  - Disable edit option

### User Actions - Edit Workout Data

**Action: Edit Exercise Sets/Reps/Weight**
- User clicks on set row to edit:
  - Reps field → User changes value (e.g., 8 → 10)
  - Weight field → User changes value (e.g., 275 → 280)
  - RPE field → User adjusts perception (e.g., 7 → 8)
- System validates:
  - Reps: 1-100
  - Weight: 0-1000 lbs
  - RPE: 1-10
- User clicks out of field or "Save"
- System updates value in real-time

**Action: Remove Set**
- User clicks "Remove Set" button next to set
- System confirms: "Delete this set?"
- User confirms
- System removes set from workout
- System recalculates:
  - Total volume (sets × reps × weight)
  - Estimated calories
  - Exercise difficulty

**Action: Add Set**
- User clicks "Add Set" button for exercise
- System adds new row with previous set's values pre-filled
- User edits:
  - Reps performed
  - Weight used
  - RPE
- System saves new set

**Action: Change Exercise**
- User realizes wrong exercise was logged
- User clicks "Change Exercise" for that exercise
- System shows exercise selector:
  - List of exercises in this workout
  - Or browse library
- User selects new exercise
- System swaps exercise but keeps all data
- User can adjust if needed

**Action: Edit Workout Duration**
- User clicks "Duration" field
- System shows time picker or numeric input
- User adjusts duration (e.g., 45 min → 50 min)
- System recalculates:
  - Estimated calories (if duration-based)
  - Intensity (duration vs effort)

**Action: Edit Difficulty Rating**
- User clicks "Difficulty" rating (1-10 scale)
- System shows slider or number input
- User adjusts rating
- System saves new rating
- Provides feedback: "That was harder than expected!"

**Action: Edit Notes**
- User clicks "Notes" field
- System shows text editor
- User updates notes (e.g., "Was very tired today, but pushed through")
- System saves notes

**Action: Edit Date/Time**
- User clicks "Date" or "Time" field
- System shows date/time picker
- User changes date/time
- System validates:
  - Cannot be in future
  - Can only edit if within 24 hours (for recent workouts)
  - Otherwise shows message: "Cannot change date for old workouts"

### System Responses - Editing

**Real-Time Calculation**
- As user edits values, system recalculates:
  - Total volume for exercise
  - Total volume for workout
  - Estimated calories burned
  - Exercise progression (if strength training)
  - Updated stats preview

**Field Validation**
- As user types:
  - Invalid characters: Show error (e.g., "letters in reps field")
  - Out of range: Show warning (e.g., "Very high weight, unusual")
  - Required fields: Show "Required" message if empty

**Unsaved Changes Warning**
- If user has made changes and tries to navigate away:
  - System shows modal: "You have unsaved changes. Save?"
  - Options: "Save" / "Discard" / "Continue Editing"

### User Actions - Delete Workout

**Action: Delete Entire Workout**
- User clicks "Delete Workout" button
- System shows confirmation modal:
  - "Permanently delete this workout?"
  - Message: "This action cannot be undone"
  - Shows workout being deleted: "[Bench Press + Squats on Dec 20]"
  - Options: "Delete" / "Cancel"
- User clicks "Delete"
- System performs deletion:
  - Removes workout from database
  - Updates stats/progress
  - Removes associated streaks/achievements if applicable
  - Returns success confirmation: "Workout deleted"

**Action: Delete Single Exercise from Workout**
- User clicks "Remove Exercise" for one exercise
- System shows confirmation:
  - "Remove [Exercise Name] from this workout?"
  - Shows all sets for this exercise
  - Options: "Remove" / "Cancel"
- User confirms
- System removes exercise but keeps other exercises
- Updates totals (volume, calories, duration)

**Action: Cancel Edit**
- User clicks "Cancel" button while editing
- If no changes: Return to workout view
- If has changes: Show confirmation: "Discard unsaved changes?"
  - Options: "Discard" / "Continue Editing"
- User selects option

### System Responses - Deletion

**Deletion Success**
- System displays confirmation: "Workout deleted successfully"
- System removes workout from:
  - Workout history
  - Progress calculations
  - Calendar view
  - Streak counter (if applicable)
  - Statistics (recalculated without this workout)
- System navigates back to:
  - Progress view or
  - Workout history or
  - Dashboard

**Impact on Streaks/Achievements**
- If workout being deleted affects streaks:
  - System shows message: "This deletion will reset your 5-day streak"
  - Allows user to review impact before confirming
- If workout being deleted affects badges/achievements:
  - System shows message: "You'll lose the 'Perfect Week' badge"
  - User must confirm deletion anyway

**Stats Recalculation**
- System updates all affected metrics:
  - Weekly total workouts
  - Total duration
  - Total volume
  - Progress charts
  - Goal progress (if any goals affected)
  - Calorie totals
- Shows updated stats: "Updated stats: 6 workouts this week (was 7)"

### Error States - Edit/Delete

**Workout Already Synced**
- Workout was uploaded >24 hours ago
- System shows message: "This workout is archived and cannot be edited"
- Options:
  - "View Workout Details" (read-only)
  - "Log New Workout" (create replacement)
  - Contact support if error

**Concurrent Edit Conflict**
- User edited on phone, changes are being synced
- On tablet (or another device), user tries to edit same workout
- System shows: "Workout has changed. Refresh to see latest?"
- Options: "Refresh" / "Discard My Changes" / "Keep My Changes"

**Partial Edit Rejection**
- User tries to edit but one field has validation error
- System highlights error field
- Message: "Cannot save: Weight field invalid (must be number)"
- User fixes error and tries again

**Permission Denied**
- User somehow tries to edit workout they don't own
- System shows: "You don't have permission to edit this workout"
- No edit option available

**Network Error During Save**
- User clicks "Save" but network fails
- System shows error: "Unable to save changes"
- Options:
  - "Retry" → Try again
  - "Save Offline" → Cache locally, sync later
  - "Discard" → Lose changes
- User selects option

**Network Error During Delete**
- User confirms deletion but network fails
- System shows: "Unable to delete workout"
- Options:
  - "Retry" → Try again
  - "Continue Offline" → Delete locally, sync later
  - "Cancel" → Keep workout

### Exit State
- Workout successfully edited → Return to progress view or dashboard
- Workout successfully deleted → Return to history or dashboard
- User cancelled edit → Return to workout details (unmodified)
- User navigated away → Prompted to save/discard changes

---

## SUMMARY: FLOW ENTRY/EXIT POINTS

### Flow Connections Map

```
FLOW 1: Dashboard
├─→ FLOW 2: Create Plan
│   └─→ FLOW 3: Log Workout (first)
├─→ FLOW 3: Log Workout
│   └─→ FLOW 4: View Progress
├─→ FLOW 4: View Progress
│   ├─→ FLOW 7: Edit/Delete Workout
│   └─→ FLOW 5: View Goals
├─→ FLOW 5: View Goals
│   └─→ Create new goal → FLOW 5 (cyclic)
├─→ FLOW 6: Nutrition Link
│   └─→ Nutrition Module (external)
└─→ AppSwitchboard (exit Fitness)
```

### Entry Points Summary

| Flow | Primary Entry | Secondary Entries |
|------|---------------|------------------|
| **1** | AppSwitchboard "Fitness" | Navigation from other flows |
| **2** | Dashboard "Create Plan" | Empty state prompt |
| **3** | Dashboard "Log/Start Workout" | Notification, scheduled workout |
| **4** | Dashboard "View Progress" | Progress chart click |
| **5** | Dashboard "View Goals" | Goal widget click |
| **6** | Dashboard "Nutrition" button | Link in fitness data |
| **7** | Progress → workout click | Workout summary screen |

### Exit Points Summary

| Flow | Primary Exit | Secondary Exits |
|------|--------------|-----------------|
| **1** | Any flow (2-6) or AppSwitchboard | Logout |
| **2** | Flow 3 or Dashboard | Cancel |
| **3** | Dashboard or Flow 4 | Cancel (partial save) |
| **4** | Flow 5 or Flow 7 or Dashboard | Back navigation |
| **5** | Dashboard or create new goal | Back navigation |
| **6** | Nutrition Module or Fitness Module | Back navigation |
| **7** | Flow 4 or Dashboard | Back navigation |

---

**End of User Flows Document**

*Prepared for implementation reference. No code changes at this stage.*
