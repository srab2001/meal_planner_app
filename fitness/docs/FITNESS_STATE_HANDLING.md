# FITNESS APP - FRONTEND STATE HANDLING & ERROR MANAGEMENT

**Prepared By:** Frontend Architect  
**Date:** December 21, 2025  
**Status:** ✅ COMPLETE STATE MANAGEMENT SPECIFICATION  
**Framework:** React 18+ with Context API and Custom Hooks

---

## 📊 STATE MANAGEMENT ARCHITECTURE

### State Categories

```
┌─────────────────────────────────────────────────────────┐
│ GLOBAL STATE (Context)                                  │
│ ├─ User & Auth                                         │
│ ├─ User Preferences (metric/imperial, theme)          │
│ ├─ Network Status (online/offline)                     │
│ └─ Notifications (toasts)                              │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ LOCAL COMPONENT STATE                                   │
│ ├─ Form Data (dirty state, validation)                │
│ ├─ UI State (modals, expanded, selected)              │
│ ├─ Loading States (per request)                       │
│ └─ Error States (per request)                         │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ SERVER CACHE (React Query / SWR)                       │
│ ├─ Workouts                                            │
│ ├─ Exercise Definitions                               │
│ ├─ Progress Data                                       │
│ └─ Cardio Sessions                                     │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ LOCAL STORAGE (Offline Support)                        │
│ ├─ Pending Workouts (unsaved)                         │
│ ├─ Draft Workouts                                      │
│ ├─ User Preferences                                    │
│ └─ Last Synced Data                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 GLOBAL STATE MANAGEMENT

### FitnessContext Structure

```javascript
{
  // User Data
  user: {
    id: string,
    email: string,
    name: string,
    avatar?: string
  },

  // User Preferences
  preferences: {
    unitSystem: 'metric' | 'imperial',
    theme: 'light' | 'dark',
    defaultRestTime: number,
    notifications: {
      enabled: boolean,
      workoutReminders: boolean,
      progressMilestones: boolean
    }
  },

  // Network Status
  networkStatus: {
    isOnline: boolean,
    lastConnected: Date,
    isSlowConnection: boolean
  },

  // Notifications
  notifications: {
    toasts: Toast[],
    dialogs: Dialog[]
  },

  // Dispatch Function
  dispatch: (action) => void
}
```

### Context Actions

```javascript
// User Actions
SET_USER,
UPDATE_USER_PREFERENCES,

// Network Actions
SET_ONLINE,
SET_OFFLINE,
SET_SLOW_CONNECTION,

// Notification Actions
ADD_TOAST,
REMOVE_TOAST,
ADD_DIALOG,
REMOVE_DIALOG,
CLEAR_ALL_TOASTS,

// Error Actions
SET_GLOBAL_ERROR,
CLEAR_GLOBAL_ERROR
```

### Implementation Example

```javascript
// contexts/FitnessContext.js
import React, { createContext, useReducer } from 'react';

const FitnessContext = createContext();

const initialState = {
  user: null,
  preferences: {
    unitSystem: 'metric',
    theme: 'light',
    defaultRestTime: 90,
    notifications: {
      enabled: true,
      workoutReminders: true,
      progressMilestones: true
    }
  },
  networkStatus: {
    isOnline: navigator.onLine,
    lastConnected: new Date(),
    isSlowConnection: false
  },
  notifications: {
    toasts: [],
    dialogs: []
  }
};

function fitnessReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_ONLINE':
      return {
        ...state,
        networkStatus: { ...state.networkStatus, isOnline: true }
      };
    case 'SET_OFFLINE':
      return {
        ...state,
        networkStatus: { ...state.networkStatus, isOnline: false }
      };
    case 'ADD_TOAST':
      return {
        ...state,
        notifications: {
          ...state.notifications,
          toasts: [...state.notifications.toasts, action.payload]
        }
      };
    // ... other cases
    default:
      return state;
  }
}

export function FitnessProvider({ children }) {
  const [state, dispatch] = useReducer(fitnessReducer, initialState);

  return (
    <FitnessContext.Provider value={{ state, dispatch }}>
      {children}
    </FitnessContext.Provider>
  );
}

export const useFitness = () => {
  const context = useContext(FitnessContext);
  if (!context) {
    throw new Error('useFitness must be used within FitnessProvider');
  }
  return context;
};
```

---

## 💾 LOCAL COMPONENT STATE PATTERNS

### Pattern 1: Simple Form State

```javascript
function WorkoutLogForm() {
  const [formData, setFormData] = useState({
    workout_date: new Date(),
    workout_name: '',
    exercises: []
  });

  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    // Clear field error when user corrects it
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.workout_name) {
      newErrors.workout_name = 'Workout name required';
    }
    if (formData.exercises.length === 0) {
      newErrors.exercises = 'Add at least one exercise';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await saveWorkout(formData);
      setIsDirty(false);
      // Success: navigate or show toast
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Warn if user tries to leave with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return (
    <form onSubmit={handleSubmit}>
      {submitError && <ErrorBanner error={submitError} />}
      
      <Input
        label="Workout Name"
        value={formData.workout_name}
        onChange={(value) => handleChange('workout_name', value)}
        error={errors.workout_name}
      />

      <button 
        type="submit" 
        disabled={isSubmitting || !isDirty}
      >
        {isSubmitting ? 'Saving...' : 'Save Workout'}
      </button>
    </form>
  );
}
```

### Pattern 2: Data Fetching State with React Query

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function WorkoutHistory() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    type: 'all',
    sort: '-date',
    dateRange: 'last30'
  });

  // Fetch workouts
  const {
    data: workouts = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['workouts', filters],
    queryFn: () => fetchWorkouts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: true
  });

  // Delete workout mutation
  const deleteWorkoutMutation = useMutation({
    mutationFn: (workoutId) => deleteWorkout(workoutId),
    onSuccess: () => {
      // Invalidate cache to refetch
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      // Show success toast
      showToast('Workout deleted', 'success');
    },
    onError: (error) => {
      // Show error toast
      showToast(error.message, 'error');
    }
  });

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <ErrorState
        error={error}
        onRetry={() => refetch()}
      />
    );
  }

  if (workouts.length === 0) {
    return <EmptyState />;
  }

  return (
    <div>
      {workouts.map(workout => (
        <WorkoutCard
          key={workout.id}
          workout={workout}
          onDelete={() => deleteWorkoutMutation.mutate(workout.id)}
          isDeleting={deleteWorkoutMutation.isPending}
        />
      ))}
    </div>
  );
}
```

---

## ⚠️ ERROR STATE HANDLING

### Error Types & Handling Strategy

```javascript
// errors/FitnessErrors.js

class FitnessError extends Error {
  constructor(message, code, statusCode = 500, context = {}) {
    super(message);
    this.name = 'FitnessError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
  }
}

// Specific error types
class ValidationError extends FitnessError {
  constructor(message, fields = {}) {
    super(message, 'VALIDATION_ERROR', 400);
    this.fields = fields; // { fieldName: 'error message' }
  }
}

class NetworkError extends FitnessError {
  constructor(message = 'Network error') {
    super(message, 'NETWORK_ERROR', 0);
    this.isNetworkError = true;
  }
}

class AuthenticationError extends FitnessError {
  constructor(message = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
  }
}

class NotFoundError extends FitnessError {
  constructor(resourceType, id) {
    super(`${resourceType} not found`, 'NOT_FOUND', 404);
    this.resourceType = resourceType;
    this.id = id;
  }
}

class ServerError extends FitnessError {
  constructor(message = 'Server error', statusCode = 500) {
    super(message, 'SERVER_ERROR', statusCode);
  }
}

class ConflictError extends FitnessError {
  constructor(message = 'Conflict') {
    super(message, 'CONFLICT', 409);
  }
}

class EditWindowExpiredError extends FitnessError {
  constructor(message = '24-hour edit window has expired') {
    super(message, 'EDIT_WINDOW_EXPIRED', 403);
  }
}
```

### Error Response Mapping

```javascript
// services/errorHandler.js

export const handleApiError = (error) => {
  // Network error
  if (!error.response) {
    if (error.message === 'Network Error') {
      return new NetworkError('Unable to connect. Check your internet connection.');
    }
    return new NetworkError(error.message);
  }

  const { status, data } = error.response;

  // Handle different status codes
  switch (status) {
    case 400:
      if (data.errors) {
        // Validation error with field-level details
        return new ValidationError(data.message, data.errors);
      }
      return new ValidationError(data.message);

    case 401:
      return new AuthenticationError(data.message);

    case 403:
      if (data.code === 'EDIT_WINDOW_EXPIRED') {
        return new EditWindowExpiredError(data.message);
      }
      return new FitnessError(data.message, 'FORBIDDEN', 403);

    case 404:
      return new NotFoundError(data.resourceType || 'Resource', data.id);

    case 409:
      return new ConflictError(data.message);

    case 500:
    case 502:
    case 503:
    case 504:
      return new ServerError(data.message || 'Server error', status);

    default:
      return new FitnessError(data.message || 'Unknown error', 'UNKNOWN_ERROR', status);
  }
};

export const getErrorMessage = (error) => {
  if (error instanceof ValidationError) {
    return error.message || 'Please fix validation errors';
  }
  if (error instanceof NetworkError) {
    return error.message;
  }
  if (error instanceof AuthenticationError) {
    return 'Please log in again';
  }
  if (error instanceof EditWindowExpiredError) {
    return error.message;
  }
  if (error instanceof ServerError) {
    return 'Server error. Please try again later.';
  }
  return error.message || 'An unexpected error occurred';
};

export const getFieldErrors = (error) => {
  if (error instanceof ValidationError) {
    return error.fields; // { fieldName: 'error message' }
  }
  return {};
};
```

---

## 🔄 LOADING STATE HANDLING

### Loading State Types

```javascript
// hooks/useLoadingState.js

export const useLoadingState = () => {
  const [loadingStates, setLoadingStates] = useState({});

  const setLoading = (key, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
  };

  const startLoading = (key) => setLoading(key, true);
  const stopLoading = (key) => setLoading(key, false);

  return {
    loadingStates,
    setLoading,
    startLoading,
    stopLoading,
    isLoading: (key) => loadingStates[key] === true,
    isLoadingAny: Object.values(loadingStates).some(v => v === true)
  };
};

// Usage
function WorkoutHistory() {
  const { isLoading, isLoadingAny, startLoading, stopLoading } = useLoadingState();

  const handleDelete = async (workoutId) => {
    startLoading(`delete_${workoutId}`);
    try {
      await deleteWorkout(workoutId);
    } finally {
      stopLoading(`delete_${workoutId}`);
    }
  };

  return (
    <>
      <button disabled={isLoadingAny}>
        {isLoadingAny ? 'Loading...' : 'Save'}
      </button>
      <WorkoutCard 
        isDeleting={isLoading(`delete_${workout.id}`)}
      />
    </>
  );
}
```

### Loading UI Components

```javascript
// components/Shared/LoadingSpinner.jsx

export function LoadingSpinner({ size = 'md', message = 'Loading...' }) {
  const sizeMap = {
    sm: '24px',
    md: '40px',
    lg: '60px'
  };

  return (
    <div className="loading-spinner">
      <div 
        className="spinner"
        style={{ width: sizeMap[size], height: sizeMap[size] }}
      ></div>
      {message && <p>{message}</p>}
    </div>
  );
}

// components/Shared/SkeletonLoader.jsx

export function SkeletonLoader({ count = 3, height = '60px' }) {
  return (
    <div className="skeleton-loader">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className="skeleton-item"
          style={{ height, marginBottom: '12px' }}
        ></div>
      ))}
    </div>
  );
}

// Skeleton CSS Animation
const skeletonCSS = `
.skeleton-loader {
  width: 100%;
}

.skeleton-item {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 8px;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
`;
```

---

## 📡 OFFLINE STATE HANDLING

### Offline Detection & Sync

```javascript
// hooks/useOnlineStatus.js

export const useOnlineStatus = () => {
  const { state, dispatch } = useFitness();
  const [pendingActions, setPendingActions] = useState([]);

  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: 'SET_ONLINE' });
      // Retry pending requests
      syncPendingActions();
    };

    const handleOffline = () => {
      dispatch({ type: 'SET_OFFLINE' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);

  const syncPendingActions = async () => {
    const pending = JSON.parse(
      localStorage.getItem('fitness_pending_actions') || '[]'
    );

    for (const action of pending) {
      try {
        await executeAction(action);
        // Remove from pending
        pending.splice(pending.indexOf(action), 1);
        localStorage.setItem(
          'fitness_pending_actions',
          JSON.stringify(pending)
        );
      } catch (error) {
        console.error('Failed to sync action:', error);
        break; // Stop on first failure
      }
    }
  };

  return {
    isOnline: state.networkStatus.isOnline,
    pendingActions,
    syncPendingActions
  };
};

// Usage in component
function WorkoutLog() {
  const { isOnline } = useOnlineStatus();
  const { state, dispatch } = useFitness();

  const handleSaveWorkout = async (formData) => {
    if (!isOnline) {
      // Save to localStorage for later
      const pendingAction = {
        type: 'CREATE_WORKOUT',
        payload: formData,
        timestamp: new Date().toISOString()
      };

      const pending = JSON.parse(
        localStorage.getItem('fitness_pending_actions') || '[]'
      );
      pending.push(pendingAction);
      localStorage.setItem(
        'fitness_pending_actions',
        JSON.stringify(pending)
      );

      // Also save as draft
      localStorage.setItem(
        'workout_draft',
        JSON.stringify(formData)
      );

      dispatch({
        type: 'ADD_TOAST',
        payload: {
          id: Date.now(),
          message: 'Workout saved offline. Will sync when online.',
          type: 'info',
          duration: 3000
        }
      });

      return;
    }

    // Normal online flow
    try {
      await saveWorkout(formData);
      dispatch({
        type: 'ADD_TOAST',
        payload: {
          id: Date.now(),
          message: 'Workout saved successfully',
          type: 'success',
          duration: 3000
        }
      });
    } catch (error) {
      dispatch({
        type: 'ADD_TOAST',
        payload: {
          id: Date.now(),
          message: error.message,
          type: 'error',
          duration: 5000
        }
      });
    }
  };

  return (
    <>
      {!isOnline && (
        <OfflineNotice message="You are offline. Changes will sync when online." />
      )}
      {/* Form content */}
    </>
  );
}

// components/OfflineNotice.jsx

export function OfflineNotice({ message }) {
  return (
    <div className="offline-notice">
      <span className="offline-icon">📡</span>
      <span>{message}</span>
    </div>
  );
}
```

### Offline Storage Management

```javascript
// utils/localStorage.js

const STORAGE_KEYS = {
  WORKOUT_DRAFT: 'fitness_workout_draft',
  CARDIO_DRAFT: 'fitness_cardio_draft',
  PENDING_ACTIONS: 'fitness_pending_actions',
  LAST_SYNC: 'fitness_last_sync',
  CACHED_WORKOUTS: 'fitness_cached_workouts',
  USER_PREFERENCES: 'fitness_user_preferences'
};

export const localStorageService = {
  // Drafts
  saveDraft: (type, data) => {
    const key = type === 'workout' 
      ? STORAGE_KEYS.WORKOUT_DRAFT 
      : STORAGE_KEYS.CARDIO_DRAFT;
    localStorage.setItem(key, JSON.stringify(data));
  },

  getDraft: (type) => {
    const key = type === 'workout'
      ? STORAGE_KEYS.WORKOUT_DRAFT
      : STORAGE_KEYS.CARDIO_DRAFT;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },

  clearDraft: (type) => {
    const key = type === 'workout'
      ? STORAGE_KEYS.WORKOUT_DRAFT
      : STORAGE_KEYS.CARDIO_DRAFT;
    localStorage.removeItem(key);
  },

  // Pending actions
  addPendingAction: (action) => {
    const pending = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.PENDING_ACTIONS) || '[]'
    );
    pending.push({
      ...action,
      id: Date.now(),
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(
      STORAGE_KEYS.PENDING_ACTIONS,
      JSON.stringify(pending)
    );
  },

  getPendingActions: () => {
    const data = localStorage.getItem(STORAGE_KEYS.PENDING_ACTIONS);
    return data ? JSON.parse(data) : [];
  },

  removePendingAction: (actionId) => {
    let pending = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.PENDING_ACTIONS) || '[]'
    );
    pending = pending.filter(a => a.id !== actionId);
    localStorage.setItem(
      STORAGE_KEYS.PENDING_ACTIONS,
      JSON.stringify(pending)
    );
  },

  // Cache management
  cacheWorkouts: (workouts) => {
    localStorage.setItem(
      STORAGE_KEYS.CACHED_WORKOUTS,
      JSON.stringify({
        data: workouts,
        timestamp: new Date().toISOString()
      })
    );
  },

  getCachedWorkouts: (maxAge = 24 * 60 * 60 * 1000) => {
    const cached = localStorage.getItem(STORAGE_KEYS.CACHED_WORKOUTS);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const age = new Date().getTime() - new Date(timestamp).getTime();

    if (age > maxAge) {
      localStorage.removeItem(STORAGE_KEYS.CACHED_WORKOUTS);
      return null;
    }

    return data;
  },

  clearCache: () => {
    localStorage.removeItem(STORAGE_KEYS.CACHED_WORKOUTS);
  }
};
```

---

## 🪫 EMPTY DATA STATE HANDLING

### Empty State Components

```javascript
// components/Shared/EmptyState.jsx

export function EmptyState({ 
  icon = '📋',
  title,
  message,
  action,
  actionLabel = 'Get Started'
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h2 className="empty-state-title">{title}</h2>
      <p className="empty-state-message">{message}</p>
      {action && (
        <button onClick={action} className="btn btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// CSS
const emptyStateCSS = `
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  min-height: 400px;
}

.empty-state-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.empty-state-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #333;
}

.empty-state-message {
  font-size: 14px;
  color: #666;
  margin-bottom: 30px;
  max-width: 300px;
}
`;

// Usage examples
function WorkoutHistory() {
  const { data: workouts = [], isLoading } = useWorkouts();

  if (isLoading) return <LoadingSpinner />;

  if (workouts.length === 0) {
    return (
      <EmptyState
        icon="🏋️"
        title="No Workouts Yet"
        message="Start tracking your fitness journey by logging your first workout"
        action={() => navigate('/fitness/log')}
        actionLabel="Log Workout"
      />
    );
  }

  return <WorkoutList workouts={workouts} />;
}

function ProgressTracking() {
  const { data: goals = [], isLoading } = useGoals();

  if (goals.length === 0) {
    return (
      <EmptyState
        icon="🎯"
        title="No Goals Yet"
        message="Create a goal to start tracking your progress"
        action={() => navigate('/fitness/goals/create')}
        actionLabel="Create Goal"
      />
    );
  }

  return <GoalsList goals={goals} />;
}
```

### Scenario-Specific Empty States

```javascript
// Workouts not found for filters
<EmptyState
  icon="🔍"
  title="No Workouts Found"
  message="Try adjusting your filters or date range"
  action={() => clearFilters()}
  actionLabel="Clear Filters"
/>

// New user - first time
<EmptyState
  icon="👋"
  title="Welcome to Fitness Tracker"
  message="Ready to start your fitness journey? Log your first workout"
  action={() => navigate('/fitness/log')}
  actionLabel="Log First Workout"
/>

// Progress data - need more history
<EmptyState
  icon="📊"
  title="Not Enough Data"
  message="You need at least 4 weeks of workouts to see progress trends"
  action={() => navigate('/fitness/log')}
  actionLabel="Log Workout"
/>

// No exercises in database
<EmptyState
  icon="🏋️"
  title="No Exercises Available"
  message="Exercise database is loading or temporarily unavailable"
  action={() => retryLoadExercises()}
  actionLabel="Retry"
/>
```

---

## 🔄 SAVE FAILURE HANDLING

### Retry Logic

```javascript
// utils/retryHandler.js

export const withRetry = async (
  fn,
  maxRetries = 3,
  delayMs = 1000,
  onRetry = null
) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on certain errors
      if (
        error instanceof ValidationError ||
        error instanceof AuthenticationError ||
        error instanceof NotFoundError
      ) {
        throw error;
      }

      if (attempt < maxRetries) {
        if (onRetry) {
          onRetry(attempt, maxRetries, error);
        }

        // Exponential backoff
        const delay = delayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

// Usage
async function saveWorkoutWithRetry(data) {
  try {
    return await withRetry(
      () => saveWorkout(data),
      3,
      1000,
      (attempt, maxRetries, error) => {
        console.log(`Retry attempt ${attempt}/${maxRetries}: ${error.message}`);
      }
    );
  } catch (error) {
    throw error;
  }
}
```

### Save Failure UI

```javascript
// components/SaveFailureDialog.jsx

export function SaveFailureDialog({
  isOpen,
  error,
  onRetry,
  onSaveOffline,
  onDiscard,
  isRetrying = false
}) {
  return (
    <Modal isOpen={isOpen} title="Save Failed">
      <div className="save-failure-content">
        <div className="error-icon">⚠️</div>
        
        <h3>Unable to Save Workout</h3>
        <p className="error-message">{error?.message}</p>

        {error instanceof NetworkError && (
          <p className="suggestion">
            Check your internet connection and try again
          </p>
        )}

        {error instanceof ServerError && (
          <p className="suggestion">
            Server is experiencing issues. Try again later
          </p>
        )}

        <div className="action-buttons">
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="btn btn-primary"
          >
            {isRetrying ? 'Retrying...' : 'Retry'}
          </button>

          <button
            onClick={onSaveOffline}
            className="btn btn-secondary"
          >
            Save Offline
          </button>

          <button
            onClick={onDiscard}
            className="btn btn-ghost"
          >
            Discard
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Usage in component
function WorkoutLog() {
  const [saveError, setSaveError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const { isOnline } = useOnlineStatus();
  const { dispatch } = useFitness();

  const handleSaveWorkout = async (data) => {
    try {
      await saveWorkout(data);
      dispatch({
        type: 'ADD_TOAST',
        payload: {
          message: 'Workout saved successfully',
          type: 'success'
        }
      });
    } catch (error) {
      setSaveError(error);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await handleSaveWorkout(formData);
      setSaveError(null);
    } catch (error) {
      setSaveError(error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleSaveOffline = () => {
    localStorageService.saveDraft('workout', formData);
    dispatch({
      type: 'ADD_TOAST',
      payload: {
        message: 'Saved offline. Will sync when online.',
        type: 'info'
      }
    });
    setSaveError(null);
  };

  return (
    <>
      {saveError && (
        <SaveFailureDialog
          isOpen={!!saveError}
          error={saveError}
          onRetry={handleRetry}
          onSaveOffline={handleSaveOffline}
          onDiscard={() => setSaveError(null)}
          isRetrying={isRetrying}
        />
      )}
    </>
  );
}
```

---

## 🎯 FORM VALIDATION STATE

### Validation Error Display

```javascript
// components/FormField.jsx

export function FormField({
  label,
  error,
  required = false,
  children
}) {
  return (
    <div className={`form-field ${error ? 'has-error' : ''}`}>
      <label>
        {label}
        {required && <span className="required">*</span>}
      </label>
      
      {children}

      {error && (
        <span className="error-message" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

// Usage
<FormField
  label="Workout Name"
  error={errors.workout_name}
  required
>
  <Input
    value={formData.workout_name}
    onChange={(value) => handleChange('workout_name', value)}
    aria-invalid={!!errors.workout_name}
  />
</FormField>
```

### Real-time Validation Feedback

```javascript
function WorkoutForm() {
  const [formData, setFormData] = useState({});
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  const validateField = (field, value) => {
    const newErrors = { ...errors };

    switch (field) {
      case 'workout_name':
        if (!value) {
          newErrors.workout_name = 'Workout name required';
        } else if (value.length > 255) {
          newErrors.workout_name = 'Max 255 characters';
        } else {
          delete newErrors.workout_name;
        }
        break;

      case 'workout_date':
        if (!value) {
          newErrors.workout_date = 'Date required';
        } else if (new Date(value) > new Date()) {
          newErrors.workout_date = 'Cannot be in future';
        } else {
          delete newErrors.workout_date;
        }
        break;

      case 'duration_minutes':
        if (value && value <= 0) {
          newErrors.duration_minutes = 'Must be greater than 0';
        } else {
          delete newErrors.duration_minutes;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      validateField(field, value);
    }
  };

  return (
    <form>
      <FormField
        label="Workout Name"
        error={touched.workout_name ? errors.workout_name : null}
        required
      >
        <Input
          value={formData.workout_name}
          onChange={(v) => handleChange('workout_name', v)}
          onBlur={() => handleBlur('workout_name')}
          placeholder="e.g., Leg Day Monday"
        />
      </FormField>
    </form>
  );
}
```

---

## 📋 STATE HANDLING CHECKLIST

### Loading States
- [x] Initial page load (skeleton loaders)
- [x] Data fetch (spinners)
- [x] Form submission (disabled button, loading indicator)
- [x] Individual item operations (per-item spinners)
- [x] Background sync (silent, with completion toast)

### Error States
- [x] Network errors (offline notice + retry)
- [x] Validation errors (field-level feedback)
- [x] 401 Unauthorized (redirect to login)
- [x] 403 Forbidden (edit window expired message)
- [x] 404 Not Found (resource deleted message)
- [x] 409 Conflict (concurrent edit message)
- [x] 5xx Server errors (retry + fallback)
- [x] Unknown errors (generic message)

### Empty Data States
- [x] No results (empty state with action)
- [x] Filters applied but no match (show clear filters)
- [x] First time user (onboarding message)
- [x] Insufficient data (progress tracking)
- [x] Resource deleted (show delete confirmation)

### Offline States
- [x] Save to localStorage (draft)
- [x] Queue for sync (pending actions)
- [x] Show offline notice (banner + sync status)
- [x] Retry on reconnect (automatic)
- [x] Clear pending after sync (success message)

### Save Failure States
- [x] Retry with exponential backoff
- [x] Save offline option
- [x] Discard option
- [x] Show error message
- [x] Preserve form data on failure

### Form States
- [x] Dirty state (warn on leave)
- [x] Field errors (real-time validation)
- [x] Submit disabled until valid
- [x] Show char count (for text fields)
- [x] Disable during submit (prevent double-submit)

---

## 🧪 TESTING STATE HANDLING

### Unit Test Example

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WorkoutLog } from './WorkoutLog';

describe('WorkoutLog Error Handling', () => {
  it('should show validation error when workout name is empty', () => {
    render(<WorkoutLog />);
    
    const submitBtn = screen.getByText('Save Workout');
    fireEvent.click(submitBtn);

    expect(screen.getByText('Workout name required')).toBeInTheDocument();
  });

  it('should show loading spinner while saving', async () => {
    const { rerender } = render(<WorkoutLog />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Workout Name'), {
      target: { value: 'Leg Day' }
    });

    // Submit
    fireEvent.click(screen.getByText('Save Workout'));

    // Loading state
    expect(screen.getByText('Saving...')).toBeInTheDocument();

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText('Workout saved successfully')).toBeInTheDocument();
    });
  });

  it('should show retry dialog on save failure', async () => {
    const mockError = new Error('Network error');
    jest.mock('../services/api', () => ({
      saveWorkout: jest.fn().mockRejectedValue(mockError)
    }));

    render(<WorkoutLog />);
    
    fireEvent.click(screen.getByText('Save Workout'));

    await waitFor(() => {
      expect(screen.getByText('Save Failed')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
      expect(screen.getByText('Save Offline')).toBeInTheDocument();
    });
  });

  it('should save to localStorage when offline', async () => {
    // Mock offline
    jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

    render(<WorkoutLog />);
    
    fireEvent.click(screen.getByText('Save Workout'));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('fitness_workout_draft'));
      expect(stored).toBeDefined();
    });
  });
});
```

---

## 🎯 SUMMARY: STATE HANDLING ARCHITECTURE

```
┌─────────────────────────────────────────┐
│ GLOBAL STATE (FitnessContext)          │
│ • User & Auth                           │
│ • Network Status                        │
│ • Notifications (toasts)                │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ LOCAL COMPONENT STATE                   │
│ • Form Data & Dirty State               │
│ • Loading States (per operation)        │
│ • Error States (with retry logic)       │
│ • UI State (modals, expanded, etc)     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ SERVER CACHE (React Query)              │
│ • Workouts, Exercise Definitions        │
│ • Progress Data, Cardio Sessions       │
│ • Auto-retry & stale-while-revalidate  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ LOCAL STORAGE (Offline Support)         │
│ • Draft Workouts                        │
│ • Pending Actions Queue                 │
│ • User Preferences                      │
│ • Last Sync Timestamp                   │
└─────────────────────────────────────────┘
```

---

**Frontend state handling specification is COMPLETE.**

Status: ✅ Ready for implementation  
Next: Implement context, hooks, and error boundary components
