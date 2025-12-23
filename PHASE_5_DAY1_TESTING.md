# Phase 5: Testing Guide - Day 1

**Date**: December 22, 2025  
**Objective**: Complete Unit and Integration Testing  
**Status**: 🟡 IN PROGRESS

---

## Test Environment Setup

### Prerequisites
- [ ] Node.js v18+ installed
- [ ] PostgreSQL running (Prisma config)
- [ ] Environment variables configured
- [ ] Test user accounts created
- [ ] Admin panel access verified

### Environment Configuration

**Backend Setup**
```bash
cd fitness/backend
cp .env.example .env
# Edit .env with test database URL and OpenAI key
npm install
npm start
```

**Frontend Setup**
```bash
cd client
npm install
npm start
# Or use Vite if configured
```

**Test Database**
- Use test-specific database URL in `.env`
- Clear test data before each round
- Seed with sample questions for testing

---

## Day 1: Unit & Integration Testing

### Morning Session (9:00 AM - 12:30 PM)

#### 1. Phase 1: Admin Backend API Testing (9:00 AM - 10:30 AM)

**Test 1.1: GET /api/admin/interview-questions**

Endpoint: `GET /api/fitness/admin/interview-questions`

```bash
# Test Script
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/fitness/admin/interview-questions

# Expected Response (200 OK)
{
  "success": true,
  "questions": [
    {
      "id": 1,
      "question": "What are your fitness goals?",
      "type": "text",
      "order": 1,
      "is_active": true,
      "created_by": "admin@example.com",
      "created_at": "2025-12-22T00:00:00Z",
      "updated_at": "2025-12-22T00:00:00Z"
    }
  ]
}
```

**Test 1.2: POST /api/admin/interview-questions (Create)**

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How many days per week can you exercise?",
    "type": "range",
    "order": 2
  }' \
  http://localhost:5000/api/fitness/admin/interview-questions

# Expected: 201 Created with new question
```

**Test 1.3: PUT /api/admin/interview-questions/:id (Update)**

```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Updated: What are your fitness goals?",
    "type": "text",
    "order": 1
  }' \
  http://localhost:5000/api/fitness/admin/interview-questions/1

# Expected: 200 OK with updated question
```

**Test 1.4: DELETE /api/admin/interview-questions/:id**

```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/fitness/admin/interview-questions/1

# Expected: 200 OK with success message
```

**Test 1.5: PATCH /api/admin/interview-questions/:id/toggle**

```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/fitness/admin/interview-questions/1/toggle

# Expected: 200 OK with toggled question
```

**Test 1.6: Validation Tests**

```bash
# Test required fields (should fail)
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text"
    # Missing "question"
  }' \
  http://localhost:5000/api/fitness/admin/interview-questions

# Expected: 400 Bad Request with error message
```

**Results**:
- [ ] GET returns all questions with status 200
- [ ] POST creates question with status 201
- [ ] PUT updates question with status 200
- [ ] DELETE removes question with status 200
- [ ] PATCH toggles is_active with status 200
- [ ] Validation rejects invalid requests with 400

---

#### 2. Phase 2: Admin UI Component Testing (10:30 AM - 11:30 AM)

**Test 2.1: Check Admin Panel Renders**

```jsx
// Open browser console and verify no errors
// Visit: http://localhost:3000/admin (or your admin path)

// Visual checklist:
- [ ] Page loads without errors
- [ ] "Admin Panel" title visible
- [ ] Question list displayed
- [ ] Add Question button visible
- [ ] No console errors
```

**Test 2.2: Create Question**

```
Steps:
1. Click "Add Question" button
2. Enter question text: "What is your current fitness level?"
3. Select type: "multiple_choice"
4. Enter order: 1
5. Click "Create"

Expected:
- [ ] Modal/form displays
- [ ] Question added to list
- [ ] Success message shown
- [ ] Form clears for next entry
- [ ] No console errors
```

**Test 2.3: Edit Question**

```
Steps:
1. Click edit button on first question
2. Change question text
3. Change question type
4. Click "Save"

Expected:
- [ ] Modal displays current values
- [ ] Changes saved
- [ ] List updates with new data
- [ ] Success message shown
```

**Test 2.4: Delete Question**

```
Steps:
1. Click delete button on question
2. Confirm deletion

Expected:
- [ ] Confirmation dialog appears
- [ ] Question removed from list
- [ ] Success message shown
```

**Test 2.5: Toggle Active/Inactive**

```
Steps:
1. Click toggle switch next to question

Expected:
- [ ] Question marked as active/inactive
- [ ] Status changes visually
- [ ] API call succeeds
```

**Results**:
- [ ] Admin panel loads without errors
- [ ] Create question works end-to-end
- [ ] Edit question works end-to-end
- [ ] Delete question works end-to-end
- [ ] Toggle active/inactive works
- [ ] No console errors in browser DevTools

---

### Afternoon Session (1:00 PM - 3:30 PM)

#### 3. Phase 3: AI Coach Interview Testing (1:00 PM - 2:00 PM)

**Test 3.1: Interview Component Loads**

```
Steps:
1. Navigate to AI Coach (fitness module)
2. Check component renders

Visual checklist:
- [ ] Interview title visible
- [ ] First question displayed
- [ ] Input method matches question type
- [ ] Next/Continue button visible
- [ ] Progress indicator visible (if applicable)
- [ ] No console errors
```

**Test 3.2: Text Question Display (TextQuestionDisplay)**

```
Steps:
1. If first question is text type, verify:
   - [ ] Question text displays
   - [ ] Text input field visible
   - [ ] Placeholder text present
   - [ ] Submit button enabled when text entered
   - [ ] Enter key works to submit

Test:
- Enter "Lose weight and build muscle"
- Click Submit
- [ ] Answer recorded
- [ ] Progress to next question
```

**Test 3.3: Multiple Choice Display (MultipleChoiceDisplay)**

```
Steps:
1. Navigate to multiple choice question
2. Verify:
   - [ ] Question text displays
   - [ ] All options visible
   - [ ] Options are clickable
   - [ ] Selected option highlighted
   - [ ] Submit button works

Test:
- Click option "Beginner"
- Click Submit
- [ ] Answer recorded
- [ ] Progress to next question
```

**Test 3.4: Range Slider Display (RangeDisplay)**

```
Steps:
1. Navigate to range question
2. Verify:
   - [ ] Question text displays
   - [ ] Slider visible
   - [ ] Min/max labels shown
   - [ ] Current value displayed
   - [ ] Slider is draggable

Test:
- Drag slider to 3
- Click Submit
- [ ] Answer recorded
- [ ] Progress to next question
```

**Test 3.5: Yes/No Display (YesNoDisplay)**

```
Steps:
1. Navigate to yes/no question
2. Verify:
   - [ ] Question text displays
   - [ ] Yes button visible
   - [ ] No button visible
   - [ ] Buttons are clickable

Test:
- Click "Yes"
- [ ] Answer recorded
- [ ] Progress to next question
```

**Test 3.6: Complete Interview & Generate Workout**

```
Steps:
1. Answer all questions
   - Question 1: Text answer
   - Question 2: Multiple choice
   - Question 3: Range selection
   - Question 4: Yes/No answer
2. Click Final Submit

Expected:
- [ ] Loading message appears
- [ ] ChatGPT processes answers
- [ ] Workout is generated (5-10 seconds)
- [ ] Workout has 6 sections:
    - [ ] Warm-up (duration, exercises)
    - [ ] Strength (duration, exercises, sets/reps)
    - [ ] Cardio (duration, exercises)
    - [ ] Agility (duration, exercises)
    - [ ] Recovery (duration, exercises)
    - [ ] Closeout (notes)
- [ ] Summary stats calculated:
    - [ ] Total duration
    - [ ] Intensity level
    - [ ] Calories estimate
    - [ ] Difficulty rating
- [ ] WorkoutDisplay component receives data
- [ ] Transitions to Phase 4 display
- [ ] No console errors
```

**Test Results**:
- [ ] Interview loads without errors
- [ ] Text questions accept input
- [ ] Multiple choice options work
- [ ] Range slider works
- [ ] Yes/No buttons work
- [ ] All questions answer correctly
- [ ] Workout generates successfully
- [ ] Workout data is complete
- [ ] Phase 4 displays workout

---

#### 4. Phase 4: Workout Display Testing (2:00 PM - 3:00 PM)

**Test 4.1: WorkoutDisplay Container**

```
After workout is generated, verify:
- [ ] All 6 sections rendered
- [ ] Section headers visible
- [ ] Color coding applied (6 colors)
- [ ] Save button visible
- [ ] Start button visible
- [ ] Share button visible
- [ ] Close button visible
- [ ] No console errors
```

**Test 4.2: Section Card - Expand/Collapse**

```
Steps:
1. Click section header to expand
   - [ ] Content appears with animation
   - [ ] Duration badge visible
   - [ ] Exercises list shown
   - [ ] Sets/reps displayed (if strength)

2. Click again to collapse
   - [ ] Content hides with animation
   - [ ] Arrow/icon rotates
   - [ ] Only header visible

Repeat for all 6 sections:
- [ ] Warm-up section
- [ ] Strength section
- [ ] Cardio section
- [ ] Agility section
- [ ] Recovery section
- [ ] Closeout section
```

**Test 4.3: Exercise List Display (ExerciseList)**

```
For Strength section, verify:
- [ ] Exercises numbered (1, 2, 3, etc.)
- [ ] Exercise names displayed
- [ ] Sets and reps shown (e.g., "3 sets x 10 reps")
- [ ] Form tips visible (if present)
- [ ] Notes section shown (if present)

Example format:
1. Bench Press - 3 sets x 8 reps
   Form Tip: Keep chest up, elbows at 45°
2. Dumbbell Rows - 3 sets x 10 reps
   Form Tip: Pull elbows past torso
```

**Test 4.4: Workout Summary Statistics**

```
Verify summary grid displays:
- [ ] Duration card: Shows total minutes (e.g., "45 min")
- [ ] Intensity card: Color-coded
    - [ ] Low = Green
    - [ ] Medium = Yellow
    - [ ] High = Red
- [ ] Calories card: Shows estimate (e.g., "350 cal")
- [ ] Difficulty card: Shows star rating (e.g., "★★★☆☆")

All cards should:
- [ ] Have icons
- [ ] Have labels
- [ ] Have values
- [ ] Be aligned in grid
```

**Test 4.5: Action Buttons**

```
Test Save Button:
- [ ] Button clickable
- [ ] Click shows "Saving..." state
- [ ] Success message displays
- [ ] Disappears after 3 seconds
- [ ] API call made (check Network tab)

Test Start Button:
- [ ] Button clickable
- [ ] Click triggers callback (if wired)

Test Share Button:
- [ ] Button clickable
- [ ] Share menu/dialog appears (if implemented)

Test Close Button:
- [ ] Button clickable
- [ ] Component closes/unmounts
```

**Test Results**:
- [ ] All 6 sections render with correct colors
- [ ] Expand/collapse animations smooth
- [ ] Exercise lists display correctly
- [ ] Summary stats visible and accurate
- [ ] Save button functional
- [ ] All buttons clickable
- [ ] No console errors

---

### Afternoon Wrap-up (3:00 PM - 3:30 PM)

#### Bug Documentation

For each bug found:

```markdown
BUG #[number]: [Brief Title]
─────────────────────────────────────────
Component: [Phase and component name]
Severity: [Critical/High/Medium/Low]
Environment: [Chrome/Firefox/Safari/Mobile]
Steps to Reproduce:
1. ...
2. ...
3. ...

Expected: ...
Actual: ...

Status: Open
Priority: [P0/P1/P2/P3]
```

#### Summary of Day 1

Create a summary document:

```
PHASE 1 TESTING RESULTS:
- API Endpoints: [X/6 tests passing]
- Documentation: [Note any API changes needed]

PHASE 2 TESTING RESULTS:
- Admin UI: [X/5 tests passing]
- Documentation: [Note any UI improvements needed]

PHASE 3 TESTING RESULTS:
- Interview Flow: [Complete/Partial/Failed]
- Question Types: [All/Some/None working]
- Workout Generation: [Complete/Partial/Failed]

PHASE 4 TESTING RESULTS:
- Display Rendering: [All/Some/None sections render]
- Interactions: [Expand/collapse works/needs work]
- Summary Stats: [Accurate/Needs adjustment]

TOTAL BUGS FOUND: [Number]
- Critical: [Number] - Must fix before deployment
- High: [Number] - Should fix before deployment
- Medium: [Number] - Can fix post-deployment
- Low: [Number] - Polish items
```

---

## Test Data Seed Script

Use this to populate test questions:

```sql
INSERT INTO admin_interview_questions (question, type, order, is_active, created_by) VALUES
('What are your primary fitness goals?', 'text', 1, true, 'test@example.com'),
('What is your current fitness level?', 'multiple_choice', 2, true, 'test@example.com'),
('How many days per week can you exercise?', 'range', 3, true, 'test@example.com'),
('Do you have any injuries to consider?', 'yes_no', 4, true, 'test@example.com');
```

---

## Debugging Tips

### Browser DevTools
1. **Console Tab**: Watch for errors
2. **Network Tab**: Verify API calls and timing
3. **Performance Tab**: Check component render times
4. **React DevTools**: Inspect component props/state

### Backend Logs
```bash
# Watch for errors in server logs
# Look for: [ERROR], [WARN], stack traces
# Note: Database connection issues, API errors, ChatGPT errors
```

### Common Issues

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check JWT token validity, login again |
| 404 Not Found | Verify API endpoint path, check server running |
| CORS errors | Check backend CORS config, verify frontend URL |
| ChatGPT timeout | Increase timeout, check API key valid, check rate limits |
| Component not rendering | Check console for errors, verify props passed |
| Styling issues | Clear browser cache, check CSS file loaded |

---

## Next Steps

After Day 1 Testing:

1. **Document Results** (3:30 PM)
   - Create test results file
   - List all bugs found
   - Prioritize bugs

2. **Bug Fixing** (Evening)
   - Fix critical bugs
   - Document fixes made
   - Re-test fixed features

3. **Day 2 Prep** (Evening)
   - Update test plan if needed
   - Prepare devices for testing
   - Set up performance measurement tools

---

**Document Version**: 1.0  
**Last Updated**: December 22, 2025  
**Next Update**: After Day 1 testing complete
