# 🧪 TESTING GUIDE - Switchboard Fixes

## Quick Test: Verify All Fixes

### Test 1: Meal Planner Redirect ✅
**Steps:**
1. Open app at http://localhost:3000
2. Click "Meal Planner" tile
3. Login with any email/password
4. **Expected:** Redirected to ZIP code page (Meal Planner starts) ✅

**What Changed:**
- Before: Would redirect back to switchboard
- After: Stores `redirect_after_login = 'zip'` before login

---

### Test 2: Nutrition Redirect ✅
**Steps:**
1. Open app at http://localhost:3000
2. Click "Nutrition" tile
3. Login with any email/password
4. **Expected:** Redirected to Nutrition dashboard ✅

**What Changed:**
- Should already work, but now guaranteed with redirect fix

---

### Test 3: Fitness App Icon Live 💪
**Steps:**
1. Open app at http://localhost:3000
2. Look at switchboard app tiles
3. Find the "Fitness" tile (💪)
4. **Expected:** 
   - Icon is LIVE (not grayed out)
   - No "coming soon" label
   - Can click it ✅

**What Changed:**
- Before: `available: false, comingSoon: true`
- After: `available: true, comingSoon: false`

---

### Test 4: Fitness Redirect & Dashboard ✅
**Steps:**
1. Open app at http://localhost:3000
2. Click "Fitness" tile (💪)
3. If logged in: Should show Fitness Dashboard
   - If NOT logged in: Will redirect to login
4. Login with any email/password
5. **Expected:** Redirected to Fitness Dashboard ✅

**Dashboard Features to Test:**
- [ ] Navigation: 4 tabs (Dashboard, Log Workout, Goals, Profile)
- [ ] Profile Section: Shows user stats if connected to backend
- [ ] Can view/edit profile
- [ ] Can log workouts
- [ ] Can set goals
- [ ] "Back to Portal" button returns to switchboard

**What Changed:**
- Before: Fitness showed "coming soon" alert
- After: Full fitness module integrated and functional

---

## Detailed Test Scenarios

### Scenario A: Already Logged In
```
Sequence:
1. User already has auth token in localStorage
2. Clicks "Meal Planner" 
3. user state already loaded
4. Goes directly to 'zip' (Meal Planner start)
✅ EXPECTED: Should work immediately
```

### Scenario B: Not Logged In
```
Sequence:
1. No auth token in localStorage
2. Clicks "Nutrition"
3. App stores: localStorage.setItem('redirect_after_login', 'nutrition')
4. Redirects to 'login' view
5. User completes login (gets JWT token)
6. handleLogin() reads localStorage, sees 'nutrition'
7. Clears localStorage, sets currentView = 'nutrition'
8. NutritionApp renders
✅ EXPECTED: Should redirect properly after login
```

### Scenario C: Fitness with Backend
```
Prerequisites: 
- Backend running: cd fitness/backend && npm start
- Backend on port 5000
- Database: Neon connected

Sequence:
1. Click "Fitness" tile
2. If not logged in → Login first
3. FitnessApp component loads
4. Connects to http://localhost:5000 (REACT_APP_API_URL)
5. Fetches: GET /api/fitness/profile (JWT auth)
6. Dashboard loads with data

✅ EXPECTED: Should display user fitness profile
```

---

## Files Changed

### Modified Files:
```
✏️  client/src/App.js
    - Added FitnessApp import (line 28)
    - Fixed meal-planner redirect (line 346)
    - Added fitness case handler (lines 397-406)
    - Added fitness view rendering (lines 573-579)

✏️  client/src/components/AppSwitchboard.js
    - Enabled fitness app (lines 63-72)
    - Changed available: false → true
    - Changed comingSoon: true → false
```

### New Files Created:
```
✨ client/src/modules/fitness/FitnessApp.js
   - Main fitness app component
   - Handles API connections
   - Loading/error states

✨ client/src/modules/fitness/components/FitnessDashboard.js
   - Dashboard UI
   - 4 view tabs
   - Forms for profile, workout, goals

✨ client/src/modules/fitness/index.js
   - Module exports

✨ client/src/modules/fitness/styles/FitnessApp.css
   - Main container styles
   - Header, buttons, responsive

✨ client/src/modules/fitness/styles/FitnessDashboard.css
   - Dashboard styles
   - Navigation, cards, forms
   - Animations and responsive

✨ SWITCHBOARD_FIXES_SUMMARY.md
   - Detailed explanation of fixes
```

---

## Troubleshooting

### Issue: "FitnessApp is not exported"
**Solution:** Make sure the import statement is in App.js:
```javascript
import { FitnessApp } from './modules/fitness';
```

### Issue: Fitness tab shows but clicking does nothing
**Solution:** Check that the case statement is in handleSelectApp:
```javascript
case 'fitness':
  const fitnessToken = getToken();
  if (fitnessToken && user) {
    setCurrentView('fitness');
  } else {
    localStorage.setItem('redirect_after_login', 'fitness');
    setCurrentView('login');
  }
  break;
```

### Issue: Dashboard loads but shows loading spinner forever
**Solution:** Check backend is running:
```bash
cd fitness/backend
npm start
# Should say: Server running on port 5000
```

### Issue: Login redirects but goes to wrong page
**Solution:** Verify the redirect_after_login localStorage is being set:
```javascript
// In browser console after clicking "Meal Planner"
console.log(localStorage.getItem('redirect_after_login'));
// Should print: 'zip'
```

---

## Browser Console Checks

### Check Redirect Storage
```javascript
// Click "Meal Planner", check console:
localStorage.getItem('redirect_after_login')
// Should output: 'zip'

// Click "Nutrition", check console:
localStorage.getItem('redirect_after_login')
// Should output: 'nutrition'

// Click "Fitness", check console:
localStorage.getItem('redirect_after_login')
// Should output: 'fitness'
```

### Check App State
```javascript
// In browser console, check the current view
window.location.pathname
// Should be '/' for single-page app

// Check localStorage after successful redirects
localStorage.getItem('redirect_after_login')
// Should be cleared/empty after redirect

// Check auth token
localStorage.getItem('auth_token')
// Should have JWT token
```

---

## Production Deployment

### For Vercel Deployment:
```javascript
// In Vercel dashboard, set environment variables:

REACT_APP_API_URL=https://your-fitness-backend.com
# This tells the frontend where to connect for API calls

# If using Vercel serverless functions as backend:
REACT_APP_API_URL=https://your-vercel-domain.vercel.app/api
```

### For Local Testing:
```javascript
// Default in FitnessApp.js:
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
// Uses localhost:5000 for development
// Uses env var for production
```

---

## ✅ Verification Checklist

- [ ] Meal Planner: Click → Login → Redirects to ZIP ✅
- [ ] Nutrition: Click → Login → Redirects to Nutrition ✅
- [ ] Fitness: Icon appears "available" (not grayed out) ✅
- [ ] Fitness: Click → Login → Redirects to Fitness Dashboard ✅
- [ ] Fitness: Dashboard loads without errors ✅
- [ ] Fitness: Can view 4 tabs (Dashboard, Log Workout, Goals, Profile) ✅
- [ ] Fitness: Back button returns to switchboard ✅
- [ ] No console errors ✅
- [ ] All modules work together ✅

**Status:** ✅ Ready for testing!
