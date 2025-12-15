# Quick Error Prevention Reference

## 🚨 Top 5 Most Common Errors (And How to Avoid Them)

### 1. ESLint: Unused Variables ❌
```
[eslint] Line 76:26: 'setFavoritingMeal' is assigned a value but never used
```

**Fix:** Remove unused state declarations
```javascript
// BEFORE: ❌
const [favoritingMeal, setFavoritingMeal] = useState(null);
// ... but never use setFavoritingMeal ...

// AFTER: ✅
// Just remove the line
```

**Prevention:**
- Run `npm run build` before every push
- Check for orange/yellow ESLint warnings
- Remove state when you remove all its usage

---

### 2. Silent Auth Logout 🔐
```
User saves recipe → mysteriously redirected to login
```

**Fix:** Always handle 401/403 responses
```javascript
const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });

// BEFORE: ❌
if (response.ok) {
  // success
} else {
  showError('Failed');
}

// AFTER: ✅
if (response.status === 401 || response.status === 403) {
  localStorage.removeItem('auth_token');
  window.location.href = '/';
  return;
}
if (response.ok) {
  // success
} else {
  showError(data.error);
}
```

**Prevention:**
- Always check for 401/403 explicitly
- Always validate token before request: `if (!token) return error`
- Always clear token on auth failure
- Always show specific error messages
- Test with expired tokens

---

### 3. Missing Modal Button 🎯
```
User clicks favorite icon → button doesn't appear
```

**Fix:** Open modal instead of direct API call
```javascript
// BEFORE: ❌
const handleAddFavorite = async (meal, mealType, day) => {
  const response = await fetch(`${API_BASE}/api/favorites/add`, {
    // ... direct save ...
  });
};

// AFTER: ✅
const handleAddFavorite = async (meal, mealType, day) => {
  setSelectedMeal(meal);
  setSelectedMealDay(day);
  setSelectedMealType(mealType);
  // Modal now opens and shows button
};
```

**Prevention:**
- Test all user interaction paths
- Don't skip UI steps for convenience
- Verify modals/panels appear as expected
- Test both "click meal" AND "click favorite" flows

---

### 4. Backend 500 Errors 💥
```
POST /api/favorites/add 500 (Internal Server Error)
```

**Fix:** Ensure tables exist via migrations + enhance error logging
```javascript
// Create migrations/010_fix_table_name.sql
CREATE TABLE IF NOT EXISTS table_name (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  // ... columns ...
);

// Enhanced error logging:
catch (error) {
  console.error('[POST /api/endpoint] Error:', error.message);
  console.error('[POST /api/endpoint] User:', req.user?.email);
  res.status(500).json({ 
    error: 'Failed', 
    details: error.message  // ✅ Send details to frontend
  });
}
```

**Prevention:**
- Always create explicit migrations for tables
- Always log error.message, not just error object
- Always include user context in logs
- Always test endpoints after migrations
- Check Render logs immediately after deployment

---

### 5. CORS Blocked Requests 🚫
```
Access to fetch ... has been blocked by CORS policy
```

**Fix:** Add frontend URL to backend whitelist
```javascript
// server.js
const allowedOrigins = [
  FRONTEND_BASE,
  'http://localhost:3000',
  'https://meal-planner-app-chi.vercel.app',  // ✅ Add current URL
  'https://meal-planner.vercel.app',           // ✅ Add production URL
];
```

**Prevention:**
- When frontend URL changes → update CORS
- Test API calls immediately after deployment
- Monitor browser Network tab for 403 errors
- Include preview AND production URLs
- Test from exact frontend URL, not localhost

---

## 📋 Pre-Commit Checklist

Before `git push`:
- [ ] `npm run build` passes with 0 ESLint errors
- [ ] No unused variables or imports
- [ ] Tested in browser locally
- [ ] All auth endpoints handle 401/403
- [ ] All API endpoints have detailed error logging
- [ ] All modals/UI elements appear as expected
- [ ] No console.error that indicate problems

---

## 🧪 Critical Test Cases

Always test these scenarios:

### Auth Flow
```
Test 1: Save with valid token → ✅ Works
Test 2: Save with no token → ✅ Shows error message
Test 3: Save with expired token → ✅ Logs out gracefully
```

### Modal Flow
```
Test 1: Click meal name → ✅ Modal opens
Test 2: Click ❤️ favorite → ✅ Modal opens
Test 3: Button visible in both → ✅ Both work
```

### API Flow
```
Test 1: Valid request → ✅ Success response
Test 2: Invalid data → ✅ Error with details
Test 3: Check logs → ✅ Error includes user email
```

---

## 🔍 How to Debug Errors

### Frontend Error in Browser Console
1. Read full error message
2. Check line number in source code
3. Look for `401` or `403` → auth error
4. Look for `CORS` → need to add URL
5. Look for `undefined` → missing variable

### Backend Error in Render Logs
1. Go to: dashboard.render.com → meal-planner-app → Logs
2. Search for `ERROR` or endpoint name
3. Look for `[POST /api/endpoint]` prefix
4. Read the error message in `details` field
5. Look for user email to understand context

### Build Error in GitHub Actions
1. Go to: github.com → srab2001/meal_planner_app → Actions
2. Click on failed workflow
3. Expand "Run cd client && npm run build"
4. Find `[eslint]` section
5. Read the specific error and file:line

---

## 📚 Documentation Quick Links

| Issue | Documentation |
|-------|---|
| User logout after save | FIX_LOGOUT_ON_SAVE_RECIPE.md |
| Favorite icon no button | FIX_FAVORITE_ICON_NO_BUTTON.md |
| Backend 500 errors | FIX_NO_BUTTON_BACKEND_500.md |
| CORS blocked | CORS_FIX_DEPLOYED.md |
| All errors + prevention | ERROR_LOG_AND_PREVENTION.md |

---

## 💡 Pro Tips

**Tip 1: ESLint Errors**
- Run before push: `npm run build`
- Or: `npx eslint src/components/MealPlanView.js`
- Look for: `no-unused-vars`, `no-undef`

**Tip 2: Auth Errors**
- Always use: `if (response.status === 401 || response.status === 403)`
- Never use: `if (!response.ok)` alone
- Always test with: localStorage cleared or token expired

**Tip 3: Modal Issues**
- Log when modal opens: `console.log('Modal opened')`
- Verify state updates: `console.log('setSelectedMeal:', meal)`
- Check if button renders: `console.log('Button render:', selectedMeal)`

**Tip 4: Backend Errors**
- Always include context: `req.user?.email`, `req.params`
- Always log twice: `.message` and full `error`
- Always return details: `error.message` in response

**Tip 5: Deployment**
- Hard refresh after deploy: `Cmd+Shift+R` (Mac)
- Check all 3 deployment targets:
  1. GitHub Actions (build passing?)
  2. Vercel frontend (deployed?)
  3. Render backend (restarted?)

---

## 🎯 When You See an Error

**Step 1:** Identify error type
- Is it ESLint? → Run `npm run build` locally
- Is it 401? → Add auth error handling
- Is it 500? → Check Render logs
- Is it CORS? → Update allowed origins
- Is it modal? → Verify state updates

**Step 2:** Look up the error
- Search in this file
- Check ERROR_LOG_AND_PREVENTION.md
- Check relevant FIX_*.md file

**Step 3:** Apply the fix
- Copy code pattern from documentation
- Adapt to your context
- Test locally first

**Step 4:** Prevent recurrence
- Add to prevention checklist
- Document in comments
- Mention in commit message

---

**Remember:** The best error is the one that never happens! 🛡️

