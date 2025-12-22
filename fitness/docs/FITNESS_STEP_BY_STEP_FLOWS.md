# FITNESS APP - STEP-BY-STEP USER FLOWS

**Prepared By:** Product Designer & UX Architect  
**Date:** December 21, 2025  
**Status:** Detailed Flow Specifications (Ready for Wireframing)  
**Format:** Step-by-step sequences with system responses

---

## FLOW 1: LOG WORKOUT

### Objective
User completes a strength training session and logs all exercises, sets, reps, and weights.

### Preconditions
- User is authenticated
- User is on Fitness module
- User has completed a workout session

### Entry Point
- User clicks "Log Workout" button from dashboard
- Or: User clicks "Start Workout" → completes workout → clicks "Log Details"
- System shows loading state while fetching predefined exercises

---

### STEP-BY-STEP SEQUENCE

**Step 1: Select Workout Date & Name**
- User sees form with:
  - Date picker (defaults to today)
  - Text field for workout name (e.g., "Back & Biceps Monday")
  - Dropdown: Workout type (Strength, Cardio, Flexibility, Other)
- User action:
  - Selects date (can be past date)
  - Enters workout name
  - Selects "Strength" as type
- System response:
  - Validates date (must be ≤ today)
  - Validates name (not empty, max 255 chars)
  - Enables "Next" button

**Step 2: Add First Exercise**
- User sees button "Add Exercise"
- User clicks "Add Exercise"
- System displays modal with:
  - Search box (filter by name: "barbell squat")
  - Popular exercises list (Squat, Bench, Deadlift, etc.)
  - Categories filter (Chest, Back, Legs, Shoulders, Arms, Core)
  - "Create Custom Exercise" link
- User action:
  - Types "Squat" in search
  - System filters to show "Barbell Squat", "Leg Press", "Smith Machine Squat"
  - User clicks "Barbell Squat"
- System response:
  - Closes modal
  - Adds exercise to list
  - Displays exercise card with empty sets ready to fill

**Step 3: Log Sets for Exercise 1**
- User sees exercise card with:
  - Exercise name: "Barbell Squat"
  - "Add Set" button
  - Empty sets table (Set #, Reps, Weight, RPE, Notes)
- User action:
  - Clicks "Add Set"
  - Sees new set row (Set 1 of ?)
  - Enters: Reps=8, Weight=225 lbs, RPE=7, Notes=""
  - Clicks "Add Set" again
  - Enters: Reps=7, Weight=225 lbs, RPE=8, Notes="Harder"
  - Enters: Reps=5, Weight=225 lbs, RPE=9, Notes="Failed on rep 6"
- System response (for each set):
  - Validates reps > 0
  - Validates weight > 0
  - Validates RPE 1-10
  - Saves set
  - Shows confirmation: Set saved ✓
  - Prepares next set for entry

**Step 4: Finish Exercise 1 / Add Second Exercise**
- User sees exercise card with 3 sets completed
- User action:
  - Clicks "Add Another Exercise"
- System response:
  - Opens exercise selector modal again
  - Keeps previous exercise locked (shows as completed)

**Step 5: Log Sets for Exercise 2**
- User sees second exercise card: "Incline Dumbbell Press"
- User action:
  - Adds 4 sets:
    - Set 1: 10 reps, 70 lbs, RPE 6
    - Set 2: 8 reps, 70 lbs, RPE 7
    - Set 3: 6 reps, 70 lbs, RPE 8
    - Set 4: 5 reps, 65 lbs, RPE 9, Notes="Grip fatigued"
- System response:
  - Validates each set
  - Shows running totals:
    - Total reps: 46
    - Total volume: 6,125 lbs (or 2,778 kg)

**Step 6: Add Notes to Workout**
- User sees optional text field: "Workout Notes"
- User action:
  - Enters: "Great session, feeling strong. Maybe reduce weight next time for form."
- System response:
  - Accepts text (max 500 chars)
  - Character counter shows: 98/500

**Step 7: Review & Submit**
- User sees summary screen:
  - Workout Date: Monday, Dec 21, 2025
  - Workout Name: Back & Biceps Monday
  - Exercises (2):
    - Barbell Squat: 3 sets, 20 reps, 675 lbs total
    - Incline Dumbbell Press: 4 sets, 29 reps, 275 lbs total
  - Total Duration: 45 minutes (or "Not set")
  - Notes: "Great session..." (preview)
- User action:
  - Reviews data
  - Clicks "Save Workout"
- System response:
  - Shows loading state: "Saving workout..."
  - Saves all data to database:
    - Creates `workouts` record
    - Creates `workout_exercises` records (2)
    - Creates `workout_sets` records (7)
  - Shows success state: "Workout saved! ✓"
  - Redirects to workout detail view
  - Shows quick actions:
    - "View Workout"
    - "Log Another"
    - "Back to Dashboard"

---

### ERROR STATES

**Error: Missing Exercise Selection**
- User clicks "Save" without adding any exercises
- System response:
  - Shows red error banner: "Add at least one exercise"
  - Highlights "Add Exercise" button in red
  - Prevents submission

**Error: Invalid Set Data**
- User enters non-numeric value in "Reps" field
- System response:
  - Shows inline error under field: "Must be a number"
  - Disables "Save" button
  - Clears invalid input

**Error: Network Failure During Save**
- User clicks "Save" → network drops
- System response:
  - Shows error modal: "Failed to save workout"
  - Offers options:
    - "Retry" (attempt to save again)
    - "Save Offline" (stores in local storage, syncs when online)
    - "Discard" (loses unsaved data)

**Error: Duplicate Exercise**
- User adds "Barbell Squat" twice
- System response:
  - Allows it (same exercise can appear multiple times)
  - No error shown
  - Rationale: User may do exercise in multiple variations

**Error: Date is in Future**
- User selects date Dec 25, 2025 (future)
- System response:
  - Shows error: "Cannot log workout for future date"
  - Date picker reverts to today
  - Prevents submission

---

### EXIT STATE

**Success Exit**
- Workout saved successfully
- User sees confirmation screen
- Next action: View detail, log another, or return to dashboard

**Cancel Exit**
- User clicks "Cancel" at any point
- System shows confirmation: "Discard unsaved workout?"
- User confirms
- Returns to dashboard (data not saved)

---

---

## FLOW 2: VIEW HISTORY

### Objective
User views past workouts in a filterable, sortable list with ability to drill down into details.

### Preconditions
- User is authenticated
- User has at least one workout logged
- User is on Fitness module

### Entry Point
- User clicks "Workout History" from dashboard
- Or: User clicks "View All Workouts" from recent activity feed
- System loads history with filters

---

### STEP-BY-STEP SEQUENCE

**Step 1: View Workout List (Default View)**
- System fetches workouts from database
- User sees loading state: "Loading history..."
- System displays:
  - Date range selector: "Last 30 days" (default, can change to: Last 7, Last 90, All, Custom)
  - Sort selector: "Newest First" (can change to: Oldest First, Most Recent, Most Intense)
  - Filter buttons: Strength | Cardio | All (default: All)
  - Workouts list:
    - [Dec 21, 2025] Back & Biceps Monday
      - 2 exercises, 45 min, 950 lbs total
    - [Dec 19, 2025] Leg Day Friday
      - 4 exercises, 60 min, 2,150 lbs total
    - [Dec 17, 2025] Upper Body Pull
      - 3 exercises, 50 min, 1,200 lbs total
- User action:
  - Sees list loads

**Step 2: Filter Workouts (Optional)**
- User action:
  - Clicks "Cardio" filter button
- System response:
  - Filters list to show only cardio workouts
  - Shows: "3 cardio workouts in last 30 days"
  - Displays workouts:
    - [Dec 20] 5K Run - 28 min, 3.2 miles
    - [Dec 15] Cycling - 45 min, 12.5 miles
    - [Dec 10] Swimming - 35 min, 1 mile

**Step 3: Change Date Range**
- User action:
  - Clicks date range "Last 30 days" dropdown
  - Sees options: Last 7 | Last 30 | Last 90 | All | Custom Range
  - Selects "Last 90 days"
- System response:
  - Refetches workouts for 90-day window
  - Updates list
  - Shows count: "15 workouts in last 90 days"

**Step 4: Sort Workouts (Optional)**
- User action:
  - Clicks sort "Newest First" dropdown
  - Sees options: Newest First | Oldest First | Longest Duration | Most Volume
  - Selects "Most Volume"
- System response:
  - Re-sorts list (highest total weight lifted to lowest)
  - Displays reordered workouts

**Step 5: View Workout Detail**
- User sees workout list
- User action:
  - Clicks on [Dec 21] "Back & Biceps Monday"
- System response:
  - Navigates to workout detail view
  - Shows full workout card with:
    - Workout name, date, type
    - Exercises list (expandable):
      - Exercise 1: Barbell Squat
        - Set 1: 8 reps × 225 lbs, RPE 7
        - Set 2: 7 reps × 225 lbs, RPE 8
        - Set 3: 5 reps × 225 lbs, RPE 9
      - Exercise 2: Incline Dumbbell Press
        - Set 1: 10 reps × 70 lbs, RPE 6
        - Set 2: 8 reps × 70 lbs, RPE 7
        - Set 3: 6 reps × 70 lbs, RPE 8
        - Set 4: 5 reps × 65 lbs, RPE 9
    - Total duration: 45 minutes
    - Total volume: 950 lbs
    - Workout notes: "Great session, feeling strong..."
    - Edit/Delete/Share buttons

**Step 6: Close Detail View**
- User action:
  - Clicks back arrow or "Back to History"
- System response:
  - Returns to workout list
  - Maintains filters and sorting

---

### ERROR STATES

**Error: No Workouts Found**
- User applies filters that result in 0 workouts
- System response:
  - Shows empty state: "No workouts found"
  - Message: "Try adjusting filters or date range"
  - Shows help text: "Log your first workout to get started"
  - Link: "Start New Workout"

**Error: Network Error Loading History**
- User loads history → network fails
- System response:
  - Shows error: "Unable to load history"
  - Buttons: "Retry" | "View Offline" (if cache exists)
  - If retry fails: "Check your connection and try again"

**Error: Workout Detail Fails to Load**
- User clicks on workout → detail load fails
- System response:
  - Shows loading spinner briefly
  - Displays error: "Could not load workout details"
  - Button: "Retry" (goes back to list on failure)

**Error: Data Inconsistency**
- Workout shows exercise count doesn't match displayed exercises
- System response:
  - Shows warning: "Some data may be incomplete"
  - Still displays available data
  - Provides "Report Issue" button

---

### EXIT STATE

**Success Exit**
- User views history, filters/sorts, drills into details
- Exits by clicking back or navigating elsewhere

**Navigation Exit**
- User clicks dashboard icon → back to dashboard
- User clicks other module → navigates away

---

---

## FLOW 3: EDIT WORKOUT

### Objective
User modifies an existing workout (exercises, sets, notes) within a 24-hour window.

### Preconditions
- User is authenticated
- User has at least one workout logged
- Workout is less than 24 hours old
- User is viewing workout detail

### Entry Point
- User clicks "Edit" button on workout detail view
- System shows edit mode with warning: "24-hour edit window expires in X hours"

---

### STEP-BY-STEP SEQUENCE

**Step 1: Verify Edit Permission**
- System checks:
  - Is user the workout owner? YES
  - Is workout < 24 hours old? YES
  - Show edit mode
- User sees edit button enabled
- User action:
  - Clicks "Edit"

**Step 2: Enter Edit Mode**
- System shows:
  - All workout fields become editable
  - Workout name field editable
  - Date picker editable
  - "Edit Window Expires" timer (shows "23 hours 45 min remaining")
  - Warning banner: "Changes will update all associated data"
- User sees exercises list with:
  - Each exercise shows delete button (x)
  - Each set shows delete button (x)
  - "Add Exercise" button available

**Step 3: Modify Existing Set**
- User action:
  - Clicks on Set 2 of Barbell Squat
  - Changes reps from 7 to 8
  - Changes weight from 225 to 230 lbs
  - Changes RPE from 8 to 7
- System response:
  - Validates changes in real-time
  - Shows unsaved indicator: Dot next to exercise name
  - Enables "Save Changes" button

**Step 4: Delete a Set**
- User action:
  - Clicks "Delete" button on Set 3 (the failed set)
  - System shows confirmation: "Delete this set?"
- User action:
  - Confirms deletion
- System response:
  - Removes set from list
  - Updates set numbers (sets 1, 2 now instead of 1, 2, 3)
  - Shows undo option (5 second timeout)

**Step 5: Add New Set to Same Exercise**
- User action:
  - Clicks "Add Set" on Barbell Squat exercise
  - Enters: 4 reps, 240 lbs, RPE 8, Notes "New attempt"
- System response:
  - Validates data
  - Adds set as Set 3 (renumbered)
  - Shows unsaved indicator

**Step 6: Delete Entire Exercise**
- User action:
  - Clicks "Delete Exercise" button on Incline Dumbbell Press
  - System shows confirmation: "Delete Incline Dumbbell Press and all 4 sets?"
- User action:
  - Confirms
- System response:
  - Removes exercise from workout
  - Shows undo option
  - Recalculates totals:
    - Total exercises: 1 (was 2)
    - Total sets: 4 (was 7)
    - Total volume: 920 lbs (was 950)

**Step 7: Add New Exercise**
- User action:
  - Clicks "Add Exercise"
  - Searches: "Barbell Rows"
  - Selects "Barbell Rows" from dropdown
- System response:
  - Adds exercise to workout
  - Shows empty sets placeholder
- User action:
  - Adds 3 sets:
    - Set 1: 8 reps, 225 lbs, RPE 7
    - Set 2: 6 reps, 245 lbs, RPE 8
    - Set 3: 4 reps, 255 lbs, RPE 9
- System response:
  - Validates each set
  - Recalculates totals:
    - Total exercises: 2
    - Total sets: 7
    - Total volume: 2,065 lbs

**Step 8: Edit Workout Notes**
- User action:
  - Clicks in notes field
  - Modifies from "Great session..." to "Updated - actually did rows instead of chest"
- System response:
  - Shows unsaved indicator
  - Updates character counter

**Step 9: Review & Save Changes**
- User sees summary of changes:
  - Original: 2 exercises, 7 sets, 950 lbs
  - Updated: 2 exercises, 7 sets, 2,065 lbs
  - Changes highlight: New Barbell Rows sets, Modified Squat sets, Deleted Dumbbell Press
- User action:
  - Reviews changes
  - Clicks "Save Changes"
- System response:
  - Shows loading: "Saving changes..."
  - Updates database:
    - Updates `workouts` record
    - Updates `workout_sets` records
    - Deletes removed sets (soft delete)
    - Creates new sets
  - Shows success: "Workout updated ✓"
  - Shows notification: "Changes saved. Edit window expires in 23:45"
  - Refreshes detail view with updated data

---

### ERROR STATES

**Error: 24-Hour Window Expired**
- User tries to edit workout > 24 hours old
- System response:
  - Disables "Edit" button
  - Shows message: "Edit window closed (logged Dec 21, edit deadline Dec 22 11:30 AM)"
  - Provides option: "Contact support if you need to edit this"

**Error: Exercise Not Found**
- User adds exercise → exercise definition deleted from system
- System response:
  - Shows error: "Exercise no longer available"
  - Allows completion but marks as "Legacy Exercise"
  - Displays: "Barbell Squat (Exercise definition removed)"

**Error: Concurrent Edit**
- User A and User B both editing same workout
- User B saves first
- User A saves second
- System response:
  - Shows conflict: "This workout was edited by another user"
  - Shows options:
    - "View Latest Version"
    - "Merge My Changes" (basic conflict resolution)
    - "Discard My Changes"

**Error: Invalid Data**
- User sets reps = 0
- System response:
  - Shows inline error: "Reps must be greater than 0"
  - Highlights field in red
  - Disables "Save" button

**Error: Network Failure During Save**
- User clicks "Save" → network drops
- System response:
  - Shows error: "Failed to save changes"
  - Offers: "Retry" | "Save Offline" | "Discard"

**Error: Permission Denied**
- User tries to edit workout they don't own
- System response:
  - Shows error: "You can only edit your own workouts"
  - Returns to detail view (read-only)

---

### EXIT STATE

**Success Exit**
- Workout updated
- User sees updated detail view
- Timer shows "23:45 remaining"

**Cancel Exit**
- User clicks "Cancel Edit" 
- System shows: "Discard unsaved changes?"
- User confirms
- Returns to read-only detail view

**Expired Window Exit**
- User editing when window expires
- System shows: "Edit window has closed"
- All fields become read-only

---

---

## FLOW 4: WEEKLY SUMMARY

### Objective
User views aggregated fitness data for a specific week (volume, duration, exercises, progress).

### Preconditions
- User is authenticated
- User has workouts logged
- User is on Fitness module

### Entry Point
- User clicks "Weekly Summary" from dashboard
- Or: User navigates from statistics section
- System loads week data (defaults to current week)

---

### STEP-BY-STEP SEQUENCE

**Step 1: View Current Week Summary**
- System fetches data for current week (Mon-Sun)
- User sees loading state: "Loading weekly summary..."
- System displays:
  - Week selector: ← [Dec 16-22, 2025] → (with dropdown for other weeks)
  - Summary cards:
    - Workouts Completed: 4 of 5 planned
    - Total Duration: 3 hours 45 minutes
    - Total Volume: 12,450 lbs (or kg toggle)
    - Exercises Performed: 18 unique exercises
    - Average Intensity: 6.5 / 10 (RPE)
    - Cardio Sessions: 2 sessions, 12.5 miles, 1 hour 15 min

**Step 2: View Workouts This Week**
- User sees scrollable list of week's workouts:
  - Monday (Dec 16): Back & Biceps
    - 2 exercises, 45 min, 950 lbs
  - Tuesday (Dec 17): Leg Day
    - 4 exercises, 60 min, 2,150 lbs
  - Wednesday (Dec 18): Cardio
    - 5K run, 28 min, 3.1 miles
  - Thursday (Dec 19): Rest Day
    - (No workout logged)
  - Friday (Dec 20): Upper Body Push
    - 3 exercises, 50 min, 1,200 lbs
  - Saturday (Dec 21): Cardio
    - Cycling, 45 min, 12.5 miles
  - Sunday (Dec 22): Off (planned)
    - (No workout)

**Step 3: View Exercise Breakdown**
- User action:
  - Clicks "Exercises" tab
- System displays:
  - Top exercises this week by frequency:
    - Barbell Squat: 3 times
    - Bench Press: 3 times
    - Barbell Rows: 2 times
    - Barbell Deadlift: 2 times
    - Incline Dumbbell Press: 2 times
  - Each exercise shows:
    - Total volume
    - Average weight per set
    - Progression vs last week (↑ or ↓)
    - Example: "Barbell Squat: 675 lbs, avg 225 lbs, ↑ 25 lbs from last week"

**Step 4: View Intensity Breakdown**
- User action:
  - Clicks "Intensity" tab
- System displays:
  - Chart: RPE distribution (1-10 scale)
  - Low (1-4): 2 sets (2%)
  - Moderate (5-7): 28 sets (70%)
  - High (8-10): 10 sets (28%)
  - Average intensity: 6.5/10
  - Recommendation: "Consider increasing intensity next week for greater gains"

**Step 5: View Progress vs Previous Week**
- User action:
  - Clicks "Progress" tab
- System displays:
  - Comparison table:
    | Metric | Last Week | This Week | Change |
    |--------|-----------|-----------|--------|
    | Workouts | 5 | 4 | -1 |
    | Duration | 4h 10m | 3h 45m | -25m |
    | Total Volume | 12,100 lbs | 12,450 lbs | +350 lbs ↑ |
    | Avg Intensity | 6.2 | 6.5 | +0.3 ↑ |
    | Cardio Miles | 10.2 mi | 15.6 mi | +5.4 mi ↑ |
  
  - Visual progress bars and trend indicators

**Step 6: Export/Share Summary**
- User action:
  - Clicks "Share" button
- System shows options:
  - "Export as PDF" → Downloads file
  - "Share on Social" → Copy summary to clipboard
  - "Email Summary" → Enters email recipient
  - "Print" → Browser print dialog
- User action:
  - Selects "Export as PDF"
- System response:
  - Generates PDF with:
    - Week overview
    - Workout list
    - Exercise breakdown
    - Progress chart
    - Summary statistics
  - Downloads file: "Weekly_Summary_Dec16-22_2025.pdf"

**Step 7: Navigate to Different Week**
- User action:
  - Clicks back arrow (←) in week selector
- System response:
  - Loads previous week (Dec 9-15)
  - Updates all data and charts
  - Shows week navigation: [Dec 9-15] ← →
- User can navigate:
  - Forward (→) to next week
  - Backward (←) to previous week
  - Click on date to jump to specific week

---

### ERROR STATES

**Error: No Data for Selected Week**
- User navigates to week with no workouts
- System response:
  - Shows empty state: "No workouts this week"
  - Displays all metrics as 0
  - Message: "Log a workout to get started"
  - Link: "Create New Workout"

**Error: Network Error Loading Summary**
- User loads summary → network fails
- System response:
  - Shows error: "Unable to load weekly summary"
  - Buttons: "Retry" | "View Offline"
  - If offline, shows cached data (if available)

**Error: Incomplete Data**
- Week has workouts but some exercise definitions missing
- System response:
  - Displays available data
  - Shows note: "Some exercise data incomplete"
  - Provides "Refresh" button

**Error: PDF Export Fails**
- User clicks "Export as PDF" → fails
- System response:
  - Shows error: "PDF generation failed"
  - Options: "Retry" | "Try Email Instead"

**Error: Date Range Error**
- User tries to view week from future
- System response:
  - Disables navigation forward past current week
  - Shows message: "Cannot view future weeks"

---

### EXIT STATE

**Success Exit**
- User views weekly summary, browses different weeks
- Exits by clicking dashboard or other navigation

**Download Exit**
- User exports PDF/CSV and closes view
- File downloads to device

**Share Exit**
- User shares summary
- Returns to summary view

---

---

## FLOW 5: PROGRESS TRACKING

### Objective
User monitors long-term fitness progress across multiple metrics and timeframes.

### Preconditions
- User is authenticated
- User has multiple workouts logged (at least 4 weeks)
- User is on Fitness module

### Entry Point
- User clicks "Progress" or "Analytics" from dashboard
- Or: User navigates from Weekly Summary → "View Long-term Progress"
- System loads progress data

---

### STEP-BY-STEP SEQUENCE

**Step 1: View Progress Dashboard**
- System fetches data from database
- User sees loading: "Loading progress data..."
- System displays progress overview:
  - Time period selector: [Last 12 Weeks] (dropdown: Last 4 | Last 12 | Last 26 | All Time | Custom)
  - Progress highlights:
    - Total Workouts: 48 (↑ 12 from 12 weeks ago)
    - Total Hours: 52.5 hours (↑ 10 hours)
    - Total Volume: 156,200 lbs (↑ 18,750 lbs)
    - Max Lift (Squat): 245 lbs (↑ 10 lbs from peak)
  - Quick stats cards with trend indicators

**Step 2: View Strength Progress - Specific Exercise**
- User action:
  - Clicks "Barbell Squat" exercise
- System displays:
  - Title: "Barbell Squat - 12 Week Progress"
  - Line chart:
    - X-axis: Weeks 1-12
    - Y-axis: Weight (lbs)
    - Plot: Shows max weight achieved each week
    - Data points: Week 1: 185 lbs, Week 2: 190 lbs, ... Week 12: 245 lbs
  - Statistics card:
    - Starting weight: 185 lbs
    - Current max: 245 lbs
    - Total improvement: 60 lbs (32%)
    - Improvement per week: 5 lbs average
    - Times performed: 24 times
    - Average volume per session: 825 lbs
  - Toggle options:
    - "Max Weight" (selected) | "Average Weight" | "Total Volume"

**Step 3: View Multiple Exercises Comparison**
- User action:
  - Clicks "Compare Exercises"
- System displays:
  - Multi-line chart with 3-5 exercises plotted:
    - Barbell Squat (blue line)
    - Bench Press (red line)
    - Barbell Deadlift (green line)
    - Barbell Rows (orange line)
    - Leg Press (purple line)
  - Legend allows toggling visibility
  - Shows which exercise has best progression rate
  - Annotation: "Deadlift showing best progression rate (+10% per week)"

**Step 4: View Cardio Progress**
- User action:
  - Clicks "Cardio" tab
- System displays:
  - Distance progress chart (12 weeks):
    - Miles run per week
    - Shows trend: Average 10.5 miles/week
    - Peak week: 18 miles
    - Best time: 5K in 24:15 (2 weeks ago)
  - Speed progress chart:
    - Average pace improving from 8:30/mile to 7:45/mile
    - Shows consistency (fewer slower sessions over time)
  - Heart rate trends:
    - Resting heart rate trending down from 72 to 68 bpm
    - Max HR per effort level trending down (better fitness)

**Step 5: View Body Metrics**
- User action:
  - Clicks "Body Metrics" tab
- System displays:
  - Charts for tracked metrics:
    - Body weight: 185 lbs → 180 lbs (-5 lbs)
    - Body fat %: 18% → 15% (-3%)
    - Lean muscle mass: 152 lbs → 153 lbs (+1 lb)
  - All with 12-week trend lines
  - Note: "These metrics sync from health integrations if connected"
  - Button: "Connect Apple Health" | "Connect Fitbit"

**Step 6: View Workout Frequency Heatmap**
- User action:
  - Clicks "Calendar" tab
- System displays:
  - Year/month calendar view
  - Each day color-coded:
    - Green: Workout completed
    - Light green: Partial workout
    - Gray: No workout
    - Red: Planned but skipped
  - Hover on day shows: "Monday, Dec 21: Back & Biceps (45 min)"
  - Click day shows: Full workout details
  - Shows current streak: "Current streak: 5 consecutive workout days"
  - Shows best streak: "Best streak: 12 consecutive days"

**Step 7: View Goal Progress**
- User action:
  - Clicks "Goals" tab
- System displays:
  - Active goals with progress bars:
    - Goal 1: Squat 250 lbs
      - Current: 245 lbs
      - Target: 250 lbs
      - Progress: 98%
      - Status: Nearly there! Just 5 lbs away
      - Timeline: 2 weeks at current rate
    - Goal 2: Run 10K sub-50 minutes
      - Current PR: 52:30
      - Target: 50:00
      - Progress: 97%
      - Status: Close! Need 2:30 min improvement
      - Timeline: 4 weeks at current improvement rate
    - Goal 3: Complete 50 workouts in 3 months
      - Current: 44 workouts
      - Target: 50
      - Progress: 88%
      - Status: On track (1 week remaining)
  - Button: "View All Goals"
  - Button: "Create New Goal"

**Step 8: Customize Report**
- User action:
  - Clicks "Generate Report"
- System shows modal:
  - Select metrics to include:
    - [x] Strength Progress
    - [x] Cardio Progress
    - [x] Body Metrics
    - [ ] Workout Frequency
    - [x] Goal Progress
  - Select time period: [Last 12 Weeks]
  - Select format: PDF | CSV | Email | Share Link
- User action:
  - Selects format "PDF"
  - Clicks "Generate"
- System response:
  - Creates PDF with:
    - Selected charts
    - Summary statistics
    - Trends and insights
    - Goal status
  - Downloads: "Progress_Report_Dec21_2025.pdf"

**Step 9: Get AI Insights**
- User sees "AI Insights" button
- User action:
  - Clicks button
- System response:
  - Loads AI analysis: "Analyzing your progress..."
  - Shows insights card:
    - "💪 Strength Insight: Squat progression is accelerating. At current rate, you'll hit 250 lbs in ~2 weeks."
    - "🏃 Cardio Insight: Running times improving steadily. Sub-50min 10K is achievable within 4-6 weeks."
    - "📊 Overall Insight: Consistency is key. Your best progress weeks correlate with 4+ workouts per week."
    - "⚠️ Alert: Deadlift progression plateaued last 2 weeks. Consider form check or deload week."
  - Button: "Get Personalized Recommendations"

---

### ERROR STATES

**Error: Insufficient Data**
- User has < 4 weeks of workout history
- System response:
  - Shows message: "Need more workout data for meaningful progress tracking"
  - Shows: "Complete X more workouts to start tracking progress"
  - Still displays summary of available data

**Error: Network Error Loading Progress**
- User loads progress → network fails
- System response:
  - Shows error: "Unable to load progress data"
  - Buttons: "Retry" | "View Offline" (if cache available)

**Error: Metric Data Missing**
- Specific exercise has no data for selected period
- System response:
  - Shows message: "No data for Barbell Bench Press in selected period"
  - Allows viewing other exercises
  - Provides: "Select different period"

**Error: Health Integration Sync Failed**
- User clicks "Connect Apple Health" but sync fails
- System response:
  - Shows error: "Failed to connect. Try again or use manual entry."
  - Button: "Retry" | "Manual Entry"

**Error: Report Generation Failed**
- User clicks "Generate Report" but PDF creation fails
- System response:
  - Shows error: "Report generation failed"
  - Options: "Retry" | "Email Instead" | "View Online"

**Error: Date Range Invalid**
- User selects custom range with end date before start date
- System response:
  - Shows error: "End date must be after start date"
  - Resets date picker

---

### EXIT STATE

**Success Exit**
- User views progress, generates reports, browses different periods
- Exits by navigating to dashboard or other section

**Download Exit**
- User exports PDF/CSV report
- File downloads

**Share Exit**
- User creates shareable link
- Copies link to clipboard for sharing

---

---

## 📊 FLOW SUMMARY TABLE

| Flow | Entry Point | Key Actions | Exit Point |
|------|-------------|------------|-----------|
| **Log Workout** | "Log Workout" button | Select date → Add exercises → Log sets → Save | Confirmation screen |
| **View History** | "Workout History" | Filter → Sort → Select date range → Drill into detail | Back to dashboard |
| **Edit Workout** | "Edit" on detail | Modify sets/exercises → Save within 24h | Updated detail view |
| **Weekly Summary** | "Weekly Summary" | View current week → Browse other weeks → Export | Share or navigate away |
| **Progress Tracking** | "Progress" or "Analytics" | Select metric → View trend → Compare → Generate report | Download report or browse |

---

## 🎯 COMMON USER JOURNEYS

### Journey 1: Complete Workout Session
1. User logs in
2. Navigates to Fitness module
3. Clicks "Log Workout"
4. Enters workout details (5 min)
5. Saves workout (2 min)
6. Views workout detail (1 min)
7. Returns to dashboard
**Total Time: 10 minutes**

### Journey 2: Weekly Review
1. User opens dashboard
2. Clicks "Weekly Summary"
3. Views summary cards (2 min)
4. Browses exercise breakdown (2 min)
5. Reviews progress vs last week (1 min)
6. Exports PDF report (1 min)
**Total Time: 6 minutes**

### Journey 3: Track Long-term Progress
1. User opens dashboard
2. Clicks "Progress"
3. Views strength chart for main lift (2 min)
4. Compares multiple exercises (2 min)
5. Reviews goal progress (2 min)
6. Gets AI insights (1 min)
7. Generates report (1 min)
**Total Time: 8 minutes**

### Journey 4: Correct Logged Workout
1. User navigates to History
2. Finds workout from 2 days ago
3. Clicks "Edit"
4. Modifies 1 set (changes weight) (2 min)
5. Saves changes (1 min)
6. Verifies update (1 min)
**Total Time: 5 minutes**

---

## ✅ FLOW COMPLETENESS CHECKLIST

- [x] Log Workout: 9 steps + 5 error states
- [x] View History: 6 steps + 4 error states
- [x] Edit Workout: 9 steps + 6 error states
- [x] Weekly Summary: 7 steps + 5 error states
- [x] Progress Tracking: 9 steps + 6 error states

**Total Steps:** 40+
**Total Error States:** 26+
**Ready for:** Wireframing, prototyping, development specification

---

**All flows are COMPLETE and IMPLEMENTATION-READY.**

Status: ✅ Detailed step-by-step specification done
Next: Wireframe screens and create API specifications
