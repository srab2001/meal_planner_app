# ✅ OpenAI API Key Update Checklist

## What You've Done
- ✅ Created new OpenAI API key
- ✅ Updated key in **Render environment variables**

## What Still Needs to Be Updated

### Priority: HIGH (Code/Config)

**1. `.env` file (Local Development)**
- **Location:** `/Users/stuartrabinowitz/.../meal_planner/.env`
- **Line:** 16
- **Current:** `OPENAI_API_KEY=sk-svcacct-...` (old key)
- **Action Required:** Update to your NEW API key
- **Impact:** Needed for local testing

**2. No other files need the actual key value**
- The code reads from `process.env.OPENAI_API_KEY`
- `server.js` uses the environment variable (lines 126, 159, 615, etc.)
- All references are to the ENV variable, not hardcoded

### Priority: MEDIUM (Documentation)
These are just examples in docs, no action needed:
- `.env.example` - Shows template (no real key)
- `render.yaml` - Configuration template
- Various `.md` files - Just reference the key, don't contain it

### Priority: LOW (Optional Scripts)
These scripts update keys automatically - no action needed:
- `update-openai-key.sh` - Bash script
- `update-openai-key.bat` - Windows script  
- `update-openai-key.js` - Node.js script

---

## Quick Summary

**Only 1 file needs manual update:**

### Update `.env` file:

```bash
# Current (old key - redacted)
OPENAI_API_KEY=sk-svcacct-[REDACTED_OLD_KEY]

# Update to (new key)
OPENAI_API_KEY=<YOUR_NEW_KEY_HERE>
```

---

## Verification

After updating `.env`, verify the key is in both places:

```bash
# Check local .env
grep "OPENAI_API_KEY" .env

# Render will auto-use what you already set
# No need to commit the real key to git (it's already in .env)
```

---

## Summary

✅ **Render:** Already updated ✓  
⏳ **Local .env:** Update with new key  
📝 **Git:** Don't commit `.env` (it's in .gitignore)  
✅ **Code:** Uses environment variables (no changes needed)  

**Time to Complete:** ~2 minutes
