# Store Locator Troubleshooting Guide

## Problem
Users see "Unable to find stores" error when entering a ZIP code on the onboarding flow.

## Root Causes (In Order of Likelihood)

### 1. ❌ OpenAI API Key Not Set on Render
**Symptom:** Works locally but fails in production (Render)

**Check:**
```bash
# On Render dashboard, check Environment Variables:
# Settings > Environment Variables
# Should have: OPENAI_API_KEY=sk-svcacct-...
```

**Fix:**
1. Go to https://dashboard.render.com
2. Select the meal-planner backend service
3. Go to "Environment"
4. Add or update `OPENAI_API_KEY` with the correct key from `.env`
5. Trigger a new deployment

### 2. ❌ OpenAI API Key Expired or Invalid
**Symptom:** Error appears randomly or after recent API key changes

**Check:**
```bash
# Test the key locally:
OPENAI_API_KEY="your-key" node -e "
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'test' }]
}).then(() => console.log('✅ Key is valid'))
  .catch(e => console.error('❌ Key error:', e.message));
"
```

**Fix:**
- Generate new key from https://platform.openai.com/api-keys
- Update in `.env` and on Render

### 3. ❌ Rate Limiting
**Symptom:** Works once, then fails on subsequent requests

**Check:**
- Look at server logs for `Rate limited` messages
- The endpoint uses `aiLimiter` middleware (max 10 req/min per user)

**Fix:**
- Increase rate limit in `server.js` if needed
- Or wait between requests

### 4. ❌ OpenAI Returns Invalid/Empty Response
**Symptom:** Endpoint returns error about "Invalid response from AI service"

**Check:**
- Look at server logs for: `❌ JSON parse error` or `❌ Response missing stores array`
- This means GPT returned something that doesn't match expected JSON format

**Fix:**
- The prompt might need adjustment if OpenAI behavior changed
- Or add fallback stores for known ZIP codes

### 5. ❌ Database Not Connected
**Symptom:** Server returns 500 with generic error

**Check:**
- Verify DATABASE_URL is set on Render
- Test: `psql $DATABASE_URL`

### 6. ❌ Frontend Not Sending Token
**Symptom:** Returns 401 "Not authenticated"

**Check:**
- Browser console: `localStorage.getItem('auth_token')`
- Should have a valid JWT token
- Check if user is logged in

## Recent Improvements

### Enhanced Error Logging (Added)
File: `server.js` (lines 621-657)
```javascript
// Now logs:
// - ✅ If API key is missing
// - 📍 Prompt being sent
// - 📝 Raw OpenAI response (first 200 chars)
// - ❌ JSON parse errors with actual response text
// - ⚠️  If stores array is empty
// - ✅ Success count
// - ❌ Specific error type (rate limit, auth, etc)
```

### Better Frontend Error Messages
File: `client/src/components/ZIPCodeInput.js` (lines 57-70)
```javascript
// Now provides context-specific errors:
// - "Too many requests" for 429 status
// - "Authentication error" for 401 status
// - Includes error message from server
```

## Debugging Steps

### Step 1: Check Server Logs
```bash
# On Render, in the Service Logs:
# Look for these patterns:
# 🔍 Finding stores within 10 miles of ZIP: XXXXX
# ❌ OPENAI_API_KEY not set!
# 📍 Raw OpenAI response: ...
# ❌ JSON parse error: ...
# ✅ Found X stores for ZIP XXXXX
```

### Step 2: Test the Endpoint Directly
```bash
# Get a JWT token first (must be logged in to app)
# Then test via curl:

curl -X POST https://meal-planner-app-mve2.onrender.com/api/find-stores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"zipCode":"27617"}'

# Should respond with:
# {"stores": [{...}, {...}]}
```

### Step 3: Test OpenAI Key Directly on Render
```bash
# In Render terminal:
node -e "
const OpenAI = require('openai');
const key = process.env.OPENAI_API_KEY;
console.log('Key exists:', !!key);
console.log('Key starts with sk-:', key?.startsWith('sk-'));

const openai = new OpenAI({ apiKey: key });
openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'list 2 stores in JSON' }]
}).then(r => console.log('✅ Success:', r.choices[0].message.content.substring(0, 100)))
  .catch(e => console.error('❌ Error:', e.message));
"
```

## Monitoring

### Check These Regularly
1. **OpenAI API Dashboard**: https://platform.openai.com/usage
   - Check remaining balance
   - Check rate limits
   
2. **Render Logs**: https://dashboard.render.com
   - Select service → Logs
   - Search for "Finding stores" or "Error finding stores"

3. **Browser Console**: In production app, F12 → Console
   - Should show the actual error response from server
   - Copy full error message to help debugging

## Fallback Strategy

If OpenAI fails, consider implementing:
```javascript
// In server.js, add after catch block:
const FALLBACK_STORES = {
  '27617': [
    { name: 'Harris Teeter', address: 'Raleigh, NC', distance: '2 miles', type: 'Conventional' },
    { name: 'Whole Foods', address: 'Raleigh, NC', distance: '3 miles', type: 'Organic' },
    // ... more stores
  ]
};

// Use fallback if OpenAI fails
if (FALLBACK_STORES[zipCode]) {
  return res.json({ stores: FALLBACK_STORES[zipCode] });
}
```

## Quick Checklist

- [ ] OPENAI_API_KEY is set on Render environment
- [ ] Key is valid (not expired)
- [ ] User is logged in (has valid JWT token)
- [ ] Backend is deployed (git push origin main)
- [ ] Vercel frontend is updated (check deployment)
- [ ] Browser cache cleared (test in incognito)
- [ ] Check server logs for actual error
- [ ] Test with valid US ZIP code (e.g., 27617)
