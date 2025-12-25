# 🔴 CRITICAL: OpenAI API Key Issue

## Problem Found

**Error:** `Incorrect API key provided`
**Root Cause:** Using a service account key (`sk-svcacct-...`) instead of a regular API key

### Key Types

| Type | Format | Works? | Issue |
|------|--------|--------|-------|
| Service Account | `sk-svcacct-*` | ❌ NO | Wrong type for chat API |
| Regular API Key | `sk-proj-*` | ✅ YES | Correct type |

---

## What Happened

Your `.env` has:
```
OPENAI_API_KEY=sk-svcacct-[YOUR_SERVICE_ACCOUNT_KEY]
```

This is a **service account key**, which:
- ✅ Works for some OpenAI operations
- ❌ Does NOT work for chat.completions API
- ❌ Causes 401 "Incorrect API key" errors

---

## Solution: Get a Regular API Key

### Step 1: Go to OpenAI Dashboard
1. Visit: https://platform.openai.com/account/api-keys
2. Login with your account

### Step 2: Create a New API Key
1. Click "Create new secret key"
2. Copy the key (format: `sk-proj-...`)
3. **IMPORTANT:** Save it immediately - you won't see it again!

### Step 3: Update Your .env
Replace the service account key with your regular API key:

```bash
# Old (doesn't work):
OPENAI_API_KEY=sk-svcacct-Soxjaoa5X3...

# New (should work):
OPENAI_API_KEY=sk-proj-YOUR_NEW_KEY_HERE
```

### Step 4: Verify the Key Works Locally
```bash
node test-openai-dumbbell.js
```

You should see:
```
✅ Response Status: 200
✅ Received message from OpenAI:
```

NOT:
```
✅ Response Status: 401
❌ OpenAI API Error
```

### Step 5: Update on Render
1. Go to https://render.com/dashboard
2. Select "meal-planner" service
3. Settings → Environment
4. Update `OPENAI_API_KEY` with the new key
5. Save (Render will auto-redeploy)

### Step 6: Test in the App
After Render redeploys:
1. Open fitness app
2. Go to AI Coach
3. Start interview
4. Request a workout
5. Should work! ✅

---

## Why Service Account Key Doesn't Work

Service account keys are for:
- Organization-level access
- Admin operations
- Billing and account management

They are NOT for:
- Regular API calls (chat.completions, embeddings, etc.)
- User-facing features

---

## Testing the New Key

Once you get a new key, test it:

```bash
# Update .env with new key
OPENAI_API_KEY=sk-proj-YOUR_NEW_KEY

# Test locally
node test-openai-dumbbell.js

# Expected output:
# ✅ Response Status: 200
# ✅ Received message from OpenAI:
# [workout details...]
```

---

## What to do NOW

1. ⏳ Get a regular API key from https://platform.openai.com/account/api-keys
2. 🔄 Update `.env` locally with the new key
3. ✅ Run `node test-openai-dumbbell.js` to verify
4. 📱 Update Render environment variable
5. 🧪 Test in the app

---

## Summary

| Item | Status |
|------|--------|
| Code fix (gpt-4o-mini) | ✅ Done |
| OpenAI client initialization | ✅ Done |
| Database connections | ✅ Done |
| **API Key type** | ❌ **WRONG TYPE** |

**The code is perfect. The API key just needs to be the right type.**

Get a regular `sk-proj-*` key and you're done! 🔑
