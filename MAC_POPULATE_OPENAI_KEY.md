# 🚀 Mac Users: Populate OpenAI API Key - Quick Guide

## You have a new script! 🎉

**File:** `populate-openai-key.sh`  
**Platform:** macOS (works perfectly on Mac)  
**Time needed:** 30 seconds

---

## How to Use (Pick One)

### Option 1: Interactive (Safest - Recommended)
```bash
./populate-openai-key.sh
```
- You'll be prompted to enter your API key
- Your input is hidden (secure)
- Script creates automatic backup of .env

### Option 2: Direct (Fastest)
```bash
./populate-openai-key.sh sk-proj-your-new-key-here
```
- Pass key as argument
- One-liner command

---

## What Happens Automatically

1. **Detects** if OPENAI_API_KEY already exists
2. **Creates backup** of your .env file (named `.env.backup.TIMESTAMP`)
3. **Updates or adds** the new key
4. **Validates** the format
5. **Confirms** success with masked key display

---

## Step-by-Step

### 1. Navigate to project root
```bash
cd /Users/stuartrabinowitz/Library/Mobile\ Documents/com~apple~CloudDocs/gitprojects/meal_planner
```

Or simply:
```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/gitprojects/meal_planner
```

### 2. Run the script
```bash
./populate-openai-key.sh
```

### 3. Paste your new OpenAI API key
- Script prompts: `Enter your OpenAI API key:`
- Paste key (it won't display as you type - normal on Mac!)
- Press Enter

### 4. Done!
- Script confirms: `✅ Done!`
- Key is now in your .env file
- Ready for local development

---

## Verification

Check that your key was added:
```bash
grep OPENAI_API_KEY .env
```

Should show:
```
OPENAI_API_KEY=sk-proj-your-key...
```

---

## Safety Features

✅ **Automatic Backup:** Before changing anything, script saves `.env.backup.TIMESTAMP`  
✅ **Format Validation:** Checks key starts with `sk-`  
✅ **Hidden Input:** Your key won't display as you type  
✅ **Confirmation:** Shows masked key and length  
✅ **No Git Commits:** Script only modifies `.env` locally  

---

## If Something Goes Wrong

### Restore from backup
```bash
ls -la .env.backup.*          # Find backup
cp .env.backup.1734974400 .env # Restore (use your timestamp)
```

### Permission issues
```bash
chmod +x populate-openai-key.sh
```

### Can't find script
```bash
ls -la populate-openai-key.sh
# File should exist in project root with -rwxr-xr-x permissions
```

---

## After Adding the Key Locally

**Local Development:**
```bash
npm start
# Server will use OPENAI_API_KEY from .env
```

**Production (Render):**
- Already updated at: https://dashboard.render.com > Environment
- No additional action needed
- Render auto-redeploys when you push code

---

## Summary

| Step | Action | Time |
|------|--------|------|
| 1 | Navigate to project | 5 sec |
| 2 | Run `./populate-openai-key.sh` | 10 sec |
| 3 | Paste your API key | 10 sec |
| 4 | Verify with `grep` | 5 sec |
| **Total** | **Complete** | **~30 sec** |

That's it! Your .env is now updated with the new OpenAI API key. 🎉
