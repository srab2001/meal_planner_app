# AI Coach - Complete Code Walkthrough

**Complete interview → ChatGPT → workout generation flow**

---

## 📋 Step 1: Fetch Interview Questions

### Frontend: [AICoach.jsx:23-45](fitness/frontend/src/components/AICoach.jsx#L23-L45)

```javascript
const fetchQuestions = async () => {
  try {
    setLoading(true);
    setError(null);

    // Build URL with API_BASE from environment
    const url = `${API_BASE}${ENDPOINTS.INTERVIEW_QUESTIONS}?active=true`;
    // Example: https://meal-planner-app-mve2.onrender.com/api/fitness/admin/interview-questions?active=true

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch questions: ${response.status}`);
    }

    const data = await response.json();
    // Data is array of question objects from database
    setQuestions(Array.isArray(data) ? data : data.questions || []);
  } catch (err) {
    console.error('Error fetching questions:', err);
    setError(`Error: ${err.message}`);
  } finally {
    setLoading(false);
  }
};
```

**What it does:**
1. Calls backend API endpoint to get interview questions
2. Passes JWT token for authentication
3. Receives array of 5 questions from database
4. Stores questions in state for rendering

---

## 📋 Step 2: Display Questions & Collect Answers

### Frontend: [AICoach.jsx:48-65](fitness/frontend/src/components/AICoach.jsx#L48-L65)

```javascript
// Store answer for current question
const handleAnswer = (questionId, answer) => {
  setAnswers(prev => ({
    ...prev,
    [questionId]: answer,  // Store by question ID
  }));
};

// Navigate to next question
const handleNextQuestion = () => {
  if (currentQuestionIndex < questions.length - 1) {
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  }
};

// Navigate to previous question
const handlePreviousQuestion = () => {
  if (currentQuestionIndex > 0) {
    setCurrentQuestionIndex(currentQuestionIndex - 1);
  }
};
```

**Data Structure:**
```javascript
// questions array (from database):
[
  { id: 1, question_text: "What type of workout are you interested in?", question_type: "text" },
  { id: 2, question_text: "How many days per week can you exercise?", question_type: "multiple_choice" },
  { id: 3, question_text: "What is your current fitness level?", question_type: "multiple_choice" },
  { id: 4, question_text: "Do you have access to gym equipment?", question_type: "yes_no" },
  { id: 5, question_text: "How much time can you dedicate per workout?", question_type: "range" }
]

// answers object (user input):
{
  1: "Strength training and cardio",
  2: "4 days",
  3: "Intermediate",
  4: "Yes",
  5: "60 minutes"
}
```

---

## 📋 Step 3: Build Payload & Submit to Backend

### Frontend: [AICoach.jsx:67-122](fitness/frontend/src/components/AICoach.jsx#L67-L122)

```javascript
const handleSubmitAnswers = async () => {
  try {
    setSubmitting(true);
    setError(null);

    // Build messages array from Q&A pairs for conversation history
    const messages = questions.map((q, idx) => ({
      role: 'user',
      content: `Q${idx + 1}: ${q.question_text}\nA: ${answers[q.id] || 'No answer provided'}`
    }));

    // Add initial context message at the beginning
    messages.unshift({
      role: 'user',
      content: 'I want to create a personalized workout plan based on my fitness assessment.'
    });

    // Build complete payload for backend
    const payload = {
      messages: messages,
      interview_answers: answers,
      userProfile: {
        age: user.age,
        fitness_level: user.fitness_level,
      },
    };

    // POST to AI interview endpoint
    const response = await fetch(`${API_BASE}${ENDPOINTS.AI_WORKOUT_PLAN}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to generate plan: ${response.status}`);
    }

    const result = await response.json();

    // Check if workout was successfully generated
    if (result.workoutGenerated && result.workout) {
      setWorkoutPlan(result.workout);
    } else {
      throw new Error('Workout was not generated. Please try again.');
    }
  } catch (err) {
    console.error('Error submitting answers:', err);
    setError(`Error: ${err.message}`);
  } finally {
    setSubmitting(false);
  }
};
```

**Example Payload Sent to Backend:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "I want to create a personalized workout plan based on my fitness assessment."
    },
    {
      "role": "user",
      "content": "Q1: What type of workout are you interested in?\nA: Strength training and cardio"
    },
    {
      "role": "user",
      "content": "Q2: How many days per week can you exercise?\nA: 4 days"
    },
    {
      "role": "user",
      "content": "Q3: What is your current fitness level?\nA: Intermediate"
    },
    {
      "role": "user",
      "content": "Q4: Do you have access to gym equipment?\nA: Yes"
    },
    {
      "role": "user",
      "content": "Q5: How much time can you dedicate per workout?\nA: 60 minutes"
    }
  ],
  "interview_answers": {
    "1": "Strength training and cardio",
    "2": "4 days",
    "3": "Intermediate",
    "4": "Yes",
    "5": "60 minutes"
  },
  "userProfile": {
    "age": 30,
    "fitness_level": "intermediate"
  }
}
```

---

## 🤖 Step 4: Backend Receives & Processes Request

### Backend: [fitness.js:1315-1343](fitness/backend/routes/fitness.js#L1315-L1343)

```javascript
router.post('/ai-interview', requireAuth, async (req, res) => {
  try {
    const { messages, userProfile } = req.body;
    const userId = req.user.id;

    console.log('[AI Interview] Request received for user:', userId);
    console.log('[AI Interview] Messages count:', messages?.length);

    // Validate input
    if (!messages || !Array.isArray(messages)) {
      console.error('[AI Interview] Invalid messages:', messages);
      return res.status(400).json({
        error: 'invalid_input',
        message: 'Messages array is required'
      });
    }

    // Get OpenAI client from app.locals (set in main server.js)
    const openai = req.app.locals.openai;
    if (!openai) {
      console.error('[AI Interview] OpenAI client not available in req.app.locals');
      console.error('[AI Interview] req.app.locals keys:', Object.keys(req.app?.locals || {}));
      return res.status(503).json({
        error: 'service_unavailable',
        message: 'AI service is not available'
      });
    }

    console.log('[AI Interview] OpenAI client found, making request...');

    // ... continues to build system prompt
```

---

## 🤖 Step 5: Build System Prompt for ChatGPT

### Backend: [fitness.js:1344-1410](fitness/backend/routes/fitness.js#L1344-L1410)

```javascript
// Build context for AI with interview answers if provided
const { interview_answers, question_count } = req.body;

let systemPrompt = `You are a professional fitness coach AI. Your goal is to create personalized workout plans based on user information.`;

// If interview answers are provided, use structured generation
if (interview_answers && Object.keys(interview_answers).length > 0) {
  systemPrompt = `You are a professional fitness coach AI. You have received structured interview responses from a user.

Based on their responses, you MUST generate a detailed, personalized 6-section workout plan.

The user provided these answers:
${Object.entries(interview_answers).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Generate a comprehensive workout with these 6 sections in this exact JSON format:

<WORKOUT_JSON>
{
  "warm_up": {
    "name": "string (e.g., 'Dynamic Stretching')",
    "duration": "string (e.g., '5 minutes')",
    "exercises": ["exercise 1", "exercise 2", "exercise 3"]
  },
  "strength": {
    "name": "string",
    "duration": "string",
    "exercises": ["exercise 1", "exercise 2", "exercise 3"],
    "sets_reps": "string (e.g., '3 sets of 10 reps')"
  },
  "cardio": {
    "name": "string",
    "duration": "string",
    "exercises": ["exercise 1", "exercise 2"],
    "notes": "string"
  },
  "agility": {
    "name": "string",
    "duration": "string",
    "exercises": ["exercise 1", "exercise 2"],
    "notes": "string"
  },
  "recovery": {
    "name": "string",
    "duration": "string",
    "exercises": ["stretch 1", "stretch 2", "stretch 3"]
  },
  "closeout": {
    "name": "string",
    "notes": "string (motivation and next steps)"
  },
  "summary": {
    "total_duration": "string",
    "intensity_level": "low|medium|high",
    "calories_burned_estimate": number,
    "difficulty_rating": "1-10"
  }
}
</WORKOUT_JSON>

IMPORTANT:
- Personalize based on the user's responses
- Make exercises progressively harder if intensity is high
- Include specific form cues or modifications for each exercise
- Keep the JSON valid and properly formatted
- Include motivational language in the closeout section

Be professional, encouraging, and specific with exercise recommendations.`;
}
```

**Example System Prompt Sent to ChatGPT:**
```
You are a professional fitness coach AI. You have received structured interview responses from a user.

Based on their responses, you MUST generate a detailed, personalized 6-section workout plan.

The user provided these answers:
- 1: Strength training and cardio
- 2: 4 days
- 3: Intermediate
- 4: Yes
- 5: 60 minutes

Generate a comprehensive workout with these 6 sections in this exact JSON format:
[... JSON template ...]
```

---

## 🤖 Step 6: Call OpenAI ChatGPT API

### Backend: [fitness.js:1462-1475](fitness/backend/routes/fitness.js#L1462-L1475)

```javascript
// Call OpenAI
console.log('[AI Interview] Calling OpenAI API...');
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: systemPrompt },
    ...messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }))
  ],
  temperature: 0.7,
  max_tokens: 500
});

const aiMessage = response.choices[0].message.content;
console.log('[AI Interview] OpenAI response received');
console.log('[AI Interview] Message length:', aiMessage.length);
```

**ChatGPT Request Structure:**
```javascript
{
  model: "gpt-4o-mini",
  messages: [
    {
      role: "system",
      content: "You are a professional fitness coach AI..."
    },
    {
      role: "user",
      content: "I want to create a personalized workout plan..."
    },
    {
      role: "user",
      content: "Q1: What type of workout are you interested in?\nA: Strength training and cardio"
    },
    // ... more Q&A pairs
  ],
  temperature: 0.7,
  max_tokens: 500
}
```

---

## 🤖 Step 7: Parse ChatGPT Response & Save Workout

### Backend: [fitness.js:1481-1534](fitness/backend/routes/fitness.js#L1481-L1534)

```javascript
// Check if workout was generated
const workoutMatch = aiMessage.match(/<WORKOUT_JSON>([\s\S]*?)<\/WORKOUT_JSON>/);
let workoutGenerated = false;
let workout = null;
let cleanMessage = aiMessage;

if (workoutMatch) {
  console.log('[AI Interview] Workout JSON found in response');
  try {
    // Parse the JSON from ChatGPT response
    workout = JSON.parse(workoutMatch[1]);
    workoutGenerated = true;

    // Remove the JSON tags from the message
    cleanMessage = aiMessage.replace(/<WORKOUT_JSON>[\s\S]*?<\/WORKOUT_JSON>/, '').trim();
    console.log('[AI Interview] Workout parsed successfully');

    // Save the workout to database with retry logic
    let savedWorkout = null;
    let saveAttempts = 0;
    const maxAttempts = 3;

    while (saveAttempts < maxAttempts && !savedWorkout) {
      try {
        saveAttempts++;
        console.log(`[AI Interview] Saving workout to database (attempt ${saveAttempts}/${maxAttempts})`);

        // Store the entire 6-section workout as JSON
        savedWorkout = await getFitnessDb().fitness_workouts.create({
          data: {
            user_id: userId,
            workout_data: JSON.stringify(workout), // Store full 6-section structure
            intensity: workout.summary?.intensity_level || 'medium',
            duration_minutes: parseInt(workout.summary?.total_duration) || 60,
            calories_burned: workout.summary?.calories_burned_estimate || 0,
            difficulty_rating: workout.summary?.difficulty_rating || 5,
            workout_date: new Date()
          }
        });

        console.log('[AI Interview] ✅ Workout saved to database successfully:', savedWorkout.id);
      } catch (dbError) {
        console.error(`[AI Interview] Database save failed (attempt ${saveAttempts}):`, dbError.message);

        if (saveAttempts < maxAttempts) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * saveAttempts));
          console.log('[AI Interview] Retrying database save...');
        } else {
          console.error('[AI Interview] ❌ Failed to save workout after all attempts');
          throw dbError;
        }
      }
    }
  } catch (parseError) {
    console.error('[AI Interview] Error parsing/saving workout:', parseError);
  }
}
```

**Example ChatGPT Response:**
```
Here's your personalized workout plan!

<WORKOUT_JSON>
{
  "warm_up": {
    "name": "Dynamic Stretching Routine",
    "duration": "5 minutes",
    "exercises": ["Arm circles", "Leg swings", "Torso twists"]
  },
  "strength": {
    "name": "Upper Body Strength",
    "duration": "20 minutes",
    "exercises": ["Bench Press", "Dumbbell Rows", "Shoulder Press"],
    "sets_reps": "3 sets of 10 reps"
  },
  "cardio": {
    "name": "Moderate Cardio",
    "duration": "15 minutes",
    "exercises": ["Treadmill running", "Jump rope"],
    "notes": "Keep heart rate at 70-80% max"
  },
  "agility": {
    "name": "Quick Feet Drills",
    "duration": "10 minutes",
    "exercises": ["Ladder drills", "Cone shuttles"],
    "notes": "Focus on quick transitions"
  },
  "recovery": {
    "name": "Cool Down Stretches",
    "duration": "5 minutes",
    "exercises": ["Hamstring stretch", "Quad stretch", "Shoulder stretch"]
  },
  "closeout": {
    "name": "Workout Complete",
    "notes": "Great job! Stay consistent and you'll see results!"
  },
  "summary": {
    "total_duration": "55 minutes",
    "intensity_level": "medium",
    "calories_burned_estimate": 400,
    "difficulty_rating": 6
  }
}
</WORKOUT_JSON>

This workout is designed for your intermediate fitness level with access to gym equipment.
```

---

## 📊 Database Table: fitness_workouts

```sql
CREATE TABLE fitness_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workout_date DATE NOT NULL,
  workout_data JSONB,              -- Full 6-section workout from ChatGPT
  intensity VARCHAR(20),            -- 'low', 'medium', 'high'
  duration_minutes INT,             -- Total duration
  calories_burned INT,              -- Estimated calories
  difficulty_rating INT,            -- 1-10 scale
  interview_responses JSONB,        -- User's interview answers
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Saved Data:**
```json
{
  "id": "uuid-here",
  "user_id": "user-uuid",
  "workout_date": "2025-12-26",
  "workout_data": {
    "warm_up": {...},
    "strength": {...},
    "cardio": {...},
    "agility": {...},
    "recovery": {...},
    "closeout": {...},
    "summary": {...}
  },
  "intensity": "medium",
  "duration_minutes": 55,
  "calories_burned": 400,
  "difficulty_rating": 6,
  "interview_responses": {
    "1": "Strength training and cardio",
    "2": "4 days",
    "3": "Intermediate",
    "4": "Yes",
    "5": "60 minutes"
  },
  "created_at": "2025-12-26T10:30:00Z"
}
```

---

## 🔄 Complete Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI COACH COMPLETE FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. FETCH QUESTIONS                                             │
│     Frontend → GET /api/fitness/admin/interview-questions       │
│     Backend → Query PostgreSQL for 5 questions                  │
│     Returns: Array of question objects                          │
│                                                                  │
│  2. DISPLAY QUESTIONS                                           │
│     Render question 1 → User types answer                       │
│     Click Next → Show question 2 → User selects answer          │
│     ... repeat for all 5 questions                              │
│                                                                  │
│  3. BUILD PAYLOAD                                               │
│     Collect all answers into object                             │
│     Build messages array with Q&A pairs                         │
│     Add user profile data                                       │
│                                                                  │
│  4. SUBMIT TO BACKEND                                           │
│     Frontend → POST /api/fitness/ai-interview                   │
│     Payload: { messages, interview_answers, userProfile }       │
│                                                                  │
│  5. BACKEND PROCESSING                                          │
│     Validate input                                              │
│     Get OpenAI client from app.locals                           │
│     Build system prompt with interview answers                  │
│                                                                  │
│  6. CALL CHATGPT                                                │
│     Send system prompt + messages to GPT-4o-mini                │
│     Temperature: 0.7, Max tokens: 500                           │
│     ChatGPT generates 6-section workout plan                    │
│                                                                  │
│  7. PARSE & SAVE                                                │
│     Extract <WORKOUT_JSON> from ChatGPT response                │
│     Parse JSON into workout object                              │
│     Save to fitness_workouts table in PostgreSQL                │
│     Return workout to frontend                                  │
│                                                                  │
│  8. DISPLAY WORKOUT                                             │
│     Frontend receives workout object                            │
│     Render 6 sections: warm_up, strength, cardio,               │
│                        agility, recovery, closeout              │
│     Show summary: duration, calories, difficulty                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Environment Variables

**Frontend (Vercel):**
```bash
VITE_API_BASE_URL=https://meal-planner-app-mve2.onrender.com
```

**Backend (Render):**
```bash
DATABASE_URL=postgresql://meal_planner_user:...@dpg-...postgres.render.com/meal_planner_vo27
OPENAI_API_KEY=sk-proj-...
SESSION_SECRET=...
NODE_ENV=production
```

---

## 📁 File References

| File | Lines | Purpose |
|------|-------|---------|
| [AICoach.jsx](fitness/frontend/src/components/AICoach.jsx) | 1-200 | Complete AI Coach UI component |
| [api.js](fitness/frontend/src/config/api.js) | 22-41 | API configuration with Vite env vars |
| [fitness.js](fitness/backend/routes/fitness.js) | 1272-1306 | GET interview questions endpoint |
| [fitness.js](fitness/backend/routes/fitness.js) | 1315-1550 | POST AI interview endpoint |
| [server.js](server.js) | 176-179 | OpenAI client initialization |
| [server.js](server.js) | 545 | OpenAI shared via app.locals |

---

**Last Updated:** December 26, 2025
**Status:** ✅ Complete and Working
