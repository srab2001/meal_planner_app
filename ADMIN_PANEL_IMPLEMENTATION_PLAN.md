# AI Coach Admin Panel & Structured Workout Feature - Implementation Plan

## 🎯 Feature Overview

### Part 1: Admin Panel for Interview Questions
Admins can configure the questions AI Coach asks during workout planning interviews.

### Part 2: Structured Workout Template
AI Coach generates detailed, multi-section workout plans with:
- Warm-Up section
- Strength section
- Cardio/Pool section
- Agility/Core section
- Recovery section
- Session closeout

---

## 📋 Detailed Requirements

### Example Admin-Configurable Questions
```
1. What is the main goal: strength, conditioning, mobility, recovery?
2. Any surgeries or injuries?
3. Where will the workout happen: gym, pool, home?
4. How many days per week?
5. How hard should the sessions be?
```

### Structured Workout Template

#### Header
- Workout Name
- Day
- Total Duration
- Primary Goal Summary

#### Warm-Up Section
- Exercise Name
- Sets / Time
- Short How-To Text
- Checkbox (Completed)
- Notes Field

#### Strength Section
- Exercise Name
- Sets
- Reps
- Equipment
- Target Muscles
- Actual Sets/Reps Input (tracking)
- Pain Scale (0–10)

#### Cardio / Pool Section
- Activity Name
- Time or Distance
- Heart Rate Intent
- Completion Checkbox

#### Agility / Core Section
- Name
- Sets / Time
- Balance or Core Indicator
- Completion Checkbox

#### Recovery Section
- Stretch Name
- Duration
- Steam / Sauna Toggle

#### Session Closeout (Footer)
- Session Completed (yes/no)
- Effort Score (1–10)
- Session Notes
- Save Button

---

## 🏗️ Implementation Tasks

### Task 1: Database Schema
**File**: `migrations/XXX_create_admin_questions_and_structured_workouts.sql`

#### Tables to Create:

1. **admin_interview_questions**
   ```sql
   CREATE TABLE admin_interview_questions (
     id SERIAL PRIMARY KEY,
     question_text TEXT NOT NULL,
     question_type VARCHAR(50), -- 'text', 'multiple_choice', 'yes_no'
     options JSONB, -- For multiple choice
     order_position INT,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **structured_workouts**
   ```sql
   CREATE TABLE structured_workouts (
     id SERIAL PRIMARY KEY,
     user_id UUID NOT NULL,
     workout_date DATE,
     workout_name VARCHAR(255),
     day_label VARCHAR(50),
     total_duration_minutes INT,
     primary_goal_summary TEXT,
     
     -- Session data
     session_completed BOOLEAN,
     effort_score INT, -- 1-10
     session_notes TEXT,
     
     -- Sections (JSONB for flexibility)
     warm_up_section JSONB,
     strength_section JSONB,
     cardio_pool_section JSONB,
     agility_core_section JSONB,
     recovery_section JSONB,
     
     -- Interview responses
     interview_responses JSONB,
     
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     FOREIGN KEY (user_id) REFERENCES users(id)
   );
   ```

3. **workout_exercises_detailed**
   ```sql
   CREATE TABLE workout_exercises_detailed (
     id SERIAL PRIMARY KEY,
     structured_workout_id SERIAL,
     section_type VARCHAR(50), -- 'warm_up', 'strength', 'cardio', etc
     exercise_name VARCHAR(255),
     
     -- Common fields
     sets INT,
     time_minutes INT,
     completed BOOLEAN DEFAULT false,
     notes TEXT,
     
     -- Strength-specific
     reps INT,
     equipment VARCHAR(255),
     target_muscles TEXT,
     actual_sets INT,
     actual_reps INT,
     pain_scale INT, -- 0-10
     
     -- Cardio-specific
     distance_km DECIMAL,
     heart_rate_intent VARCHAR(50),
     
     -- Recovery-specific
     is_stretch BOOLEAN,
     steam_sauna BOOLEAN,
     
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     FOREIGN KEY (structured_workout_id) REFERENCES structured_workouts(id)
   );
   ```

### Task 2: Backend APIs

#### Admin Questions Management

**File**: `routes/admin-questions.js` (NEW)

```javascript
// GET /api/admin/questions - List all questions
router.get('/questions', adminAuth, async (req, res) => {
  // Fetch all questions ordered by position
});

// POST /api/admin/questions - Create question
router.post('/questions', adminAuth, async (req, res) => {
  // Create new question
});

// PUT /api/admin/questions/:id - Update question
router.put('/questions/:id', adminAuth, async (req, res) => {
  // Update question
});

// DELETE /api/admin/questions/:id - Delete question
router.delete('/questions/:id', adminAuth, async (req, res) => {
  // Delete question (soft or hard)
});

// GET /api/admin/questions/preview - Preview for AI Coach
router.get('/questions/preview', async (req, res) => {
  // Return active questions for AI Coach
});
```

#### AI Coach Interview

**File**: Update `fitness/backend/routes/fitness.js`

```javascript
// Modified AI Interview endpoint
router.post('/ai-interview', requireAuth, async (req, res) => {
  // 1. Fetch admin-configured questions
  // 2. Build system prompt with answers from interview
  // 3. Call ChatGPT to generate structured workout
  // 4. Parse and save to database
});
```

#### Structured Workout Endpoints

**File**: `routes/structured-workouts.js` (NEW)

```javascript
// GET /api/fitness/structured-workouts - List user's workouts
router.get('/structured-workouts', requireAuth, async (req, res) => {
  // Fetch all structured workouts for user
});

// POST /api/fitness/structured-workouts - Save new workout
router.post('/structured-workouts', requireAuth, async (req, res) => {
  // Save generated workout
});

// PUT /api/fitness/structured-workouts/:id - Update workout
router.put('/structured-workouts/:id', requireAuth, async (req, res) => {
  // Update progress, completed exercises, etc
});

// GET /api/fitness/structured-workouts/:id - Get single workout
router.get('/structured-workouts/:id', requireAuth, async (req, res) => {
  // Fetch detailed workout
});
```

### Task 3: Frontend Components

#### Admin Panel

**File**: `client/src/modules/admin/AdminCoachPanel.js` (NEW)

```javascript
export default function AdminCoachPanel() {
  // Sections:
  // 1. List of all questions
  // 2. Add new question form
  // 3. Edit question modal
  // 4. Delete confirmation
  // 5. Preview of interview flow
  // 6. Reorder questions (drag-drop)
}
```

#### Updated AI Coach Interview

**File**: Update `client/src/modules/fitness/components/AIWorkoutInterview.js`

```javascript
// Changes:
// 1. Fetch admin-configured questions
// 2. Display questions in order
// 3. Collect all answers
// 4. Send to backend with all responses
// 5. Display generated structured workout
```

#### Structured Workout Display

**File**: `client/src/modules/fitness/components/StructuredWorkoutView.js` (NEW)

```javascript
export default function StructuredWorkoutView({ workoutId }) {
  // Sections:
  // 1. Header (name, day, duration, goal)
  // 2. Warm-Up with checkboxes and notes
  // 3. Strength with sets/reps/pain tracking
  // 4. Cardio/Pool with time/distance tracking
  // 5. Agility/Core with checkboxes
  // 6. Recovery/Stretches
  // 7. Session closeout form
  // 8. Save button
}
```

---

## 🔄 Data Flow

### Create Workout Flow
```
1. User clicks "AI Coach"
2. Fetch admin-configured questions from backend
3. Display questions in order
4. User answers each question
5. User submits
6. Send all answers to backend
7. Backend sends to ChatGPT with answers as context
8. ChatGPT generates structured workout JSON
9. Save to structured_workouts table
10. Frontend displays StructuredWorkoutView
```

### Save Workout Progress Flow
```
1. User completes exercises and fills in details
2. User marks exercises as "Completed"
3. User enters pain scales, effort scores, notes
4. User clicks "Save Workout"
5. Frontend sends updated data to backend
6. Backend saves to structured_workouts and workout_exercises_detailed
7. Show confirmation
```

---

## 💬 ChatGPT System Prompt

```
You are a professional fitness coach creating a detailed workout plan.

Based on the user's interview responses:
{interview_responses_json}

Create a comprehensive workout plan in the following JSON format:

{
  "workoutName": "string",
  "day": "string", // e.g., "Monday"
  "totalDurationMinutes": number,
  "primaryGoalSummary": "string",
  
  "warmUpSection": [
    {
      "exerciseName": "string",
      "setsTime": "3 x 30 seconds",
      "howToText": "string",
      "notes": ""
    }
  ],
  
  "strengthSection": [
    {
      "exerciseName": "string",
      "sets": number,
      "reps": number,
      "equipment": "string",
      "targetMuscles": "string",
      "notes": ""
    }
  ],
  
  "cardioPoolSection": [
    {
      "activityName": "string",
      "timeOrDistance": "string",
      "heartRateIntent": "string",
      "notes": ""
    }
  ],
  
  "agilityCore": [
    {
      "name": "string",
      "setsTime": "string",
      "balanceCoreIndicator": "string",
      "notes": ""
    }
  ],
  
  "recoverySection": [
    {
      "stretchName": "string",
      "durationSeconds": number,
      "steamSaunaToggle": false,
      "notes": ""
    }
  ]
}

Ensure all recommendations are specific, safe, and aligned with the user's goals and limitations.
```

---

## 🛠️ Technology Stack

- **Backend**: Node.js/Express, Prisma ORM, PostgreSQL
- **Frontend**: React, React Hooks, Tailwind CSS
- **AI**: OpenAI GPT-3.5-turbo
- **Admin Auth**: JWT + Role-based access control

---

## ✅ Implementation Checklist

### Phase 1: Database & Backend (Week 1)
- [ ] Create database migrations
- [ ] Create admin questions endpoints
- [ ] Create structured workouts endpoints
- [ ] Update AI interview endpoint
- [ ] Add admin role to users table
- [ ] Create admin auth middleware

### Phase 2: Frontend Admin Panel (Week 2)
- [ ] Build questions list component
- [ ] Build add/edit question forms
- [ ] Build delete functionality
- [ ] Build preview panel
- [ ] Add drag-drop for reordering

### Phase 3: AI Coach Updates (Week 2)
- [ ] Update AI Coach to fetch admin questions
- [ ] Update system prompt
- [ ] Test with structured format
- [ ] Add error handling

### Phase 4: Workout Display (Week 3)
- [ ] Build StructuredWorkoutView component
- [ ] Build warm-up section with checkboxes
- [ ] Build strength section with tracking
- [ ] Build cardio/pool section
- [ ] Build agility/core section
- [ ] Build recovery section
- [ ] Build closeout form

### Phase 5: Testing & Deployment (Week 3)
- [ ] Integration testing
- [ ] User acceptance testing
- [ ] Deploy to Vercel/Render
- [ ] Create documentation

---

## 📚 Files to Create/Modify

### New Files
```
migrations/XXX_create_admin_tables.sql
routes/admin-questions.js
routes/structured-workouts.js
client/src/modules/admin/AdminCoachPanel.js
client/src/modules/admin/styles/AdminCoachPanel.css
client/src/modules/fitness/components/StructuredWorkoutView.js
client/src/modules/fitness/components/StructuredWorkoutView.css
client/src/modules/fitness/components/WorkoutSectionWarmUp.js
client/src/modules/fitness/components/WorkoutSectionStrength.js
client/src/modules/fitness/components/WorkoutSectionCardio.js
client/src/modules/fitness/components/WorkoutSectionAgilityCore.js
client/src/modules/fitness/components/WorkoutSectionRecovery.js
client/src/modules/fitness/components/WorkoutSectionCloseout.js
```

### Modified Files
```
server.js (mount new routes)
fitness/backend/routes/fitness.js (update AI interview)
client/src/modules/fitness/components/AIWorkoutInterview.js
client/src/modules/fitness/FitnessDashboard.js (add navigation)
prisma/schema.prisma (add new models)
```

---

## 🚀 Success Criteria

✅ Admin can create, edit, delete interview questions  
✅ Admin can preview interview flow  
✅ AI Coach asks admin-configured questions  
✅ Structured workout generated with all 6 sections  
✅ User can track workout progress  
✅ User can input pain scales, effort scores, notes  
✅ All data persists to database  
✅ Mobile-responsive UI  
✅ Comprehensive error handling  

---

## 📞 Questions/Decisions Needed

1. Should admins have role-based access? (Yes/No)
2. Should question order be draggable? (Yes/No)
3. Should workouts be duplicatable? (Yes/No)
4. Should we support multiple workout programs? (Yes/No)
5. Should we have templates (e.g., "Beginner", "Advanced")? (Yes/No)

---

**Status**: Ready for implementation  
**Estimated Timeline**: 3 weeks for full feature  
**Priority**: High - Core feature expansion  
**Risk Level**: Medium - Multiple new components

