# Phase 5: Quick Reference Card

**Project**: AI Coach/Fitness Module  
**Status**: 🟡 IN PROGRESS - Testing & Deployment  
**Timeline**: 3 Days (Dec 22-24, 2025)

---

## Phase Overview

| Phase | Status | Files | LOC | Timeline |
|-------|--------|-------|-----|----------|
| 1. Admin Backend | ✅ Complete | 6 API endpoints | ~300 | Done |
| 2. Admin UI | ✅ Complete | 4 components | ~400 | Done |
| 3. AI Coach | ✅ Complete | 6 components | ~800 | Done |
| 4. Workout Display | ✅ Complete | 5 files | ~1000 | Done |
| 5. Testing & Deploy | 🟡 In Progress | Test scripts | - | 3 days |

**Total Progress**: 80% → Target: 100%

---

## What We Built

```
┌─────────────────────────────────────────────┐
│   ADMIN (Phase 1-2)                         │
│   └─ Question management UI + API            │
├─────────────────────────────────────────────┤
│   INTERVIEW (Phase 3)                       │
│   └─ 4 question types + ChatGPT workout gen │
├─────────────────────────────────────────────┤
│   DISPLAY (Phase 4)                         │
│   └─ 6 color-coded sections + statistics   │
├─────────────────────────────────────────────┤
│   TESTING & DEPLOY (Phase 5)                │
│   └─ Test all + fix bugs + go live          │
└─────────────────────────────────────────────┘
```

---

## File Locations

### Backend Components
```
fitness/backend/
├── routes/fitness.js           [API endpoints]
├── src/server.js               [Express server]
└── .env                        [Config]
```

### Frontend Components
```
client/src/modules/fitness/components/
├── AIWorkoutInterview.js       [Phase 3 - Main coach]
├── TextQuestionDisplay.js      [Text input questions]
├── MultipleChoiceDisplay.js    [Multiple choice options]
├── RangeDisplay.js             [Slider questions]
├── YesNoDisplay.js             [Yes/No questions]
├── WorkoutDisplay.js           [Phase 4 - Main display]
├── SectionCard.js              [Individual section]
├── ExerciseList.js             [Exercise listing]
└── WorkoutSummary.js           [Statistics]

client/src/modules/fitness/styles/
├── AIWorkoutInterview.css      [Phase 3 styling]
└── WorkoutDisplay.css          [Phase 4 styling]
```

---

## Testing Timeline

### Day 1: Unit & Integration (Today - Dec 22)

**Morning** (9:00 AM - 12:30 PM)
- [ ] 9:00 - Set up test environment
- [ ] 9:30 - Phase 1 API tests (6 endpoints)
- [ ] 10:30 - Phase 2 Admin UI tests (5 features)
- [ ] 11:30 - Phase 3 Interview tests (4 question types)

**Afternoon** (1:00 PM - 3:30 PM)
- [ ] 1:00 - Phase 3 Interview continued (generate workout)
- [ ] 2:00 - Phase 4 Workout Display tests (6 features)
- [ ] 3:00 - Document bugs and results
- [ ] 3:30 - Begin critical bug fixes

### Day 2: Responsive & Performance (Dec 23)

**Morning** (9:00 AM - 12:30 PM)
- [ ] Device testing (mobile portrait/landscape)
- [ ] Tablet testing (iPad sizes)
- [ ] Desktop testing (multiple widths)

**Afternoon** (1:00 PM - 3:30 PM)
- [ ] Browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Performance profiling (Lighthouse, React DevTools)
- [ ] Document responsiveness issues

### Day 3: Accessibility & Deploy (Dec 24)

**Morning** (9:00 AM - 12:30 PM)
- [ ] Keyboard navigation testing
- [ ] Screen reader testing
- [ ] Color contrast verification
- [ ] Accessibility compliance check

**Afternoon** (1:00 PM - 3:30 PM)
- [ ] Final bug fixes
- [ ] Re-test critical features
- [ ] Deployment prep
- [ ] Go-live checklist

---

## API Endpoints to Test

### Admin Endpoints
```
GET  /api/fitness/admin/interview-questions
POST /api/fitness/admin/interview-questions
PUT  /api/fitness/admin/interview-questions/:id
DELETE /api/fitness/admin/interview-questions/:id
PATCH /api/fitness/admin/interview-questions/:id/toggle
PATCH /api/fitness/admin/interview-questions/:id/order
```

### Workout Endpoints (Phase 4)
```
POST  /api/fitness/workouts              [Save workout]
GET   /api/fitness/workouts              [Get user's workouts]
GET   /api/fitness/workouts/:id          [Get specific workout]
DELETE /api/fitness/workouts/:id         [Delete workout]
POST  /api/fitness/workouts/:id/start    [Start workout]
```

### ChatGPT Integration
```
Route: POST /api/fitness/generate-workout
Payload: { answers: {...}, questions: [...] }
Response: { workout: { warm_up, strength, cardio, agility, recovery, closeout, summary } }
```

---

## Test Checklist

### Unit Tests (4 Phases)

**Phase 1: Backend API** (6 tests)
- [ ] GET questions - Returns list
- [ ] POST create - Returns 201
- [ ] PUT update - Returns 200
- [ ] DELETE - Returns 200
- [ ] PATCH toggle - Returns 200
- [ ] Validation - Rejects invalid

**Phase 2: Admin UI** (5 tests)
- [ ] Create question
- [ ] Edit question
- [ ] Delete question
- [ ] Toggle active
- [ ] List displays

**Phase 3: Interview** (4 tests)
- [ ] Text questions
- [ ] Multiple choice
- [ ] Range slider
- [ ] Yes/No buttons
- [ ] Workout generation

**Phase 4: Display** (6 tests)
- [ ] All 6 sections render
- [ ] Expand/collapse works
- [ ] Exercise lists display
- [ ] Summary stats show
- [ ] Save button works
- [ ] Responsive on mobile

### Integration Tests (1 test)
- [ ] Full end-to-end flow (all phases)

### Device Tests
- [ ] iPhone (5.4" - 6.7")
- [ ] Android phone (6.2")
- [ ] iPad (9.7")
- [ ] Desktop (various widths)

### Browser Tests
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Performance Targets
- [ ] Page load < 3s
- [ ] API response < 500ms
- [ ] Component render < 100ms
- [ ] 60fps animations

---

## Debugging Commands

### Backend
```bash
cd fitness/backend
npm start                              # Start server
npm run dev                           # Dev mode with nodemon
npm test                              # Run tests (if configured)
```

### Frontend
```bash
cd client
npm start                              # Start dev server
npm run build                          # Build for production
npm test                               # Run tests (if configured)
```

### Database
```bash
# Connect to Prisma Studio
cd fitness/backend
npx prisma studio

# View logs
tail -f logs/fitness.log
```

### Curl Tests
```bash
# Get all questions
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/fitness/admin/interview-questions

# Create question
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question":"Test?","type":"text","order":1}' \
  http://localhost:5000/api/fitness/admin/interview-questions
```

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Invalid JWT | Re-login, check token in headers |
| 404 Not Found | Wrong endpoint | Verify path, check server running |
| CORS errors | Frontend-Backend mismatch | Check CORS config in server.js |
| Component not rendering | Props not passed | Check parent component, console errors |
| Styling broken | CSS not loaded | Clear cache, verify CSS file path |
| ChatGPT timeout | API slow | Check rate limits, API key valid |
| Database error | Connection issue | Check DB running, .env configured |

---

## Success Criteria

### Day 1: Unit & Integration Testing ✅
- [ ] All 4 phases tested individually
- [ ] Phase 3 → Phase 4 integration works
- [ ] All critical bugs identified
- [ ] No critical bugs blocking testing

### Day 2: Device & Performance ✅
- [ ] Works on all tested devices
- [ ] Responsive design verified
- [ ] Performance metrics acceptable
- [ ] No blocking compatibility issues

### Day 3: Accessibility & Deploy ✅
- [ ] WCAG 2.1 AA compliant
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Ready for production

---

## Bug Priority Levels

| Level | Definition | Action |
|-------|-----------|--------|
| 🔴 P0 | Blocks testing/functionality | Fix immediately |
| 🟠 P1 | Major feature broken | Fix today |
| 🟡 P2 | Minor feature issue | Fix before deploy |
| 🟢 P3 | Polish/cosmetic | Can fix post-deploy |

---

## Deployment Checklist

- [ ] All bugs fixed (P0/P1)
- [ ] All tests passing
- [ ] Performance acceptable
- [ ] Mobile responsive
- [ ] Browser compatible
- [ ] Accessibility compliant
- [ ] Environment variables set
- [ ] Database backed up
- [ ] Monitoring configured
- [ ] Rollback plan ready

---

## Key Contacts/Resources

**Frontend Components**
```
AIWorkoutInterview.js       [Line count: ~200]
WorkoutDisplay.js           [Line count: ~180]
SectionCard.js              [Line count: ~80]
ExerciseList.js             [Line count: ~50]
WorkoutSummary.js           [Line count: ~90]
```

**Styling Files**
```
AIWorkoutInterview.css      [Color scheme: blues, greens]
WorkoutDisplay.css          [6 section colors, animations]
```

**Test Documents**
```
PHASE_5_TESTING_DEPLOYMENT.md   [Master plan]
PHASE_5_DAY1_TESTING.md         [Day 1 details]
PHASE_5_QUICK_REFERENCE.md      [This file]
```

---

## Team Knowledge Base

### Architecture Questions?
→ See `PHASE_4_STATUS.md` for system overview

### Component Details?
→ See `PHASE_4_QUICK_REFERENCE.md` for props/CSS classes

### Session History?
→ See `PHASE_4_SESSION_SUMMARY.md` for what was built

### Implementation Details?
→ See `PHASE_4_COMPLETION.md` for code breakdown

---

## Next Steps

1. **Start Day 1 Testing** (Now)
   - Set up test environment
   - Run Phase 1 API tests
   - Progress through phases
   - Document bugs

2. **Bug Fixing** (This evening)
   - Fix critical/high-priority bugs
   - Re-test fixed features
   - Update test results

3. **Day 2 Prep** (Tomorrow morning)
   - Set up devices for testing
   - Install Lighthouse extension
   - Prepare test plan

4. **Final Deployment** (Dec 24)
   - Complete all testing
   - Fix remaining bugs
   - Deploy to production
   - Celebrate completion! 🎉

---

**Document Version**: 1.0  
**Created**: December 22, 2025  
**Status**: Ready for Phase 5 execution

---

*For detailed testing procedures, see PHASE_5_DAY1_TESTING.md*  
*For deployment steps, see PHASE_5_TESTING_DEPLOYMENT.md*
