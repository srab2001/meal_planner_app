# Phase 3 Implementation - Code Reference

This document provides a quick reference to all code created and modified in Phase 3.

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| **Files Created** | 5 |
| **Files Modified** | 3 |
| **New Components** | 4 |
| **Total New Lines** | ~1,300 |
| **CSS Added** | 275 lines |
| **Documentation** | 730+ lines |

---

## Component Relationships

```
AIWorkoutInterview.js (Main Container)
├── Imports TextQuestionDisplay.js
├── Imports MultipleChoiceDisplay.js  
├── Imports YesNoDisplay.js
└── Imports RangeDisplay.js

Each question display component:
├── Receives question prop from parent
├── Receives onAnswer callback
├── Receives disabled flag from parent
└── Calls onAnswer(userInput) on submission
```

---

## AIWorkoutInterview.js - Key Functions

### 1. initializeInterview()
```javascript
- Fetches /api/admin/questions/active
- Sorts questions by order_position
- Sets initial assistant message
- Falls back to default question if none exist
```

### 2. handleAnswerQuestion(answer)
```javascript
- Records answer in answers{} by question ID
- Adds user message to messages array
- Increments currentQuestionIndex OR calls generateWorkout()
- Provides continuous feedback to user
```

### 3. generateWorkout(collectedAnswers)
```javascript
- Builds interview_answers object from responses
- POSTs to /api/fitness/ai-interview with:
  * interview_answers (structured responses)
  * question_count
  * userProfile
  * messages
- Parses 6-section <WORKOUT_JSON> from response
- Saves workout data
- Triggers 3-second countdown
- Calls onWorkoutGenerated callback
```

### 4. renderCurrentQuestion()
```javascript
- Uses switch statement on question_type
- Renders appropriate display component:
  * 'text' → TextQuestionDisplay
  * 'multiple_choice' → MultipleChoiceDisplay
  * 'yes_no' → YesNoDisplay
  * 'range' → RangeDisplay
  * default → TextQuestionDisplay (fallback)
- Passes disabled prop during loading
```

---

## Component Specifications

### TextQuestionDisplay.js
**Purpose**: Render free-form text question with textarea

**Props**:
- `question`: {id, question_text}
- `onAnswer(answer)`: Callback with string value
- `disabled`: Boolean

**Behavior**:
- Textarea with placeholder
- Ctrl+Enter / Cmd+Enter to submit
- "Continue →" button
- Trimmed answer to prevent whitespace

### MultipleChoiceDisplay.js
**Purpose**: Render single-select question with radio buttons

**Props**:
- `question`: {id, question_text, options: string[]}
- `onAnswer(selectedOption)`: Callback with selected string
- `disabled`: Boolean

**Behavior**:
- Dynamic radio button generation from options
- Immediate onAnswer() on selection
- Hover highlight on options
- Disabled state handling

### YesNoDisplay.js
**Purpose**: Render binary yes/no question

**Props**:
- `question`: {id, question_text}
- `onAnswer(yesOrNo)`: Callback with "Yes" or "No" string
- `disabled`: Boolean

**Behavior**:
- Two distinct buttons (green Yes, red No)
- Icon indicators (✅ / ❌)
- Immediate onAnswer() on click
- Full-width responsive layout

### RangeDisplay.js
**Purpose**: Render numeric scale question with slider

**Props**:
- `question`: {id, question_text}
- `onAnswer(value)`: Callback with numeric value 1-10
- `disabled`: Boolean

**Behavior**:
- Slider input (min=1, max=10, step=1)
- Real-time value display
- "Low" / "High" labels
- "Continue →" button for explicit submission
- Visual numeric feedback (e.g., "7/10")

---

## CSS Class Structure

### Container Classes
```css
.ai-workout-interview         /* Main container */
.ai-header                    /* Header with title */
.ai-messages                  /* Message history area */
.ai-message                   /* Individual message */
.ai-message-assistant        /* AI messages */
.ai-message-user             /* User messages */
.ai-question-container       /* Current question area */
.question-progress           /* Progress indicator */
```

### Question Type Classes
```css
.text-question               /* Text input container */
.text-input                  /* Textarea element */
.multiple-choice-question    /* Radio button container */
.options-container           /* Option list */
.option-label                /* Individual radio option */
.option-radio                /* Radio input */
.option-text                 /* Radio label text */
.yes-no-question             /* Yes/No button container */
.yes-no-buttons              /* Button wrapper */
.yes-btn / .no-btn           /* Individual buttons */
.range-question              /* Slider container */
.range-container             /* Slider area */
.range-slider                /* Slider input */
.range-labels                /* Low/High indicators */
.range-value                 /* Value display */
.current-value               /* Numeric value */
.range-scale                 /* "/10" text */
```

### State Classes
```css
.ai-thinking-container       /* Loading state during generation */
.spinner                     /* Animated spinner */
.ai-success                  /* Success message area */
.ai-error                    /* Error message display */
.ai-loading                  /* Loading state */
```

### Action Classes
```css
.question-actions            /* Action buttons wrapper */
.submit-btn                  /* Submit/Continue button */
.send-btn                    /* Send button (legacy) */
.close-btn                   /* Close button */
```

---

## State Management

### Initial State
```javascript
questions: []                    // Fetched from API
currentQuestionIndex: 0          // Track progress
answers: {}                      // {questionId: answer}
loading: true                    // Initial load
workoutGenerated: false          // Success flag
error: null                      // Error message
messages: []                     // Conversation history
```

### After Initialization
```javascript
questions: [{                   // Fetched admin questions
  id: '123',
  question_text: 'What type...',
  question_type: 'text',
  options: [],
  order_position: 1
}, ...]
currentQuestionIndex: 0
answers: {}
loading: false
workoutGenerated: false
error: null
messages: [{
  role: 'assistant',
  content: '🏋️ Hi! I\'m your AI Fitness Coach...'
}]
```

### After Each Answer
```javascript
currentQuestionIndex: 1        // Incremented
answers: {                     // Answer recorded
  'q1_id': 'user answer',
  'q2_id': 'yes/no value',
  ...
}
messages: [                    // Message added
  ...,
  {
    role: 'user',
    content: 'user answer'
  }
]
```

### During Workout Generation
```javascript
loading: true                   // API call in progress
messages: [
  ...,
  {
    role: 'assistant',
    content: '💭 Creating your personalized workout...'
  }
]
```

### After Success
```javascript
workoutGenerated: true
messages: [
  ...,
  {
    role: 'assistant',
    content: '✅ Workout created! Closing in 3 seconds...'
  }
]
```

---

## API Integration

### Request to /api/admin/questions/active
```javascript
GET /api/admin/questions/active

Headers:
  Authorization: Bearer {token}
  Content-Type: application/json

Response:
{
  questions: [
    {
      id: string,
      question_text: string,
      question_type: 'text' | 'multiple_choice' | 'yes_no' | 'range',
      options: string[] (if applicable),
      order_position: number
    },
    ...
  ]
}
```

### Request to /api/fitness/ai-interview
```javascript
POST /api/fitness/ai-interview

Headers:
  Authorization: Bearer {token}
  Content-Type: application/json

Body:
{
  messages: [                    // Optional
    { role: 'user', content: 'message' },
    ...
  ],
  userProfile: { ... },          // User object
  interview_answers: {           // NEW
    'q1_short_name': 'answer',
    'q2_short_name': 'yes/no',
    'q3_short_name': 5,
    ...
  },
  question_count: 5              // NEW
}

Response:
{
  message: string,
  workoutGenerated: boolean,
  workout: {                     // If generated
    warm_up: { ... },
    strength: { ... },
    cardio: { ... },
    agility: { ... },
    recovery: { ... },
    closeout: { ... },
    summary: { ... }
  }
}
```

---

## System Prompt (Simplified)

### When interview_answers provided:
```
You are a professional fitness coach AI.

User responses:
- q1_fitness_goal: 'Build muscle'
- q2_experience_level: 'Intermediate'
- q3_available_time: '45 minutes'
- q4_injuries: 'No'

Generate personalized 6-section workout in JSON format:
{
  warm_up: { name, duration, exercises[] },
  strength: { name, duration, exercises[], sets_reps },
  cardio: { name, duration, exercises[], notes },
  agility: { name, duration, exercises[], notes },
  recovery: { name, duration, exercises[] },
  closeout: { name, notes },
  summary: { total_duration, intensity_level, calories_burned_estimate, difficulty_rating }
}
```

---

## Error Handling Flow

```
Try to initialize interview
  ↓
Catch error during fetch
  ↓
setError(message)
  ↓
Render error UI with close button
  ↓
User clicks close
  ↓
onClose() called

---

Try to generate workout
  ↓
Try to parse JSON
  ↓
Try to save to database (3 attempts)
  ↓
If success → Show success message
  ↓
If failure → Show error message to user
  ↓
User can close manually
```

---

## Mobile Responsive Breakpoints

```css
@media (max-width: 600px) {
  .ai-workout-interview {
    width: 100%;           /* Full screen width */
    height: 70vh;          /* 70% of viewport height */
  }
  
  .yes-no-buttons {
    flex-direction: column; /* Stack buttons vertically */
  }
  
  .current-value {
    font-size: 20px;       /* Smaller value display */
  }
  
  .ai-message-content {
    max-width: 90%;        /* Wider messages on mobile */
  }
}
```

---

## Key Code Snippets

### Answer Handler
```javascript
const handleAnswerQuestion = (answer) => {
  const currentQuestion = questions[currentQuestionIndex];
  
  // Record answer
  setAnswers(prev => ({
    ...prev,
    [currentQuestion.id]: answer
  }));
  
  // Add to messages
  setMessages(prev => [...prev, {
    role: 'user',
    content: String(answer)
  }]);
  
  // Next question or generate
  if (currentQuestionIndex < questions.length - 1) {
    setCurrentQuestionIndex(prev => prev + 1);
  } else {
    generateWorkout(answers);
  }
};
```

### Workout Generation
```javascript
const generateWorkout = async (collectedAnswers) => {
  const interviewAnswers = {};
  questions.forEach((q, idx) => {
    const key = `q${idx + 1}_${q.question_text.substring(0, 20)}`;
    interviewAnswers[key] = collectedAnswers[q.id];
  });
  
  const response = await fetch(`${API_URL}/api/fitness/ai-interview`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      interview_answers: interviewAnswers,
      question_count: questions.length,
      userProfile: user
    })
  });
  
  const data = await response.json();
  if (data.workoutGenerated) {
    setWorkoutGenerated(true);
    setTimeout(() => onWorkoutGenerated(data.workout), 3000);
  }
};
```

### Question Renderer
```javascript
const renderCurrentQuestion = () => {
  if (currentQuestionIndex >= questions.length) return null;
  
  const q = questions[currentQuestionIndex];
  const props = { question: q, onAnswer: handleAnswerQuestion, disabled: loading };
  
  switch (q.question_type) {
    case 'text':
      return <TextQuestionDisplay {...props} />;
    case 'multiple_choice':
      return <MultipleChoiceDisplay {...props} />;
    case 'yes_no':
      return <YesNoDisplay {...props} />;
    case 'range':
      return <RangeDisplay {...props} />;
    default:
      return <TextQuestionDisplay {...props} />;
  }
};
```

---

## Production Checklist

Before deploying Phase 3, verify:

- [ ] All 4 display components import correctly
- [ ] CSS file loads without errors
- [ ] API endpoints return correct data
- [ ] Questions display in correct order
- [ ] Progress indicator shows accurate count
- [ ] Each question type renders properly
- [ ] Answers capture in correct format
- [ ] Workout generation completes successfully
- [ ] 6-section JSON parses correctly
- [ ] Database save succeeds
- [ ] 3-second countdown works
- [ ] Component closes properly
- [ ] Error states display correctly
- [ ] Mobile layout responsive
- [ ] Loading indicators visible
- [ ] No console errors

---

## Next Phase Integration

Phase 4 (Workout Display) will consume the generated workout object:

```javascript
// Phase 4 will receive this structure
const workout = {
  warm_up: {
    name: 'Dynamic Stretching',
    duration: '5 minutes',
    exercises: ['Arm circles', 'Leg swings', 'Walking lunges']
  },
  strength: {
    name: 'Resistance Training',
    duration: '20 minutes',
    exercises: ['Squats', 'Push-ups', 'Rows'],
    sets_reps: '3 sets of 10 reps'
  },
  // ... 4 more sections ...
  summary: {
    total_duration: '45 minutes',
    intensity_level: 'high',
    calories_burned_estimate: 350,
    difficulty_rating: '7'
  }
};

// Phase 4 displays each section with:
// - Section name and duration
// - Exercise list
// - Notes/tips
// - Visual progress tracking
```

---

## Conclusion

Phase 3 implementation is complete with 5 new files, 3 modified files, and comprehensive documentation. The system is ready for Phase 4 (Workout Display) and Phase 5 (Testing & Deployment).
