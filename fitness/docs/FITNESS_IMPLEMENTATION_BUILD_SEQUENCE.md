# FITNESS MODULE - IMPLEMENTATION BUILD SEQUENCE

## PHASE 0: PREPARATION (Pre-Development)

### JIRA-FIT-001: Create Prisma Schema File
- File: `prisma/schema.prisma` - Add fitness tables (workouts, workout_exercises, workout_sets, exercise_definitions, cardio_sessions)
- Reference: FITNESS_DATA_MODEL.md
- Deliverable: Complete schema with 5 tables, relationships, indexes

### JIRA-FIT-002: Create .env Configuration
- File: `.env.local` - Add FITNESS_API_BASE_URL, FITNESS_DB_CONNECTION
- Reference: PRODUCTION_CONFIG.md.example
- Deliverable: Environment variables configured

### JIRA-FIT-003: Create Prisma Migration
- Command: `npx prisma migrate dev --name init_fitness_tables`
- File: `prisma/migrations/*/migration.sql`
- Deliverable: Database schema deployed to PostgreSQL

### JIRA-FIT-004: Seed Exercise Definitions
- File: `scripts/seed-exercises.js`
- Reference: FITNESS_DATA_MODEL.md (exercise_definitions table)
- Deliverable: 100+ exercise definitions in database with categories, equipment, muscle groups

---

## PHASE 1: BACKEND FOUNDATION (API Layer)

### JIRA-FIT-005: Create Express Route Structure
- File: `server/routes/fitness.js`
- Reference: FITNESS_API_SPECIFICATION.md
- Deliverable: Route registration for 21 endpoints (stub handlers)

### JIRA-FIT-006: Implement Workout CRUD Endpoints
- Files: `server/routes/workouts.js`, `server/controllers/workoutController.js`
- Reference: FITNESS_API_SPECIFICATION.md (endpoints 1-5)
- Endpoints:
  - POST /api/fitness/workouts (create)
  - GET /api/fitness/workouts (list with pagination, filter, sort)
  - GET /api/fitness/workouts/:id (read)
  - PUT /api/fitness/workouts/:id (update with 24-hour window)
  - DELETE /api/fitness/workouts/:id (delete with 24-hour window)
- Deliverable: All 5 endpoints functional with validation

### JIRA-FIT-007: Implement Workout Exercise Endpoints
- File: `server/controllers/workoutExerciseController.js`
- Reference: FITNESS_API_SPECIFICATION.md (endpoints 6-8)
- Endpoints:
  - POST /api/fitness/workouts/:workoutId/exercises (add)
  - PUT /api/fitness/workouts/:workoutId/exercises/:exerciseId (update)
  - DELETE /api/fitness/workouts/:workoutId/exercises/:exerciseId (delete)
- Deliverable: All 3 endpoints functional

### JIRA-FIT-008: Implement Workout Set Endpoints
- File: `server/controllers/workoutSetController.js`
- Reference: FITNESS_API_SPECIFICATION.md (endpoints 9-11)
- Endpoints:
  - POST /api/fitness/workouts/:workoutId/exercises/:exerciseId/sets (add)
  - PUT /api/fitness/workouts/:workoutId/exercises/:exerciseId/sets/:setId (update)
  - DELETE /api/fitness/workouts/:workoutId/exercises/:exerciseId/sets/:setId (delete)
- Deliverable: All 3 endpoints functional

### JIRA-FIT-009: Implement Exercise Definition Endpoints
- File: `server/controllers/exerciseDefinitionController.js`
- Reference: FITNESS_API_SPECIFICATION.md (endpoints 12-13)
- Endpoints:
  - GET /api/fitness/exercises (list with filter)
  - GET /api/fitness/exercises/:id (read)
- Deliverable: Both endpoints functional

### JIRA-FIT-010: Implement Cardio Session Endpoints
- File: `server/controllers/cardioController.js`
- Reference: FITNESS_API_SPECIFICATION.md (endpoints 14-18)
- Endpoints:
  - POST /api/fitness/cardio (create)
  - GET /api/fitness/cardio (list with pagination, filter, sort)
  - GET /api/fitness/cardio/:id (read)
  - PUT /api/fitness/cardio/:id (update with 24-hour window)
  - DELETE /api/fitness/cardio/:id (delete with 24-hour window)
- Deliverable: All 5 endpoints functional

### JIRA-FIT-011: Implement Analytics Endpoints
- File: `server/controllers/analyticsController.js`
- Reference: FITNESS_API_SPECIFICATION.md (endpoints 19-21)
- Endpoints:
  - GET /api/fitness/progress/exercise-progress (calculate strength progress)
  - GET /api/fitness/progress/cardio-progress (calculate cardio progress)
  - GET /api/fitness/progress/weekly-summary (calculate weekly stats)
- Deliverable: All 3 endpoints functional

### JIRA-FIT-012: Add Error Handling Middleware
- Files: `server/middleware/errorHandler.js`, `server/utils/ApiError.js`
- Reference: FITNESS_STATE_HANDLING.md (error types section)
- Deliverable: Global error handler, custom error classes (ValidationError, NotFoundError, etc.)

### JIRA-FIT-013: Add Input Validation Middleware
- Files: `server/middleware/validateRequest.js`, `server/validators/fitnessValidators.js`
- Reference: FITNESS_API_SPECIFICATION.md (validation rules)
- Deliverable: Validation for all endpoints (date format, number ranges, required fields)

### JIRA-FIT-014: Add 24-Hour Edit Window Enforcement
- File: `server/middleware/enforceEditWindow.js`
- Reference: FITNESS_API_SPECIFICATION.md (PUT/DELETE endpoints)
- Deliverable: Middleware returns 403 for workouts/cardio edited > 24 hours ago

### JIRA-FIT-015: Add Authentication/Authorization Middleware
- File: `server/middleware/authenticateFitness.js`
- Deliverable: Verify JWT token, extract user_id, validate user owns resource

### JIRA-FIT-016: Test All 21 API Endpoints
- Files: `server/tests/fitness/*.test.js`
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (API Integration section)
- Deliverable: 100+ unit tests for all endpoints, edge cases, error scenarios

---

## PHASE 2: FRONTEND FOUNDATION (State & Hooks)

### JIRA-FIT-017: Create FitnessContext & Reducer
- Files: `client/src/context/FitnessContext.js`, `client/src/context/fitnessReducer.js`
- Reference: FITNESS_STATE_HANDLING.md (FitnessContext structure)
- Deliverable: Context with user, preferences, networkStatus, notifications; 10 reducer actions

### JIRA-FIT-018: Create Error Classes
- File: `client/src/utils/errors/FitnessErrors.js`
- Reference: FITNESS_STATE_HANDLING.md (8 error types)
- Deliverable: ValidationError, NetworkError, AuthenticationError, NotFoundError, ConflictError, EditWindowExpiredError, ServerError, FitnessError

### JIRA-FIT-019: Create useWorkouts Hook
- File: `client/src/hooks/useWorkouts.js`
- Reference: FITNESS_STATE_HANDLING.md, FITNESS_COMPONENT_ARCHITECTURE.md
- Deliverable: Hook with fetch, create, update, delete, list workouts; error handling, loading state

### JIRA-FIT-020: Create useCardio Hook
- File: `client/src/hooks/useCardio.js`
- Reference: FITNESS_STATE_HANDLING.md, FITNESS_COMPONENT_ARCHITECTURE.md
- Deliverable: Hook with fetch, create, update, delete, list cardio sessions; error handling, loading state

### JIRA-FIT-021: Create useProgress Hook
- File: `client/src/hooks/useProgress.js`
- Reference: FITNESS_STATE_HANDLING.md, FITNESS_COMPONENT_ARCHITECTURE.md
- Deliverable: Hook for fetching exercise progress, cardio progress, weekly summary

### JIRA-FIT-022: Create useExercises Hook
- File: `client/src/hooks/useExercises.js`
- Reference: FITNESS_STATE_HANDLING.md, FITNESS_COMPONENT_ARCHITECTURE.md
- Deliverable: Hook for fetching exercise definitions with caching

### JIRA-FIT-023: Create useFitnessState Hook
- File: `client/src/hooks/useFitnessState.js`
- Reference: FITNESS_STATE_HANDLING.md (4-layer architecture)
- Deliverable: Hook combining all state layers (Context, React Query, localStorage)

### JIRA-FIT-024: Create withRetry Utility
- File: `client/src/utils/withRetry.js`
- Reference: FITNESS_STATE_HANDLING.md (retry logic section)
- Deliverable: Function wrapper with exponential backoff (1s, 2s, 4s delays), 3 max retries

### JIRA-FIT-025: Create localStorage Service
- File: `client/src/services/localStorageService.js`
- Reference: FITNESS_STATE_HANDLING.md (localStorage keys section)
- Deliverable: Service for saving/loading WORKOUT_DRAFT, CARDIO_DRAFT, PENDING_ACTIONS, CACHED_WORKOUTS

### JIRA-FIT-026: Create Online Status Hook
- File: `client/src/hooks/useOnlineStatus.js`
- Reference: FITNESS_STATE_HANDLING.md (offline support section)
- Deliverable: Hook tracking navigator.onLine with event listeners

### JIRA-FIT-027: Create Error Boundary Component
- File: `client/src/components/common/ErrorBoundary.js`
- Reference: FITNESS_STATE_HANDLING.md (error handling section)
- Deliverable: Component catching errors, displaying fallback UI

### JIRA-FIT-028: Test All Hooks & State Management
- Files: `client/src/hooks/__tests__/*.test.js`, `client/src/context/__tests__/*.test.js`
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Performance, Edge Cases sections)
- Deliverable: 80+ unit tests for hooks, context, error handling

---

## PHASE 3: FRONTEND COMPONENTS (UI Layer - Page Components)

### JIRA-FIT-029: Create Dashboard Page Component
- File: `client/src/pages/fitness/Dashboard.js`
- Reference: FITNESS_WIREFRAMES_SPECIFICATIONS.md (implied main page), FITNESS_COMPONENT_ARCHITECTURE.md
- Deliverable: Component with recent workouts, stats overview, quick action buttons

### JIRA-FIT-030: Create WorkoutLog Page Component
- File: `client/src/pages/fitness/WorkoutLog.js`
- Reference: FITNESS_WIREFRAMES_SPECIFICATIONS.md (Workout Log Screen), FITNESS_STEP_BY_STEP_FLOWS.md (Log Workout flow)
- Deliverable: Page with date picker, exercise form, exercise list, save button

### JIRA-FIT-031: Create WorkoutHistory Page Component
- File: `client/src/pages/fitness/WorkoutHistory.js`
- Reference: FITNESS_WIREFRAMES_SPECIFICATIONS.md (History List Screen), FITNESS_STEP_BY_STEP_FLOWS.md (View History flow)
- Deliverable: Page with filter bar, workout list, pagination, detail modal on click

### JIRA-FIT-032: Create WeeklySummary Page Component
- File: `client/src/pages/fitness/WeeklySummary.js`
- Reference: FITNESS_WIREFRAMES_SPECIFICATIONS.md (Weekly Summary Screen), FITNESS_STEP_BY_STEP_FLOWS.md (Weekly Summary flow)
- Deliverable: Page with week selector, stat cards, tabs (Strength/Cardio), tab content

### JIRA-FIT-033: Create ProgressTracking Page Component
- File: `client/src/pages/fitness/ProgressTracking.js`
- Reference: FITNESS_STEP_BY_STEP_FLOWS.md (Progress Tracking flow), FITNESS_COMPONENT_ARCHITECTURE.md
- Deliverable: Page with exercise selector, progress chart, goal display, metrics

### JIRA-FIT-034: Create CardioLog Page Component
- File: `client/src/pages/fitness/CardioLog.js`
- Reference: FITNESS_COMPONENT_ARCHITECTURE.md, FITNESS_API_SPECIFICATION.md (cardio endpoints)
- Deliverable: Page for logging cardio sessions (type, duration, distance, intensity)

---

## PHASE 4: FRONTEND COMPONENTS (UI Layer - Form Components)

### JIRA-FIT-035: Create WorkoutForm Component
- File: `client/src/components/fitness/forms/WorkoutForm.js`
- Reference: FITNESS_WIREFRAMES_SPECIFICATIONS.md, FITNESS_COMPONENT_ARCHITECTURE.md
- Deliverable: Form with date picker, workout name, description, exercises section

### JIRA-FIT-036: Create CardioForm Component
- File: `client/src/components/fitness/forms/CardioForm.js`
- Reference: FITNESS_COMPONENT_ARCHITECTURE.md
- Deliverable: Form with type dropdown, duration, distance, intensity inputs

### JIRA-FIT-037: Create ExerciseList Component
- File: `client/src/components/fitness/forms/ExerciseList.js`
- Reference: FITNESS_COMPONENT_ARCHITECTURE.md
- Deliverable: Dynamic list of exercises with add/remove buttons, drag-to-reorder

### JIRA-FIT-038: Create ExerciseCard Component
- File: `client/src/components/fitness/forms/ExerciseCard.js`
- Reference: FITNESS_COMPONENT_ARCHITECTURE.md
- Deliverable: Card displaying exercise name, description, set inputs

### JIRA-FIT-039: Create SetTable Component
- File: `client/src/components/fitness/forms/SetTable.js`
- Reference: FITNESS_COMPONENT_ARCHITECTURE.md
- Deliverable: Table for exercise sets (set number, reps, weight, RPE, notes)

### JIRA-FIT-040: Create SetRow Component
- File: `client/src/components/fitness/forms/SetRow.js`
- Reference: FITNESS_COMPONENT_ARCHITECTURE.md
- Deliverable: Single set row with input fields

### JIRA-FIT-041: Create Input Component
- File: `client/src/components/common/Input.js`
- Deliverable: Reusable input with validation display, error message

### JIRA-FIT-042: Create Select Component
- File: `client/src/components/common/Select.js`
- Deliverable: Reusable select dropdown with options

### JIRA-FIT-043: Create DatePicker Component
- File: `client/src/components/common/DatePicker.js`
- Deliverable: Reusable date picker with calendar UI

### JIRA-FIT-044: Create TextArea Component
- File: `client/src/components/common/TextArea.js`
- Deliverable: Reusable textarea for notes/descriptions

### JIRA-FIT-045: Create NumberInput Component
- File: `client/src/components/common/NumberInput.js`
- Deliverable: Reusable number input with validation (min, max)

### JIRA-FIT-046: Test All Form Components
- Files: `client/src/components/fitness/forms/__tests__/*.test.js`, `client/src/components/common/__tests__/*.test.js`
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Form Layout & Input section)
- Deliverable: 100+ unit tests for forms, validation, submit handlers

---

## PHASE 5: FRONTEND COMPONENTS (UI Layer - Modal Components)

### JIRA-FIT-047: Create ExerciseModal Component
- File: `client/src/components/fitness/modals/ExerciseModal.js`
- Reference: FITNESS_WIREFRAMES_SPECIFICATIONS.md (Exercise Entry Modal), FITNESS_COMPONENT_ARCHITECTURE.md
- Deliverable: Modal with search box, exercise categories, exercise list, select button

### JIRA-FIT-048: Create WorkoutDetailModal Component
- File: `client/src/components/fitness/modals/WorkoutDetailModal.js`
- Reference: FITNESS_COMPONENT_ARCHITECTURE.md
- Deliverable: Modal displaying full workout details with edit/delete buttons

### JIRA-FIT-049: Create CardioDetailModal Component
- File: `client/src/components/fitness/modals/CardioDetailModal.js`
- Reference: FITNESS_COMPONENT_ARCHITECTURE.md
- Deliverable: Modal displaying full cardio session details with edit/delete buttons

### JIRA-FIT-050: Create ConfirmDialog Component
- File: `client/src/components/common/ConfirmDialog.js`
- Reference: FITNESS_STATE_HANDLING.md (error handling section)
- Deliverable: Reusable confirmation dialog (Yes/No/Cancel options)

### JIRA-FIT-051: Create SaveFailureDialog Component
- File: `client/src/components/fitness/modals/SaveFailureDialog.js`
- Reference: FITNESS_STATE_HANDLING.md (save failure handling section)
- Deliverable: Dialog with options: Retry, Save Offline, Discard

### JIRA-FIT-052: Create EditWindowExpiredDialog Component
- File: `client/src/components/fitness/modals/EditWindowExpiredDialog.js`
- Reference: FITNESS_STATE_HANDLING.md (24-hour edit window section)
- Deliverable: Dialog notifying user edit window expired with OK button

---

## PHASE 6: FRONTEND COMPONENTS (UI Layer - Shared Components)

### JIRA-FIT-053: Create Button Component
- File: `client/src/components/common/Button.js`
- Deliverable: Reusable button with variants (primary, secondary, danger), sizes

### JIRA-FIT-054: Create Modal Component
- File: `client/src/components/common/Modal.js`
- Deliverable: Reusable modal wrapper with backdrop, close button

### JIRA-FIT-055: Create Chart Component
- File: `client/src/components/common/Chart.js`
- Reference: FITNESS_WIREFRAMES_SPECIFICATIONS.md (Charts & Visualization), FITNESS_COMPONENT_ARCHITECTURE.md
- Deliverable: Wrapper for Chart.js/Recharts with responsive sizing

### JIRA-FIT-056: Create ErrorBanner Component
- File: `client/src/components/common/ErrorBanner.js`
- Reference: FITNESS_STATE_HANDLING.md (error handling section)
- Deliverable: Banner displaying error message with close button

### JIRA-FIT-057: Create LoadingSpinner Component
- File: `client/src/components/common/LoadingSpinner.js`
- Deliverable: Animated spinner with optional overlay

### JIRA-FIT-058: Create SkeletonLoader Component
- File: `client/src/components/common/SkeletonLoader.js`
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (perceived performance)
- Deliverable: Skeleton screens for perceived performance during loading

### JIRA-FIT-059: Create Toast Component
- File: `client/src/components/common/Toast.js`
- Deliverable: Toast notification with auto-dismiss, types (success, error, warning, info)

### JIRA-FIT-060: Create StatCard Component
- File: `client/src/components/fitness/common/StatCard.js`
- Reference: FITNESS_WIREFRAMES_SPECIFICATIONS.md (Weekly Summary with stat cards)
- Deliverable: Card displaying single statistic (label, value, icon)

### JIRA-FIT-061: Create TabsComponent
- File: `client/src/components/common/Tabs.js`
- Reference: FITNESS_WIREFRAMES_SPECIFICATIONS.md (Weekly Summary tab bar)
- Deliverable: Tabs component with active state, content switching

### JIRA-FIT-062: Create FilterBar Component
- File: `client/src/components/fitness/common/FilterBar.js`
- Reference: FITNESS_WIREFRAMES_SPECIFICATIONS.md (History List Screen)
- Deliverable: Component with filter inputs (date, type, status), apply button

### JIRA-FIT-063: Create EmptyState Component
- File: `client/src/components/common/EmptyState.js`
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (empty data section)
- Deliverable: Component for empty list states with action button

### JIRA-FIT-064: Create Pagination Component
- File: `client/src/components/common/Pagination.js`
- Deliverable: Component with previous/next buttons, page indicators

### JIRA-FIT-065: Test All Shared Components
- Files: `client/src/components/common/__tests__/*.test.js`, `client/src/components/fitness/common/__tests__/*.test.js`
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (UI/UX Verification section)
- Deliverable: 120+ unit tests for all shared components

---

## PHASE 7: INTEGRATION & NAVIGATION

### JIRA-FIT-066: Create Fitness Routes Structure
- File: `client/src/routes/fitnessRoutes.js`
- Deliverable: Route configuration for 6 pages (Dashboard, WorkoutLog, History, Summary, Progress, CardioLog)

### JIRA-FIT-067: Add Fitness Routes to Main Router
- File: `client/src/App.js` or `client/src/routes/index.js`
- Deliverable: Mount fitness routes at `/fitness/*` path

### JIRA-FIT-068: Create Navigation Menu Items
- File: `client/src/components/Navigation.js` (update)
- Deliverable: Add fitness menu items (Log Workout, History, Summary, Progress, Cardio)

### JIRA-FIT-069: Create Fitness Navigation Sidebar
- File: `client/src/components/fitness/FitnessNav.js`
- Deliverable: Sidebar with fitness module links, active state highlighting

### JIRA-FIT-070: Integrate FitnessContext Provider
- File: `client/src/App.js` (wrap app with FitnessProvider)
- Deliverable: FitnessContext available to all fitness components

### JIRA-FIT-071: Test Navigation & Routing
- Files: `client/src/routes/__tests__/*.test.js`
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Navigation & Layout section)
- Deliverable: 30+ tests for navigation, routing, active states

---

## PHASE 8: OFFLINE SUPPORT & SYNC

### JIRA-FIT-072: Implement Draft Auto-Save
- File: `client/src/hooks/useDraftAutoSave.js`
- Reference: FITNESS_STATE_HANDLING.md (offline support section)
- Deliverable: Hook auto-saving form data to localStorage every 30 seconds

### JIRA-FIT-073: Implement Pending Action Queue
- File: `client/src/services/pendingActionQueue.js`
- Reference: FITNESS_STATE_HANDLING.md (pending queue section)
- Deliverable: Service queuing failed API calls, storing in localStorage

### JIRA-FIT-074: Implement Auto-Sync on Connection Restore
- File: `client/src/hooks/useSyncOnlineStatus.js`
- Reference: FITNESS_STATE_HANDLING.md (offline support section)
- Deliverable: Hook triggering sync of pending actions when connection restored

### JIRA-FIT-075: Create Offline Indicator UI
- File: `client/src/components/fitness/OfflineIndicator.js`
- Reference: FITNESS_STATE_HANDLING.md (offline support section)
- Deliverable: Component showing "Offline - Changes will sync when online"

### JIRA-FIT-076: Test Offline Functionality
- Files: `client/src/hooks/__tests__/useDraftAutoSave.test.js`, `client/src/services/__tests__/pendingActionQueue.test.js`, `client/src/hooks/__tests__/useSyncOnlineStatus.test.js`
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Offline/Sync section)
- Deliverable: 40+ tests for offline scenarios, sync recovery, draft preservation

---

## PHASE 9: STYLING & RESPONSIVE DESIGN

### JIRA-FIT-077: Create Fitness Module CSS/SCSS
- File: `client/src/styles/fitness/index.scss` (or CSS files per component)
- Reference: FITNESS_WIREFRAMES_SPECIFICATIONS.md (color palette, spacing)
- Deliverable: Styles for all components, responsive breakpoints (375px, 768px, 1920px)

### JIRA-FIT-078: Create Tailwind Config (if using Tailwind)
- File: `tailwind.config.js` (extend config for fitness module)
- Deliverable: Custom colors, spacing, components for fitness module

### JIRA-FIT-079: Implement Responsive Layout
- Files: All component files (update)
- Reference: FITNESS_WIREFRAMES_SPECIFICATIONS.md (responsive design section)
- Deliverable: Mobile-first styles, media queries for tablet/desktop

### JIRA-FIT-080: Test Responsive Design
- Tools: Chrome DevTools, BrowserStack
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Device Testing section)
- Deliverable: Visual testing on 375px, 768px, 1024px, 1920px viewports

---

## PHASE 10: VALIDATION & ERROR HANDLING

### JIRA-FIT-081: Create Form Validation Utilities
- File: `client/src/utils/validation/fitnessValidators.js`
- Reference: FITNESS_API_SPECIFICATION.md (validation rules section)
- Deliverable: Functions validating dates, numbers, required fields, ranges

### JIRA-FIT-082: Implement Real-Time Validation Feedback
- Files: All form components (update)
- Reference: FITNESS_STATE_HANDLING.md (form validation section)
- Deliverable: Error messages displayed as user types, cleared on valid input

### JIRA-FIT-083: Implement Error Toast Notifications
- Files: All page components (add error toast triggers)
- Reference: FITNESS_STATE_HANDLING.md (error handling section)
- Deliverable: Toast notifications for all error scenarios

### JIRA-FIT-084: Implement Edit Window Countdown UI
- File: `client/src/components/fitness/EditWindowCountdown.js`
- Reference: FITNESS_STATE_HANDLING.md (24-hour edit window section)
- Deliverable: Component showing time remaining for edit/delete operations

### JIRA-FIT-085: Test Error Handling End-to-End
- Files: `client/src/__tests__/e2e/*.test.js`
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Error States section)
- Deliverable: 50+ tests for all error scenarios, recovery paths

---

## PHASE 11: PERFORMANCE OPTIMIZATION

### JIRA-FIT-086: Implement Code Splitting
- File: `client/src/pages/fitness/index.js` (lazy load pages)
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Performance section)
- Deliverable: Dynamic imports for all fitness pages, split bundles by route

### JIRA-FIT-087: Implement Component Memoization
- Files: All component files (add React.memo())
- Reference: FITNESS_COMPONENT_ARCHITECTURE.md
- Deliverable: Memoized components to prevent unnecessary re-renders

### JIRA-FIT-088: Implement useMemo/useCallback Hooks
- Files: All hook files (optimize hook dependencies)
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Performance section)
- Deliverable: Memoized values/callbacks to prevent re-computations

### JIRA-FIT-089: Implement Virtual Scrolling for Large Lists
- File: `client/src/components/fitness/common/VirtualWorkoutList.js`
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Performance section)
- Deliverable: Virtual scrolling for history lists > 100 items

### JIRA-FIT-090: Optimize API Caching Strategy
- File: `client/src/utils/cacheConfig.js`
- Reference: FITNESS_STATE_HANDLING.md (4-layer architecture section)
- Deliverable: React Query cache config (5-30min TTL per resource)

### JIRA-FIT-091: Run Lighthouse Performance Audit
- Tool: Chrome Lighthouse
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Performance Metrics section)
- Deliverable: Achieve Lighthouse scores >90 (FCP <1.5s, LCP <2.5s, TTI <3.5s)

---

## PHASE 12: ACCESSIBILITY & SECURITY

### JIRA-FIT-092: Add ARIA Labels & Roles
- Files: All component files (add aria-label, role, aria-describedby)
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Accessibility section)
- Deliverable: All interactive elements have proper ARIA attributes

### JIRA-FIT-093: Implement Keyboard Navigation
- Files: All component files (add tabindex, keyboard handlers)
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Keyboard nav section)
- Deliverable: Full keyboard navigation, focus visible styles

### JIRA-FIT-094: Test with Screen Readers
- Tool: NVDA, JAWS, VoiceOver
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Screen reader section)
- Deliverable: Test report verifying screen reader compatibility

### JIRA-FIT-095: Verify Color Contrast
- Tool: Color Contrast Analyzer
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Color contrast section)
- Deliverable: All text meets WCAG AA standards (4.5:1 for normal text)

### JIRA-FIT-096: Implement HTTPS & Secure Headers
- File: `server/middleware/securityHeaders.js`
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Security section)
- Deliverable: X-Frame-Options, X-Content-Type-Options, CSP headers

### JIRA-FIT-097: Implement Rate Limiting
- File: `server/middleware/rateLimiter.js`
- Reference: FITNESS_API_SPECIFICATION.md (rate limiting section)
- Deliverable: 100 req/min per user, 1000 req/hour rate limits

### JIRA-FIT-098: Implement CSRF Protection
- File: `server/middleware/csrfProtection.js`
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Security section)
- Deliverable: CSRF tokens validated on POST/PUT/DELETE requests

### JIRA-FIT-099: Test Accessibility & Security
- Files: `client/src/__tests__/accessibility/*.test.js`, `server/tests/security/*.test.js`
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Accessibility & Security sections)
- Deliverable: 60+ tests for accessibility, security vulnerabilities

---

## PHASE 13: COMPREHENSIVE TESTING

### JIRA-FIT-100: Unit Tests - All Components
- Files: `client/src/components/__tests__/**/*.test.js`
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (UI/UX section)
- Coverage Target: 80%
- Deliverable: 200+ unit tests for all 45 components

### JIRA-FIT-101: Unit Tests - All Hooks
- Files: `client/src/hooks/__tests__/**/*.test.js`
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Data Persistence section)
- Coverage Target: 85%
- Deliverable: 100+ unit tests for all 5 custom hooks

### JIRA-FIT-102: Unit Tests - All Utilities
- Files: `client/src/utils/__tests__/**/*.test.js`
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Data Persistence section)
- Coverage Target: 90%
- Deliverable: 80+ unit tests for validators, errors, helpers

### JIRA-FIT-103: Integration Tests - API Layer
- Files: `server/tests/integration/**/*.test.js`
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (API Integration section)
- Deliverable: 100+ integration tests for all 21 endpoints

### JIRA-FIT-104: Integration Tests - Frontend/Backend
- Files: `client/src/__tests__/integration/**/*.test.js`
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (API Integration section)
- Deliverable: 50+ tests for API call flow, error handling, data fetching

### JIRA-FIT-105: E2E Tests - User Workflows
- Files: `e2e/tests/**/*.spec.js` (Cypress/Playwright)
- Reference: FITNESS_STEP_BY_STEP_FLOWS.md, FITNESS_VERIFICATION_CHECKLIST.md (Test Cases section)
- Deliverable: 10+ E2E tests for 5 primary user flows (Log, View, Edit, Summary, Progress)

### JIRA-FIT-106: E2E Tests - Error Scenarios
- Files: `e2e/tests/error-scenarios/**/*.spec.js`
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Edge Cases section)
- Deliverable: 20+ E2E tests for network errors, validation, offline sync

### JIRA-FIT-107: Performance Tests
- Files: `client/src/__tests__/performance/*.test.js`, Lighthouse audits
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Performance Metrics section)
- Deliverable: Performance benchmarks (FCP, LCP, TTI, bundle size)

### JIRA-FIT-108: Device & Browser Testing
- Devices: iPhone 12, iPad Pro, Desktop (Chrome, Safari, Firefox)
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Device Testing section)
- Deliverable: Cross-device/browser compatibility test report

---

## PHASE 14: DOCUMENTATION & HANDOFF

### JIRA-FIT-109: Create API Documentation
- File: `docs/FITNESS_API_DOCUMENTATION.md`
- Reference: FITNESS_API_SPECIFICATION.md
- Deliverable: Full API docs with cURL examples, authentication, rate limits

### JIRA-FIT-110: Create Component Storybook
- Files: `client/src/components/**/*.stories.js`
- Deliverable: Storybook with all 45 components, states, props variations

### JIRA-FIT-111: Create Developer Setup Guide
- File: `docs/FITNESS_DEVELOPER_SETUP.md`
- Deliverable: Instructions for local development, database setup, running tests

### JIRA-FIT-112: Create User Guide
- File: `docs/FITNESS_USER_GUIDE.md`
- Deliverable: User instructions for logging workouts, viewing history, tracking progress

### JIRA-FIT-113: Create Troubleshooting Guide
- File: `docs/FITNESS_TROUBLESHOOTING.md`
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Common issues)
- Deliverable: Guide for common issues, debugging, support

### JIRA-FIT-114: Create Architecture Decision Records (ADRs)
- Files: `docs/adr/**/*.md`
- Deliverable: ADRs for major decisions (Context API vs Redux, offline strategy, etc.)

### JIRA-FIT-115: Update Project README
- File: `README.md` (add Fitness Module section)
- Deliverable: Overview of fitness module, quick start, key features

---

## PHASE 15: DEPLOYMENT & MONITORING

### JIRA-FIT-116: Configure Environment Variables
- Files: `.env.example`, `.env.production`
- Deliverable: All config variables documented, production values set

### JIRA-FIT-117: Run Full Test Suite
- Command: `npm test -- --coverage`
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Pre-Production Checklist section)
- Deliverable: All tests passing, >80% coverage

### JIRA-FIT-118: Run Security Audit
- Command: `npm audit`, OWASP ZAP scan
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Security section)
- Deliverable: No critical vulnerabilities, remediation plan for warnings

### JIRA-FIT-119: Run Accessibility Audit
- Tool: axe DevTools, WAVE
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Accessibility section)
- Deliverable: Zero critical accessibility issues, full WCAG AA compliance

### JIRA-FIT-120: Deploy to Staging
- Command: `git push origin main` → CI/CD pipeline
- Reference: PHASE_1_DEPLOYMENT_GUIDE.md, RENDER_DEPLOYMENT.md
- Deliverable: Fitness module running on staging environment

### JIRA-FIT-121: Run Smoke Tests on Staging
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Pre-Production Checklist section)
- Deliverable: 20+ smoke tests passing on staging

### JIRA-FIT-122: Performance Test on Staging
- Tool: k6, Artillery
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Performance Metrics section)
- Deliverable: Load test report, capacity estimates

### JIRA-FIT-123: Setup Monitoring & Logging
- Tools: Sentry, LogRocket, Google Analytics
- Deliverable: Error tracking, performance monitoring, user analytics configured

### JIRA-FIT-124: Deploy to Production
- Command: Render deployment from main branch
- Reference: RENDER_DEPLOYMENT.md
- Deliverable: Fitness module live in production

### JIRA-FIT-125: Setup Alerts & Escalation
- Tools: PagerDuty, Slack integration
- Deliverable: Alerts for errors, performance degradation, security issues

### JIRA-FIT-126: Post-Deployment Verification
- Reference: FITNESS_VERIFICATION_CHECKLIST.md (Complete checklist)
- Deliverable: Production environment passes all 130+ verification points

---

## BUILD SEQUENCE SUMMARY

| Phase | Tickets | Focus | Dependencies |
|-------|---------|-------|--------------|
| 0 | FIT-001 to FIT-004 | Preparation | None |
| 1 | FIT-005 to FIT-016 | Backend API | Phase 0 complete |
| 2 | FIT-017 to FIT-028 | Frontend State | Phase 1 APIs available |
| 3 | FIT-029 to FIT-034 | Page Components | Phase 2 hooks ready |
| 4 | FIT-035 to FIT-046 | Form Components | Phase 2 hooks ready |
| 5 | FIT-047 to FIT-052 | Modal Components | Phase 2 hooks ready |
| 6 | FIT-053 to FIT-065 | Shared Components | Phase 2 hooks ready |
| 7 | FIT-066 to FIT-071 | Navigation & Routing | Phases 3-6 complete |
| 8 | FIT-072 to FIT-076 | Offline Support | Phases 2-7 complete |
| 9 | FIT-077 to FIT-080 | Styling & Responsive | Phases 3-8 complete |
| 10 | FIT-081 to FIT-085 | Validation & Errors | Phases 1-9 complete |
| 11 | FIT-086 to FIT-091 | Performance | Phases 1-10 complete |
| 12 | FIT-092 to FIT-099 | Accessibility & Security | Phases 1-11 complete |
| 13 | FIT-100 to FIT-108 | Testing | Phases 1-12 complete |
| 14 | FIT-109 to FIT-115 | Documentation | Phases 1-13 complete |
| 15 | FIT-116 to FIT-126 | Deployment & Monitoring | Phases 1-14 complete |

---

## CRITICAL PATH

**Minimum viable build sequence (13 weeks, single developer):**

**Week 1:** FIT-001 to FIT-004 (Preparation) + FIT-005 to FIT-016 (API)
**Week 2-3:** FIT-017 to FIT-046 (State, Page, Form Components)
**Week 4:** FIT-047 to FIT-065 (Modal, Shared Components)
**Week 5:** FIT-066 to FIT-085 (Navigation, Offline, Validation)
**Week 6:** FIT-077 to FIT-091 (Styling, Performance)
**Week 7:** FIT-092 to FIT-099 (Accessibility, Security)
**Week 8-10:** FIT-100 to FIT-108 (Testing - Unit, Integration, E2E)
**Week 11:** FIT-109 to FIT-115 (Documentation)
**Week 12-13:** FIT-116 to FIT-126 (Deployment, Monitoring, Production Verification)

---

## RESOURCE REFERENCES

**All specifications can be found in:**
- `FITNESS_DATA_MODEL.md` - Database schema
- `FITNESS_STEP_BY_STEP_FLOWS.md` - User workflows
- `FITNESS_API_SPECIFICATION.md` - Backend API design
- `FITNESS_WIREFRAMES_SPECIFICATIONS.md` - UI layouts
- `FITNESS_COMPONENT_ARCHITECTURE.md` - React components
- `FITNESS_STATE_HANDLING.md` - State management patterns
- `FITNESS_VERIFICATION_CHECKLIST.md` - Testing & QA checklist

