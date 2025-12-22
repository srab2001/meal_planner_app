# FITNESS APP - REACT COMPONENT ARCHITECTURE

**Prepared By:** Frontend Architect  
**Date:** December 21, 2025  
**Status:** ✅ COMPLETE COMPONENT SPECIFICATION  
**Framework:** React 18+, React Router v6+

---

## 📐 ARCHITECTURE OVERVIEW

### Component Hierarchy
```
FitnessModule (Route: /fitness)
├── Dashboard
├── WorkoutLog
│   ├── WorkoutForm
│   │   ├── DatePicker
│   │   ├── TextInput
│   │   └── ExerciseList
│   │       └── ExerciseCard
│   │           └── SetTable
│   ├── ExerciseModal
│   │   ├── SearchBox
│   │   ├── CategoryFilter
│   │   └── ExerciseList
│   └── ConfirmDialog
├── WorkoutHistory
│   ├── FilterBar
│   │   ├── Dropdown (Type)
│   │   ├── Dropdown (Sort)
│   │   └── Dropdown (Date Range)
│   ├── WorkoutCard
│   └── WorkoutDetailModal
│       ├── ExerciseList
│       │   └── SetList
│       └── ActionMenu
├── WeeklySummary
│   ├── WeekSelector
│   ├── StatCard (×6)
│   ├── TabBar
│   └── TabContent
│       ├── OverviewTab
│       ├── ExercisesTab
│       ├── IntensityTab
│       ├── CardioTab
│       └── ProgressTab
├── ProgressTracking
│   ├── ProgressChart
│   ├── StatCard
│   ├── GoalCard
│   └── ExerciseComparison
├── CardioLog
│   ├── CardioForm
│   └── CardioDetailModal
└── Shared Components
    ├── Button
    ├── Input
    ├── Modal
    ├── DropdownMenu
    ├── ErrorBanner
    ├── LoadingSpinner
    ├── ConfirmDialog
    ├── Toast
    └── Chart
```

---

## 🗂️ FOLDER STRUCTURE

```
client/src/modules/fitness/
├── index.js
├── router.js
├── constants/
│   ├── endpoints.js
│   ├── errorMessages.js
│   └── uiText.js
├── hooks/
│   ├── useWorkouts.js
│   ├── useCardio.js
│   ├── useProgress.js
│   ├── useExercises.js
│   └── useFitnessState.js
├── services/
│   ├── fitnessAPI.js
│   ├── workoutService.js
│   ├── cardioService.js
│   ├── exerciseService.js
│   └── progressService.js
├── components/
│   ├── Dashboard/
│   │   ├── Dashboard.jsx
│   │   ├── DashboardWidget.jsx
│   │   ├── StatCard.jsx
│   │   ├── RecentActivityFeed.jsx
│   │   └── __tests__/
│   │       └── Dashboard.test.jsx
│   │
│   ├── WorkoutLog/
│   │   ├── WorkoutLog.jsx
│   │   ├── WorkoutForm.jsx
│   │   ├── DatePicker.jsx
│   │   ├── ExerciseList.jsx
│   │   ├── ExerciseCard.jsx
│   │   ├── ExerciseModal.jsx
│   │   ├── SearchBox.jsx
│   │   ├── CategoryFilter.jsx
│   │   ├── SetTable.jsx
│   │   ├── SetRow.jsx
│   │   └── __tests__/
│   │
│   ├── WorkoutHistory/
│   │   ├── WorkoutHistory.jsx
│   │   ├── FilterBar.jsx
│   │   ├── WorkoutCard.jsx
│   │   ├── WorkoutDetailModal.jsx
│   │   ├── ExerciseListDetail.jsx
│   │   └── __tests__/
│   │
│   ├── WeeklySummary/
│   │   ├── WeeklySummary.jsx
│   │   ├── WeekSelector.jsx
│   │   ├── SummaryCards.jsx
│   │   ├── TabBar.jsx
│   │   ├── OverviewTab.jsx
│   │   ├── ExercisesTab.jsx
│   │   ├── IntensityTab.jsx
│   │   ├── CardioTab.jsx
│   │   ├── ProgressTab.jsx
│   │   └── __tests__/
│   │
│   ├── ProgressTracking/
│   │   ├── ProgressTracking.jsx
│   │   ├── ProgressChart.jsx
│   │   ├── ExerciseProgress.jsx
│   │   ├── CardioProgress.jsx
│   │   ├── GoalCard.jsx
│   │   ├── ExerciseComparison.jsx
│   │   └── __tests__/
│   │
│   ├── CardioLog/
│   │   ├── CardioLog.jsx
│   │   ├── CardioForm.jsx
│   │   ├── CardioDetailModal.jsx
│   │   └── __tests__/
│   │
│   ├── Shared/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   ├── DropdownMenu.jsx
│   │   ├── ErrorBanner.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── ConfirmDialog.jsx
│   │   ├── Toast.jsx
│   │   ├── Chart.jsx
│   │   ├── StatCard.jsx
│   │   └── __tests__/
│   │
│   └── styles/
│       ├── fitness.css
│       ├── animations.css
│       └── responsive.css
├── utils/
│   ├── validators.js
│   ├── formatters.js
│   ├── calculations.js
│   ├── localStorage.js
│   └── errorHandler.js
├── context/
│   ├── FitnessContext.js
│   └── FitnessProvider.jsx
└── __tests__/
    └── integration/
```

---

## 📦 COMPONENT SPECIFICATIONS

### CATEGORY 1: PAGE/SCREEN COMPONENTS

---

## 1. Dashboard.jsx

**Purpose:** Main entry screen showing fitness overview and quick stats

**Screen:** Fitness Dashboard  
**Responsibility:** Compose dashboard layout, fetch data, manage loading states

**Props:**
```javascript
{
  // None - page component
}
```

**State:**
```javascript
{
  isLoading: boolean,
  error: Error | null,
  dashboardData: {
    workoutsThisWeek: number,
    totalDuration: number,
    workoutsCompleted: number,
    workoutsPlanned: number,
    recentWorkouts: Workout[],
    activePlan: Plan | null,
    nextWorkout: Workout | null
  }
}
```

**API Calls:**
- `GET /workouts?date_from=monday_this_week&date_to=sunday_this_week` (on mount)
- `GET /progress/weekly-summary?week=<current_week>` (on mount)
- `GET /fitness/plans/active` (on mount)

**Child Components:**
- `StatCard` (×3)
- `RecentActivityFeed`
- `DashboardWidget` (×3)
- `ErrorBanner`
- `LoadingSpinner`

**Key Functions:**
```javascript
useEffect(() => {
  fetchDashboardData(); // Fetch all data on mount
}, []);

const fetchDashboardData = async () => {
  // Parallel API calls
};

const handleNavigateToWorkout = (workoutId) => {
  navigate(`/fitness/history/${workoutId}`);
};

const handleStartNewWorkout = () => {
  navigate('/fitness/log');
};
```

**Styling:**
- 16px padding
- Grid layout (3 columns on desktop, 1 on mobile)
- 12px gap between widgets

---

## 2. WorkoutLog.jsx

**Purpose:** Main screen for logging new workouts

**Screen:** Workout Log Screen  
**Responsibility:** Compose form layout, handle submission, manage edit state

**Props:**
```javascript
{
  workoutId?: string // If editing existing workout
}
```

**State:**
```javascript
{
  formData: {
    workout_date: Date,
    workout_name: string,
    description?: string,
    duration_minutes?: number,
    notes?: string,
    status: 'draft' | 'completed',
    exercises: WorkoutExercise[]
  },
  isLoading: boolean,
  isSaving: boolean,
  error: Error | null,
  validationErrors: ValidationError[]
}
```

**API Calls:**
- `GET /workouts/:id` (if editing, on mount)
- `POST /workouts` (on save, new)
- `PUT /workouts/:id` (on save, editing)
- `GET /exercise-definitions?limit=100` (for autocomplete)

**Child Components:**
- `WorkoutForm`
- `ExerciseList`
- `ExerciseModal`
- `ConfirmDialog`
- `ErrorBanner`
- `Toast`

**Key Functions:**
```javascript
const handleAddExercise = (exerciseDefinitionId) => {
  // Add exercise to exercises array
};

const handleRemoveExercise = (exerciseIndex) => {
  // Remove exercise from exercises array
};

const handleSaveWorkout = async (formData) => {
  // Validate, then POST/PUT
  // Show success toast
  // Navigate to detail or dashboard
};

const handleCancel = () => {
  // Show confirmation if unsaved changes
  // Navigate back
};
```

**Styling:**
- Sections: 12px border-radius
- 16px padding throughout
- Sticky footer buttons

---

## 3. WorkoutHistory.jsx

**Purpose:** Browse and filter past workouts

**Screen:** History List Screen  
**Responsibility:** Fetch workouts, manage filters, display list

**Props:**
```javascript
{
  // None - page component
}
```

**State:**
```javascript
{
  workouts: Workout[],
  filters: {
    type: 'strength' | 'cardio' | 'all',
    sort: 'newest' | 'oldest' | 'duration' | 'volume',
    dateRange: 'last7' | 'last30' | 'last90' | 'all',
    searchText?: string
  },
  pagination: {
    page: number,
    limit: number,
    total: number
  },
  isLoading: boolean,
  selectedWorkout?: Workout
}
```

**API Calls:**
- `GET /workouts?page=1&limit=20&sort=-date&type=all&date_from=<date>&date_to=<date>` (on mount, on filter change)
- `GET /workouts/:id` (on card click)
- `DELETE /workouts/:id` (on delete confirm)

**Child Components:**
- `FilterBar`
- `WorkoutCard` (list)
- `WorkoutDetailModal`
- `ConfirmDialog`
- `LoadingSpinner`

**Key Functions:**
```javascript
const handleFilterChange = (filters) => {
  setFilters(filters);
  fetchWorkouts(filters);
};

const handleLoadMore = () => {
  setPage(page + 1);
  fetchWorkouts();
};

const handleViewDetail = (workoutId) => {
  fetchWorkoutDetail(workoutId);
  setSelectedWorkout(workoutId);
};

const handleEdit = (workoutId) => {
  navigate(`/fitness/log?id=${workoutId}`);
};

const handleDelete = async (workoutId) => {
  // DELETE endpoint
  // Remove from list
  // Show toast
};
```

**Styling:**
- Card height: 80px
- 12px gap between cards
- 44px height for action buttons

---

## 4. WeeklySummary.jsx

**Purpose:** View aggregated weekly statistics

**Screen:** Weekly Summary Screen  
**Responsibility:** Fetch weekly data, manage tab switching, render charts

**Props:**
```javascript
{
  // None - page component
}
```

**State:**
```javascript
{
  weekStart: Date,
  weekEnd: Date,
  activeTab: 'overview' | 'exercises' | 'intensity' | 'cardio' | 'progress',
  summaryData: {
    workoutsCompleted: number,
    workoutsPlanned: number,
    totalDuration: number,
    totalVolume: number,
    totalReps: number,
    averageIntensity: number,
    cardioSessions: number,
    cardioDistance: number,
    exercises: ExerciseStat[],
    intensityDistribution: IntensityData,
    comparison: WeekComparison
  },
  isLoading: boolean
}
```

**API Calls:**
- `GET /progress/weekly-summary?week=2025-12-15` (on mount, on week change)
- `GET /workouts?date_from=<monday>&date_to=<sunday>` (for detailed workouts)

**Child Components:**
- `WeekSelector`
- `SummaryCards` (StatCard ×6)
- `TabBar`
- `OverviewTab`
- `ExercisesTab`
- `IntensityTab`
- `CardioTab`
- `ProgressTab`
- `Chart`

**Key Functions:**
```javascript
const handleWeekChange = (direction) => {
  // direction: 'prev' | 'next'
  // Update weekStart/weekEnd
  // Fetch new data
};

const handleTabChange = (tabName) => {
  // setActiveTab(tabName)
  // Lazy load tab data if needed
};

const handleExportPDF = async () => {
  // Generate PDF with selected data
  // Download file
};

const handleShare = () => {
  // Copy summary to clipboard or share
};
```

**Styling:**
- Summary cards: 2-column grid
- Tabs: Horizontal scroll on mobile
- Active tab underline: 2px blue

---

## 5. ProgressTracking.jsx

**Purpose:** View long-term fitness progress and trends

**Screen:** Progress Analytics Screen  
**Responsibility:** Fetch progress data, render charts, manage time periods

**Props:**
```javascript
{
  // None - page component
}
```

**State:**
```javascript
{
  period: '4_weeks' | '12_weeks' | '26_weeks' | 'all_time',
  selectedExercise?: ExerciseDefinition,
  progressData: {
    exerciseProgression: {
      exercise: Exercise,
      dataPoints: ProgressPoint[],
      summary: ProgressSummary
    },
    cardioProgression: CardioProgress,
    bodyMetrics: BodyMetrics,
    goals: Goal[],
    insights: string[]
  },
  isLoading: boolean
}
```

**API Calls:**
- `GET /progress/exercises/:id?period=12_weeks&metric=max_weight` (on exercise select)
- `GET /progress/cardio?period=12_weeks&type=running&metric=pace` (on mount)
- `GET /fitness/goals` (on mount)
- `GET /fitness/insights` (on mount, generate AI insights)

**Child Components:**
- `ProgressChart`
- `ExerciseProgress`
- `CardioProgress`
- `GoalCard` (×N)
- `ExerciseComparison`
- `StatCard`
- `Chart`

**Key Functions:**
```javascript
const handlePeriodChange = (period) => {
  setPeriod(period);
  fetchProgressData(period);
};

const handleExerciseSelect = (exerciseId) => {
  fetchExerciseProgress(exerciseId);
};

const handleGenerateReport = async (format) => {
  // format: 'pdf' | 'csv' | 'email'
  // POST to generate endpoint
  // Download or email
};
```

**Styling:**
- Charts: Responsive SVG
- Cards: 12px border-radius
- Grid: 2 columns on desktop

---

## 6. CardioLog.jsx

**Purpose:** Log cardio activities (running, cycling, etc.)

**Screen:** Cardio Log Screen  
**Responsibility:** Manage cardio form, handle cardio-specific fields

**Props:**
```javascript
{
  cardioId?: string // If editing
}
```

**State:**
```javascript
{
  formData: {
    session_date: Date,
    session_name: string,
    cardio_type: 'running' | 'cycling' | 'rowing' | 'swimming' | 'elliptical' | 'walking',
    duration_minutes: number,
    distance_km?: number,
    distance_miles?: number,
    average_pace_min_per_km?: number,
    average_heart_rate?: number,
    max_heart_rate?: number,
    calories_burned?: number,
    intensity: 'low' | 'moderate' | 'high' | 'very_high',
    notes?: string
  },
  isLoading: boolean,
  isSaving: boolean,
  error: Error | null
}
```

**API Calls:**
- `GET /cardio-sessions/:id` (if editing, on mount)
- `POST /cardio-sessions` (on save, new)
- `PUT /cardio-sessions/:id` (on save, editing)

**Child Components:**
- `CardioForm`
- `Input`
- `Select`
- `DatePicker`
- `Button`
- `ErrorBanner`
- `Toast`

**Key Functions:**
```javascript
const handleAddCardio = async (formData) => {
  // POST /cardio-sessions
  // Navigate to detail
};

const handleUpdateCardio = async (formData) => {
  // PUT /cardio-sessions/:id
  // Navigate to detail
};

const calculateCalories = (duration, intensity, weight) => {
  // Estimate calories based on cardio type and intensity
};
```

**Styling:**
- Responsive form layout
- Sticky footer buttons
- 16px padding

---

### CATEGORY 2: FORM COMPONENTS

---

## 7. WorkoutForm.jsx

**Purpose:** Reusable form for workout data entry

**Props:**
```javascript
{
  initialData?: Workout,
  onSubmit: (formData) => void,
  onCancel: () => void,
  isLoading: boolean,
  error?: Error
}
```

**State:**
```javascript
{
  formData: Workout,
  isDirty: boolean,
  validationErrors: ValidationError[]
}
```

**Child Components:**
- `DatePicker`
- `Input`
- `TextArea`
- `ExerciseList`
- `Button`
- `ErrorBanner`

**Key Functions:**
```javascript
const handleChange = (field, value) => {
  setFormData({ ...formData, [field]: value });
  setIsDirty(true);
};

const handleValidate = () => {
  // Check required fields
  // Check date not in future
  // Check at least 1 exercise
  return validationErrors;
};

const handleSubmit = async (e) => {
  e.preventDefault();
  if (handleValidate().length === 0) {
    onSubmit(formData);
  }
};
```

---

## 8. CardioForm.jsx

**Purpose:** Form for cardio session entry

**Props:**
```javascript
{
  initialData?: CardioSession,
  onSubmit: (formData) => void,
  onCancel: () => void,
  isLoading: boolean
}
```

**State:**
```javascript
{
  formData: CardioSession,
  isDirty: boolean,
  validationErrors: ValidationError[]
}
```

**Child Components:**
- `Select` (cardio type)
- `Input` (duration, distance, pace, etc.)
- `DatePicker`
- `Button`

---

## 9. ExerciseList.jsx

**Purpose:** Display and manage exercises in a workout

**Props:**
```javascript
{
  exercises: WorkoutExercise[],
  onAddExercise: (exerciseDefinition) => void,
  onRemoveExercise: (index) => void,
  onUpdateExercise: (index, updates) => void,
  canEdit: boolean
}
```

**State:**
```javascript
{
  expandedExercise: number | null,
  showExerciseModal: boolean
}
```

**Child Components:**
- `ExerciseCard` (×N)
- `ExerciseModal`
- `Button`

---

## 10. ExerciseCard.jsx

**Purpose:** Display single exercise with sets

**Props:**
```javascript
{
  exercise: WorkoutExercise,
  index: number,
  onRemove: () => void,
  onAddSet: () => void,
  onRemoveSet: (setIndex) => void,
  onUpdateSet: (setIndex, updates) => void,
  isExpanded: boolean,
  onToggleExpand: () => void,
  canEdit: boolean
}
```

**Child Components:**
- `SetTable` or `SetRow`
- `Button`
- `Input`

---

## 11. SetTable.jsx

**Purpose:** Display all sets for an exercise

**Props:**
```javascript
{
  sets: WorkoutSet[],
  onAddSet: () => void,
  onRemoveSet: (index) => void,
  onUpdateSet: (index, updates) => void,
  canEdit: boolean
}
```

**Child Components:**
- `SetRow` (×N)
- `Button`

---

## 12. SetRow.jsx

**Purpose:** Single set entry row

**Props:**
```javascript
{
  set: WorkoutSet,
  index: number,
  onUpdate: (updates) => void,
  onRemove: () => void,
  canEdit: boolean
}
```

**Child Components:**
- `Input` (×5) - reps, weight_kg, weight_lbs, rpe, notes

---

### CATEGORY 3: MODAL COMPONENTS

---

## 13. ExerciseModal.jsx

**Purpose:** Modal for selecting and adding exercises

**Props:**
```javascript
{
  isOpen: boolean,
  onClose: () => void,
  onSelectExercise: (exerciseDefinition) => void,
  selectedExercises?: string[] // IDs of already-selected exercises
}
```

**State:**
```javascript
{
  searchText: string,
  selectedCategories: string[],
  exercises: ExerciseDefinition[],
  filteredExercises: ExerciseDefinition[],
  isLoading: boolean,
  selectedExercise?: ExerciseDefinition
}
```

**API Calls:**
- `GET /exercise-definitions?search=<text>&category=<cat>&limit=50` (on search/filter)

**Child Components:**
- `SearchBox`
- `CategoryFilter`
- `ExerciseListItem`
- `Button`
- `Modal`

---

## 14. WorkoutDetailModal.jsx

**Purpose:** Modal showing full workout details

**Props:**
```javascript
{
  isOpen: boolean,
  workout: Workout,
  onClose: () => void,
  onEdit: (workoutId) => void,
  onDelete: (workoutId) => void,
  onShare: (workoutId) => void
}
```

**Child Components:**
- `ExerciseListDetail`
- `Button`
- `Modal`
- `ConfirmDialog`

---

## 15. CardioDetailModal.jsx

**Purpose:** Modal showing cardio session details

**Props:**
```javascript
{
  isOpen: boolean,
  cardioSession: CardioSession,
  onClose: () => void,
  onEdit: (cardioId) => void,
  onDelete: (cardioId) => void
}
```

---

## 16. ConfirmDialog.jsx

**Purpose:** Confirmation dialog for destructive actions

**Props:**
```javascript
{
  isOpen: boolean,
  title: string,
  message: string,
  confirmText: string,
  cancelText: string,
  isDangerous: boolean, // Red button if true
  onConfirm: () => void,
  onCancel: () => void,
  isLoading: boolean
}
```

---

### CATEGORY 4: UI COMPONENTS

---

## 17. FilterBar.jsx

**Purpose:** Filter/sort controls for workout history

**Props:**
```javascript
{
  filters: {
    type: string,
    sort: string,
    dateRange: string
  },
  onFiltersChange: (filters) => void,
  options: {
    types: string[],
    sorts: string[],
    dateRanges: string[]
  }
}
```

**Child Components:**
- `Dropdown` (×3)

---

## 18. WeekSelector.jsx

**Purpose:** Navigate between weeks

**Props:**
```javascript
{
  weekStart: Date,
  weekEnd: Date,
  onWeekChange: (direction: 'prev' | 'next') => void
}
```

---

## 19. TabBar.jsx

**Purpose:** Tab navigation

**Props:**
```javascript
{
  tabs: { name: string, label: string }[],
  activeTab: string,
  onTabChange: (tabName) => void
}
```

---

## 20. StatCard.jsx

**Purpose:** Display a statistic

**Props:**
```javascript
{
  label: string,
  value: string | number,
  unit?: string,
  icon?: React.ReactNode,
  trend?: { direction: 'up' | 'down', amount: number },
  onClick?: () => void
}
```

---

## 21. Chart.jsx

**Purpose:** Generic chart component

**Props:**
```javascript
{
  type: 'line' | 'bar' | 'area',
  data: {
    labels: string[],
    datasets: {
      label: string,
      data: number[],
      borderColor?: string,
      backgroundColor?: string
    }[]
  },
  options?: ChartOptions,
  height?: number
}
```

**Library:** Chart.js or Recharts

---

## 22. ProgressChart.jsx

**Purpose:** Progress visualization for exercises

**Props:**
```javascript
{
  exercise: Exercise,
  dataPoints: ProgressPoint[],
  metric: 'max_weight' | 'avg_weight' | 'total_volume',
  unit: 'kg' | 'lbs'
}
```

**Child Components:**
- `Chart`

---

## 23. Button.jsx

**Purpose:** Reusable button component

**Props:**
```javascript
{
  children: React.ReactNode,
  onClick?: () => void,
  variant: 'primary' | 'secondary' | 'danger' | 'ghost',
  size: 'sm' | 'md' | 'lg',
  disabled: boolean,
  isLoading: boolean,
  fullWidth: boolean,
  type: 'button' | 'submit' | 'reset'
}
```

---

## 24. Input.jsx

**Purpose:** Reusable text input

**Props:**
```javascript
{
  value: string,
  onChange: (value) => void,
  placeholder?: string,
  label?: string,
  error?: string,
  type: 'text' | 'number' | 'email' | 'password',
  disabled: boolean,
  maxLength?: number,
  min?: number,
  max?: number,
  step?: number
}
```

---

## 25. Select.jsx

**Purpose:** Dropdown select component

**Props:**
```javascript
{
  value: string,
  onChange: (value) => void,
  options: { value: string, label: string }[],
  placeholder?: string,
  label?: string,
  error?: string,
  disabled: boolean
}
```

---

## 26. DatePicker.jsx

**Purpose:** Date selection component

**Props:**
```javascript
{
  value: Date,
  onChange: (date: Date) => void,
  minDate?: Date,
  maxDate?: Date, // Defaults to today
  label?: string,
  error?: string
}
```

---

## 27. Modal.jsx

**Purpose:** Reusable modal dialog

**Props:**
```javascript
{
  isOpen: boolean,
  onClose: () => void,
  title: string,
  children: React.ReactNode,
  actions?: React.ReactNode,
  size: 'sm' | 'md' | 'lg'
}
```

---

## 28. DropdownMenu.jsx

**Purpose:** Dropdown menu with options

**Props:**
```javascript
{
  isOpen: boolean,
  onClose: () => void,
  trigger: React.ReactNode,
  items: { label: string, action: () => void, danger?: boolean }[],
  align: 'left' | 'right'
}
```

---

## 29. ErrorBanner.jsx

**Purpose:** Display error messages

**Props:**
```javascript
{
  error: Error | string,
  onDismiss?: () => void,
  type: 'error' | 'warning' | 'info'
}
```

---

## 30. LoadingSpinner.jsx

**Purpose:** Loading indicator

**Props:**
```javascript
{
  size: 'sm' | 'md' | 'lg',
  message?: string
}
```

---

## 31. Toast.jsx

**Purpose:** Toast notification

**Props:**
```javascript
{
  message: string,
  type: 'success' | 'error' | 'info' | 'warning',
  duration: number, // ms, default 3000
  onClose: () => void
}
```

---

## 32. SearchBox.jsx

**Purpose:** Search input with clear button

**Props:**
```javascript
{
  value: string,
  onChange: (value) => void,
  onClear: () => void,
  placeholder: string
}
```

---

## 33. CategoryFilter.jsx

**Purpose:** Category filter buttons

**Props:**
```javascript
{
  categories: string[],
  selected: string[],
  onToggle: (category) => void,
  isMulti: boolean
}
```

---

### CATEGORY 5: DATA DISPLAY COMPONENTS

---

## 34. WorkoutCard.jsx

**Purpose:** Card displaying workout summary

**Props:**
```javascript
{
  workout: Workout,
  onClick: () => void,
  onMenuOpen: (action) => void,
  showMenuButton: boolean
}
```

**Child Components:**
- `DropdownMenu` (optional)

---

## 35. ExerciseListDetail.jsx

**Purpose:** Display exercises in detail view

**Props:**
```javascript
{
  exercises: WorkoutExercise[],
  expandedIndex?: number,
  onToggleExpand: (index) => void
}
```

**Child Components:**
- `ExerciseCardDetail` (×N)

---

## 36. RecentActivityFeed.jsx

**Purpose:** Display recent workouts on dashboard

**Props:**
```javascript
{
  workouts: Workout[],
  limit: number,
  onWorkoutClick: (workoutId) => void
}
```

**Child Components:**
- `WorkoutCard` (×N)

---

## 37. SummaryCards.jsx

**Purpose:** Display stat cards in grid

**Props:**
```javascript
{
  stats: StatData[],
  columns: number
}
```

**Child Components:**
- `StatCard` (×N)

---

## 38. GoalCard.jsx

**Purpose:** Display goal progress

**Props:**
```javascript
{
  goal: Goal,
  progress: GoalProgress,
  onClick: () => void
}
```

---

## 39. ExerciseComparison.jsx

**Purpose:** Compare multiple exercises

**Props:**
```javascript
{
  exercises: ExerciseProgress[],
  metric: 'max_weight' | 'volume',
  timeframe: string
}
```

**Child Components:**
- `Chart`

---

### CATEGORY 6: CONTEXT & HOOKS

---

## 40. FitnessContext.js

**Purpose:** Global fitness state management

**Context Values:**
```javascript
{
  user: User,
  preferences: {
    unitSystem: 'metric' | 'imperial',
    theme: 'light' | 'dark'
  },
  recentWorkouts: Workout[],
  dispatch: (action) => void
}
```

**Actions:**
```javascript
{
  SET_WORKOUTS,
  ADD_WORKOUT,
  UPDATE_WORKOUT,
  DELETE_WORKOUT,
  SET_LOADING,
  SET_ERROR,
  CLEAR_ERROR
}
```

---

## 41. useWorkouts() Hook

**Purpose:** Fetch and manage workouts

**Returns:**
```javascript
{
  workouts: Workout[],
  isLoading: boolean,
  error: Error | null,
  fetchWorkouts: (filters?) => Promise<Workout[]>,
  addWorkout: (data) => Promise<Workout>,
  updateWorkout: (id, data) => Promise<Workout>,
  deleteWorkout: (id) => Promise<void>,
  getWorkoutById: (id) => Promise<Workout>
}
```

**API Calls:**
- `GET /workouts` (with filters)
- `GET /workouts/:id`
- `POST /workouts`
- `PUT /workouts/:id`
- `DELETE /workouts/:id`

---

## 42. useCardio() Hook

**Purpose:** Fetch and manage cardio sessions

**Returns:**
```javascript
{
  cardioSessions: CardioSession[],
  isLoading: boolean,
  error: Error | null,
  fetchCardio: (filters?) => Promise<CardioSession[]>,
  addCardio: (data) => Promise<CardioSession>,
  updateCardio: (id, data) => Promise<CardioSession>,
  deleteCardio: (id) => Promise<void>,
  getCardioById: (id) => Promise<CardioSession>
}
```

---

## 43. useProgress() Hook

**Purpose:** Fetch progress data

**Returns:**
```javascript
{
  exerciseProgress: ExerciseProgress | null,
  cardioProgress: CardioProgress | null,
  goals: Goal[],
  isLoading: boolean,
  error: Error | null,
  fetchExerciseProgress: (exerciseId, period) => Promise,
  fetchCardioProgress: (period) => Promise,
  fetchGoals: () => Promise
}
```

---

## 44. useExercises() Hook

**Purpose:** Fetch and search exercises

**Returns:**
```javascript
{
  exercises: ExerciseDefinition[],
  isLoading: boolean,
  searchExercises: (query, filters) => Promise<ExerciseDefinition[]>,
  getExerciseById: (id) => Promise<ExerciseDefinition>
}
```

---

## 45. useFitnessState() Hook

**Purpose:** Local component state management

**Returns:**
```javascript
{
  formData: any,
  setFormData: (data) => void,
  isDirty: boolean,
  setIsDirty: (bool) => void,
  errors: ValidationError[],
  setErrors: (errors) => void,
  isLoading: boolean,
  setIsLoading: (bool) => void
}
```

---

## COMPONENT TO SCREEN MAPPING

| Component | Screen | Purpose |
|-----------|--------|---------|
| Dashboard | Dashboard | Entry point, overview |
| WorkoutLog | Workout Log | Log new/edit workout |
| WorkoutHistory | History List | Browse past workouts |
| WeeklySummary | Weekly Summary | Week overview |
| ProgressTracking | Progress Analytics | Long-term progress |
| CardioLog | Cardio Log | Log cardio session |
| WorkoutForm | Workout Log | Reusable form |
| ExerciseList | Workout Log | Manage exercises |
| ExerciseModal | Workout Log | Select exercises |
| FilterBar | History List | Filter workouts |
| WeekSelector | Weekly Summary | Navigate weeks |
| TabBar | Weekly Summary | Tab navigation |
| StatCard | Multiple screens | Display stats |
| Chart | Progress screens | Visualize data |
| Button | All screens | Actions |
| Input | Forms | Text input |
| Modal | Modal screens | Dialog container |
| Toast | All screens | Notifications |
| ErrorBanner | All screens | Error display |

---

## COMPONENT TO API MAPPING

| API Endpoint | Components Using It | Purpose |
|--------------|-------------------|---------|
| POST /workouts | WorkoutLog, WorkoutForm | Create workout |
| GET /workouts | WorkoutHistory, Dashboard | Fetch workouts |
| GET /workouts/:id | WorkoutDetailModal, WorkoutLog | Get workout detail |
| PUT /workouts/:id | WorkoutLog, WorkoutForm | Update workout |
| DELETE /workouts/:id | WorkoutHistory, WorkoutDetailModal | Delete workout |
| GET /exercise-definitions | ExerciseModal, ExerciseList | Get exercises |
| POST /cardio-sessions | CardioLog | Log cardio |
| GET /cardio-sessions | CardioLog, ProgressTracking | Get cardio sessions |
| GET /progress/weekly-summary | WeeklySummary, Dashboard | Get week stats |
| GET /progress/exercises/:id | ProgressTracking, ExerciseProgress | Get exercise progress |
| GET /progress/cardio | ProgressTracking, CardioProgress | Get cardio progress |

---

## STATE MANAGEMENT STRATEGY

### Global State (Context)
- User preferences (metric/imperial, theme)
- Active workout session (if applicable)
- Authentication state

### Local Component State
- Form data
- Loading states
- UI state (modals, expanded items)
- Filters and sorting

### Server Cache
- Workouts list
- Exercise definitions
- Progress data

**Libraries:**
- Context API for simple global state
- React Query or SWR for server data caching
- Optional: Redux if state complexity grows

---

## DATA FLOW EXAMPLE: Logging a Workout

```
User Action
    ↓
WorkoutLog.jsx
    ↓
WorkoutForm.jsx (form input)
    ↓
ExerciseList.jsx (add exercises)
    ↓
ExerciseModal.jsx (select exercise)
    ↓
SetTable.jsx (add sets)
    ↓
User clicks "Save"
    ↓
handleSubmit() in WorkoutLog
    ↓
useWorkouts().addWorkout()
    ↓
POST /workouts (API call)
    ↓
FitnessContext.ADD_WORKOUT (update global state)
    ↓
Toast notification (success)
    ↓
Navigate to Dashboard
```

---

## TESTING STRATEGY

### Unit Tests
- Each component tested in isolation
- Props validation
- Event handlers
- State changes

### Integration Tests
- Form submission flow
- Data fetching
- Error handling

### E2E Tests
- Complete workout logging flow
- History browsing and filtering
- Progress viewing

**Testing Library:** Jest + React Testing Library

---

## PERFORMANCE OPTIMIZATION

### Code Splitting
```javascript
const WorkoutHistory = lazy(() => import('./WorkoutHistory'));
const ProgressTracking = lazy(() => import('./ProgressTracking'));
```

### Memoization
```javascript
const StatCard = memo(({ label, value }) => (...));
const ExerciseCard = memo(({ exercise }) => (...));
```

### Lazy Loading
- Load tab content on tab switch
- Load exercise definitions on modal open
- Load progress charts on scroll

### Caching
- Cache exercise definitions (rarely changes)
- Cache workouts with React Query (1 hour TTL)
- Cache progress data (1 day TTL)

---

## ACCESSIBILITY (a11y)

### All Components Must:
- Have proper ARIA labels
- Support keyboard navigation
- Have sufficient color contrast
- Include alt text for images
- Announce state changes to screen readers

### Specific Components:
- Modal: `role="dialog"`, focus trap, close on Escape
- Tabs: `role="tablist"`, arrow key navigation
- Buttons: Minimum 44px touch target
- Forms: Label associations, error announcements

---

## COMPONENT CHECKLIST

**Core Components:**
- [x] Dashboard (main entry)
- [x] WorkoutLog (new/edit)
- [x] WorkoutHistory (browse)
- [x] WeeklySummary (weekly view)
- [x] ProgressTracking (analytics)
- [x] CardioLog (cardio entry)

**Forms:**
- [x] WorkoutForm (reusable)
- [x] CardioForm (reusable)
- [x] ExerciseList (manage exercises)
- [x] SetTable (manage sets)

**Modals:**
- [x] ExerciseModal (select exercises)
- [x] WorkoutDetailModal (view details)
- [x] ConfirmDialog (confirmations)

**UI Components:**
- [x] Button (actions)
- [x] Input (text entry)
- [x] Select (dropdowns)
- [x] DatePicker (date selection)
- [x] Modal (dialog container)
- [x] Toast (notifications)
- [x] ErrorBanner (errors)
- [x] LoadingSpinner (loading state)

**Data Display:**
- [x] WorkoutCard (workout summary)
- [x] StatCard (statistics)
- [x] Chart (visualizations)
- [x] GoalCard (goals)

**Context & Hooks:**
- [x] FitnessContext (global state)
- [x] useWorkouts (workout logic)
- [x] useCardio (cardio logic)
- [x] useProgress (progress logic)
- [x] useExercises (exercise logic)

**Total:** 45 components ✅

---

**Component architecture is COMPLETE and PRODUCTION-READY.**

Status: ✅ Ready for implementation  
Next: Implement components, create storybook, unit tests
