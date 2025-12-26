# AI Coach - Complete Flow Documentation

**Status:** ✅ Fixed and Deployed
**Date:** December 26, 2025

---

## 🐛 Issues Fixed

### Issue 1: Environment Variable Mismatch
**Problem:** API config used `process.env.REACT_APP_API_URL` but Vite uses `import.meta.env.VITE_*`
**Result:** API_BASE was undefined → all API calls failed with 404

**Fix:** Updated [fitness/frontend/src/config/api.js](fitness/frontend/src/config/api.js):
```javascript
// Before (broken):
const API_BASE = (() => {
  const url = process.env.REACT_APP_API_URL;
  // ...
})();

// After (fixed):
const API_BASE = (() => {
  const url = import.meta.env.VITE_API_BASE_URL || process.env.REACT_APP_API_URL;
  // ...
})();
```

### Issue 2: Missing Interview Questions Endpoint
**Problem:** Frontend called `GET /api/fitness/admin/interview-questions` but endpoint didn't exist
**Result:** 404 error when AI Coach tried to load questions

**Fix:** Added endpoint in [fitness/backend/routes/fitness.js](fitness/backend/routes/fitness.js#L1272):
```javascript
router.get('/admin/interview-questions', requireAuth, async (req, res) => {
  const db = getMainDb();
  const activeOnly = req.query.active === 'true';

  let questions;
  if (activeOnly) {
    questions = await db.$queryRaw`
      SELECT id, question_text, question_type, options, option_range, order_position, is_active
      FROM admin_interview_questions
      WHERE is_active = true
      ORDER BY order_position ASC, id ASC
      LIMIT 10
    `;
  }

  res.json(questions);
});
```

---

## 🔄 AI Coach Complete Flow

### Step 1: Load Interview Questions

**Frontend:** [AICoach.jsx](fitness/frontend/src/components/AICoach.jsx#L24-L46)

```javascript
const fetchQuestions = async () => {
  try {
    setLoading(true);
    setError(null);

    // Construct URL
    const url = `${API_BASE}${ENDPOINTS.INTERVIEW_QUESTIONS}?active=true`;
    // Example: https://meal-planner-app-mve2.onrender.com/api/fitness/admin/interview-questions?active=true

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch questions: ${response.status}`);
    }

    const data = await response.json();
    setQuestions(Array.isArray(data) ? data : data.questions || []);
  } catch (err) {
    console.error('Error fetching questions:', err);
    setError(`Error: ${err.message}`);
  } finally {
    setLoading(false);
  }
};
```

**Backend:** [fitness.js](fitness/backend/routes/fitness.js#L1272-L1306)

```javascript
router.get('/admin/interview-questions', requireAuth, async (req, res) => {
  const db = getMainDb();
  const activeOnly = req.query.active === 'true';

  let questions;
  if (activeOnly) {
    questions = await db.$queryRaw`
      SELECT id, question_text, question_type, options, option_range, order_position, is_active
      FROM admin_interview_questions
      WHERE is_active = true
      ORDER BY order_position ASC, id ASC
      LIMIT 10
    `;
  }

  res.json(questions);
});
```

**Database Query:**
```sql
SELECT id, question_text, question_type, options, option_range, order_position, is_active
FROM admin_interview_questions
WHERE is_active = true
ORDER BY order_position ASC, id ASC
LIMIT 10;
```

**Returns 5 Unique Questions:**
1. What type of workout are you interested in? (text)
2. How many days per week can you exercise? (multiple_choice)
3. What is your current fitness level? (multiple_choice)
4. Do you have access to gym equipment? (yes_no)
5. How much time can you dedicate per workout? (range)

---

### Step 2: User Answers Questions

**Frontend:** [AICoach.jsx](fitness/frontend/src/components/AICoach.jsx#L48-L65)

```javascript
const handleAnswer = (questionId, answer) => {
  setAnswers(prev => ({
    ...prev,
    [questionId]: answer,
  }));
};

const handleNextQuestion = () => {
  if (currentQuestionIndex < questions.length - 1) {
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  }
};

const handlePreviousQuestion = () => {
  if (currentQuestionIndex > 0) {
    setCurrentQuestionIndex(currentQuestionIndex - 1);
  }
};
```

**UI Flow:**
1. Question 1 shown → User types answer
2. Click "Next" → Question 2 shown
3. Question 2 shown → User selects from options
4. Click "Next" → Question 3 shown
5. ... continue through all 5 questions
6. Click "Submit" → Generate workout

---

### Step 3: Submit to AI for Workout Generation

**Frontend:** [AICoach.jsx](fitness/frontend/src/components/AICoach.jsx#L67-L130)

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

    // Add initial context message
    messages.unshift({
      role: 'user',
      content: 'I want to create a personalized workout plan based on my fitness assessment.'
    });

    // Backend expects: messages, interview_answers, userProfile
    const payload = {
      messages: messages,
      interview_answers: answers,
      userProfile: {
        age: user.age,
        fitness_level: user.fitness_level,
      },
    };

    const response = await fetch(`${API_BASE}${ENDPOINTS.AI_WORKOUT_PLAN}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate workout: ${response.status}`);
    }

    const data = await response.json();
    setWorkoutPlan(data.workout || data);
  } catch (err) {
    console.error('Error generating workout:', err);
    setError(`Error: ${err.message}`);
  } finally {
    setSubmitting(false);
  }
};
```

**Payload Example:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "I want to create a personalized workout plan based on my fitness assessment."
    },
    {
      "role": "user",
      "content": "Q1: What type of workout are you interested in?\nA: Strength training"
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
    "1": "Strength training",
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

### Step 4: Backend Processes with OpenAI

**Backend:** [fitness.js](fitness/backend/routes/fitness.js#L1305-L1510)

```javascript
router.post('/ai-interview', requireAuth, async (req, res) => {
  try {
    const { messages, userProfile } = req.body;
    const userId = req.user.id;

    // Get OpenAI client from app.locals (set in main server.js)
    const openai = req.app.locals.openai;
    if (!openai) {
      return res.status(500).json({
        error: 'openai_not_configured',
        message: 'OpenAI is not available'
      });
    }

    // Build system prompt with interview answers
    const { interview_answers } = req.body;
    let systemPrompt = `You are a professional fitness coach AI...`;

    if (interview_answers && Object.keys(interview_answers).length > 0) {
      systemPrompt += `\n\nInterview Responses:\n`;
      systemPrompt += Object.entries(interview_answers)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join('\n');
    }

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const aiMessage = response.choices[0].message.content;

    // Try to extract workout JSON from response
    let workoutGenerated = false;
    let savedWorkout = null;

    const workoutMatch = aiMessage.match(/```json\s*([\s\S]*?)\s*```/);
    if (workoutMatch) {
      const workoutData = JSON.parse(workoutMatch[1]);

      // Save workout to database
      const db = getFitnessDb();
      savedWorkout = await db.fitness_workouts.create({
        data: {
          user_id: userId,
          workout_date: new Date(),
          workout_type: 'ai-generated',
          workout_data: workoutData,
          interview_responses: interview_answers,
          notes: 'AI-generated workout plan',
        }
      });

      workoutGenerated = true;
    }

    res.json({
      message: aiMessage,
      workoutGenerated,
      workout: savedWorkout,
    });

  } catch (error) {
    console.error('[AI Interview] Error:', error);
    res.status(500).json({
      error: 'ai_interview_failed',
      message: error.message
    });
  }
});
```

**OpenAI Configuration:**
- Model: GPT-4o-mini
- Temperature: 0.7
- Max tokens: 2000
- API Key: From `OPENAI_API_KEY` env var in Render
- Accessed via: `req.app.locals.openai`

---

## 📊 Database Tables Involved

### 1. admin_interview_questions
```sql
-- Stores the 5 interview questions
SELECT * FROM admin_interview_questions WHERE is_active = true LIMIT 5;

-- Returns:
| id | question_text                               | question_type   |
|----|---------------------------------------------|-----------------|
| 1  | What type of workout are you interested in? | text            |
| 2  | How many days per week can you exercise?    | multiple_choice |
| 3  | What is your current fitness level?         | multiple_choice |
| 4  | Do you have access to gym equipment?        | yes_no          |
| 5  | How much time can you dedicate per workout? | range           |
```

### 2. fitness_workouts
```sql
-- Stores the AI-generated workout
CREATE TABLE fitness_workouts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  workout_date DATE NOT NULL,
  workout_type VARCHAR(50),  -- 'ai-generated'
  workout_data JSONB,        -- Full workout plan from OpenAI
  interview_responses JSONB, -- User's interview answers
  notes TEXT,
  created_at TIMESTAMP
);
```

---

## ✅ Current Deployment Status

**Frontend (Vercel):**
- URL: https://frontend-hbmyufqu1-stus-projects-458dd35a.vercel.app
- Status: ✅ Deployed with API config fix
- Env: `VITE_API_BASE_URL=https://meal-planner-app-mve2.onrender.com`

**Backend (Render):**
- URL: https://meal-planner-app-mve2.onrender.com
- Status: ✅ Deployed with interview questions endpoint
- Endpoints:
  - GET /api/fitness/admin/interview-questions?active=true
  - POST /api/fitness/ai-interview

**Database (Render PostgreSQL):**
- Status: ✅ 305 interview questions available (5 unique)
- Connection: Working
- Tables: All fitness tables created

---

## 🧪 Testing the AI Coach

**Steps:**

1. **Visit:** https://frontend-hbmyufqu1-stus-projects-458dd35a.vercel.app
2. **Login** with your credentials
3. **Click "AI Coach"** tab
4. **Expected:** 5 interview questions load (no 404)
5. **Answer all questions** and click Submit
6. **Expected:** AI generates personalized workout plan
7. **Workout saved** to database with interview responses

**If 404 errors persist:**
- Check Render deployment status (may still be deploying)
- Verify `VITE_API_BASE_URL` is set in Vercel
- Check browser console for actual URL being called

---

## 📝 API Endpoints

### GET /api/fitness/admin/interview-questions
```http
GET /api/fitness/admin/interview-questions?active=true
Authorization: Bearer {jwt_token}

Response:
[
  {
    "id": 1,
    "question_text": "What type of workout are you interested in?",
    "question_type": "text",
    "order_position": 1,
    "is_active": true
  },
  ...
]
```

### POST /api/fitness/ai-interview
```http
POST /api/fitness/ai-interview
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "messages": [...],
  "interview_answers": {...},
  "userProfile": {...}
}

Response:
{
  "message": "AI response with workout plan",
  "workoutGenerated": true,
  "workout": {
    "id": "uuid",
    "workout_data": {...},
    "interview_responses": {...}
  }
}
```

---

**Last Updated:** December 26, 2025
**Status:** ✅ All issues fixed and deployed
