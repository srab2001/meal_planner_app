# 🔴 URGENT: OpenAI API Key Mismatch on Render

## Root Cause Identified

The store locator is failing with:
```
❌ Error finding stores: 401 Incorrect API key provided: sk-proj-...
```

**The Problem:**
- Render is using an **old/invalid** OpenAI API key (starts with `sk-proj-`)
- Your `.env` file has the **correct** key (starts with `sk-svcacct-`)
- The mismatch causes **all store locator requests to fail**

## Quick Fix (5 minutes)

### Step 1: Go to Render Dashboard
https://dashboard.render.com

### Step 2: Update Environment Variable
1. Click on **meal-planner-app-mve2** service
2. Go to **Settings** tab
3. Scroll to **Environment** section
4. Find the row with `OPENAI_API_KEY`
5. Click on it to edit
6. **Replace the entire value with:**
```
[REDACTED]
```
7. Click **Save Changes**

### Step 3: Render Auto-Deploys
- Render will automatically redeploy with the new key
- Wait 1-2 minutes for deployment
- Check: "Available at your primary URL" message in Logs

### Step 4: Test Store Locator
Go to https://meal-planner-gold-one.vercel.app and try:
- ZIP code: **21029**
- Store name: **TEETER**
- Should now show stores! ✅

## Why This Happened

The `sk-proj-` key is from an old OpenAI account or has been revoked. The `sk-svcacct-` key is your current valid service account key.

When you updated the key locally, you forgot to update it on Render's environment variables.

## Verification

After updating, you should see in Render logs:
```
✅ Found X stores for ZIP 21029
```

Instead of:
```
❌ Error finding stores: 401 Incorrect API key
```

---

**Status:** 🔴 Action Required  
**Severity:** High - Blocks store locator feature  
**Time to Fix:** ~5 minutes
