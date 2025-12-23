# 🔑 OpenAI API Key Update Guide

Quick guide for updating your OpenAI API key in the Meal Planner project.

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Three Update Methods](#three-update-methods)
- [Files That Get Updated](#files-that-get-updated)
- [Verification Steps](#verification-steps)
- [Troubleshooting](#troubleshooting)
- [Backup & Recovery](#backup--recovery)

---

## 🚀 Quick Start

### Get Your API Key

1. Go to: https://platform.openai.com/api-keys
2. Sign in with your OpenAI account
3. Click **"Create new secret key"**
4. Copy the key (it starts with `sk-proj-` or `sk-`)
5. Keep it safe - you'll only see it once!

### Choose Your Update Method

Pick the method that works best for you:

| Method | Command | Platform | Speed |
|--------|---------|----------|-------|
| **Interactive** | `npm run update-key` | Mac/Linux/Windows | Fast |
| **Shell Script** | `./update-openai-key.sh sk-proj-...` | Mac/Linux | Fastest |
| **Batch Script** | `update-openai-key.bat sk-proj-...` | Windows | Fastest |

---

## Three Update Methods

### Method 1: Interactive (Recommended)

**Best for: Everyone, especially first-time updates**

```bash
npm run update-key
```

This launches an interactive tool that:
- Validates your API key format
- Shows you what files it's updating
- Creates automatic backups
- Confirms success with next steps

### Method 2: Shell Script (Mac/Linux)

**Best for: Command-line users**

```bash
# First, make the script executable
chmod +x update-openai-key.sh

# Then run it with your API key
./update-openai-key.sh sk-proj-your-actual-key-here
```

Example:
```bash
./update-openai-key.sh sk-proj-xyz123abc456def789
```

### Method 3: Batch Script (Windows)

**Best for: Windows Command Prompt users**

```cmd
update-openai-key.bat sk-proj-your-actual-key-here
```

Example:
```cmd
update-openai-key.bat sk-proj-xyz123abc456def789
```

---

## 📁 Files That Get Updated

The scripts automatically update these files (in order of priority):

### 1. **Main .env file** (Required)
- **Location**: `.env` (in project root)
- **What it contains**: `OPENAI_API_KEY=sk-proj-...`
- **Used by**: Backend API server, AI features
- **Status**: Created if doesn't exist

### 2. **Fitness Backend .env** (Optional)
- **Location**: `fitness/.env`
- **What it contains**: `OPENAI_API_KEY=sk-proj-...`
- **Used by**: Fitness module AI Coach feature
- **Status**: Skipped if doesn't exist

### 3. **Render Config** (Optional)
- **Location**: `render.yaml`
- **What it contains**: `OPENAI_API_KEY: sk-proj-...`
- **Used by**: Deployment environment variables
- **Status**: Skipped if doesn't exist

---

## ✅ Verification Steps

After updating your API key:

### 1. Check File Updates

```bash
# Check main .env file
grep OPENAI_API_KEY .env

# Check fitness .env (if it exists)
grep OPENAI_API_KEY fitness/.env 2>/dev/null || echo "Not found (optional)"
```

Expected output:
```
OPENAI_API_KEY=sk-proj-abc123...
```

### 2. Restart Server

```bash
# Kill old process
pkill -f "node server.js" 2>/dev/null || true

# Start server with new key
npm start
```

Look for this log message:
```
✅ Server running on port 5000
[OpenAI] Client initialized successfully
```

### 3. Test API Call

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Should return: {"status":"ok"}
```

### 4. Test AI Features

```bash
# Test meal generation (requires authentication)
# You'll need a valid JWT token first

# Or just open the app in browser:
# http://localhost:3000
# Try generating a meal plan - if it works, your key is good!
```

### 5. Check Logs for Errors

```bash
# Look for these in server logs:
# ✅ "OpenAI client initialized"  (GOOD)
# ❌ "401 Unauthorized"           (BAD - invalid key)
# ❌ "RateLimitError"             (BAD - quota exceeded)
# ❌ "Cannot find module"         (BAD - missing .env file)
```

---

## 🔍 Troubleshooting

### Problem: "OPENAI_API_KEY not found"

**Solution:**
```bash
# Verify the key is in .env
cat .env | grep OPENAI_API_KEY

# If not there, add it manually:
echo "OPENAI_API_KEY=sk-proj-your-key-here" >> .env
```

### Problem: "401 Unauthorized" Error

**Solution:** Your API key might be invalid

```bash
# 1. Check your key matches what's in platform.openai.com
# 2. Verify it hasn't been revoked
# 3. Make sure you copied the entire key (they're long!)
# 4. Create a new key and try again
```

### Problem: "Rate limit exceeded"

**Solution:** You've hit OpenAI's rate limit

```bash
# Options:
# 1. Wait a few minutes
# 2. Check usage at: https://platform.openai.com/account/billing/overview
# 3. Upgrade your account plan if needed
# 4. Use a different API key from a different account
```

### Problem: Server won't start after update

**Solution:** Restore from backup

```bash
# List available backups
ls -la .env.backup.* 2>/dev/null

# Restore the most recent one
mv .env.backup.LATEST_NUMBER .env

# Try starting again
npm start
```

### Problem: "Module not found" errors

**Solution:** Reinstall dependencies

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Start server
npm start
```

---

## 💾 Backup & Recovery

### Automatic Backups

All scripts automatically create timestamped backups:

```
.env.backup.1703456789123
fitness/.env.backup.1703456789456
render.yaml.backup.1703456789789
```

The timestamp is in Unix milliseconds, making each backup unique.

### Restore From Backup

To restore a file to its previous state:

```bash
# Find the backup
ls -la .env.backup.*

# Restore it (replace TIMESTAMP with actual number)
mv .env.backup.TIMESTAMP .env

# Restart server
npm start
```

### View Backup Contents

```bash
# See what's different
diff .env .env.backup.1703456789123

# View the backup file
cat .env.backup.1703456789123 | grep OPENAI_API_KEY
```

### Delete Old Backups

```bash
# Keep only the 3 most recent backups
ls -t .env.backup.* | tail -n +4 | xargs rm -f

# Or delete all backups if you're sure
rm -f .env.backup.*
```

---

## 🔒 Security Best Practices

### ✅ Do's

- ✅ Keep your API key **secret** - treat it like a password
- ✅ Never share your `.env` file with anyone
- ✅ Never commit `.env` to git (it's in `.gitignore`)
- ✅ Rotate your key regularly (monthly is good)
- ✅ Monitor usage at https://platform.openai.com/account/billing/overview
- ✅ Set a spending limit to prevent surprise bills
- ✅ Use separate keys for different environments (dev, staging, prod)

### ❌ Don'ts

- ❌ Don't hardcode API keys in source code
- ❌ Don't share API keys in Slack, email, or chat
- ❌ Don't use the same key for multiple projects
- ❌ Don't leave API keys in terminal history
- ❌ Don't commit `.env` files to repositories
- ❌ Don't expose your key in error messages or logs

---

## 📊 File Format Reference

### .env File Format

```bash
# Comments start with #
OPENAI_API_KEY=sk-proj-abc123xyz789def456

# Multiple variables can be in one file
GOOGLE_CLIENT_ID=123456789
GOOGLE_CLIENT_SECRET=secret-value
SESSION_SECRET=random-string
```

### render.yaml Format

```yaml
# YAML format uses colons
env:
  - key: OPENAI_API_KEY
    value: sk-proj-abc123xyz789def456
  
  - key: GOOGLE_CLIENT_ID
    value: 123456789
```

### Server.js Usage

```javascript
// How it's used in code (don't edit this):
const { OPENAI_API_KEY } = process.env;
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
```

---

## 🆘 Getting Help

If something goes wrong:

### 1. Check the logs

```bash
# Look at server logs
npm start

# Look for OPENAI or ERROR messages
```

### 2. Verify the key works

```bash
# Test key directly with OpenAI
curl -H "Authorization: Bearer sk-proj-your-key-here" \
  https://api.openai.com/v1/models
```

### 3. Check OpenAI status

- OpenAI Status: https://status.openai.com
- API Documentation: https://platform.openai.com/docs
- Account Settings: https://platform.openai.com/account
- Billing Page: https://platform.openai.com/account/billing

### 4. Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | Invalid/expired key | Create new key |
| `429 Rate Limit` | Too many requests | Wait or upgrade plan |
| `503 Service Unavailable` | OpenAI down | Check status page |
| `Cannot find module` | .env not found | Create .env file |
| `OPENAI_API_KEY undefined` | Key not in .env | Run update script |

---

## 📞 Support

Need help? Check these resources:

- **OpenAI Docs**: https://platform.openai.com/docs
- **API Keys Page**: https://platform.openai.com/api-keys
- **Status Page**: https://status.openai.com
- **Community**: https://community.openai.com

---

## ⚡ Quick Reference

```bash
# Most common commands:

# Interactive update (easiest)
npm run update-key

# Shell script update (fastest on Mac/Linux)
./update-openai-key.sh sk-proj-your-key

# Verify it worked
grep OPENAI_API_KEY .env

# Test the server
npm start

# Restore from backup if something breaks
mv .env.backup.LATEST .env
```

---

## 📝 Change Log

When you updated your API key:

- **Date**: _________________
- **Old Key**: `sk-proj-...` (first 12 chars only)
- **New Key**: `sk-proj-...` (first 12 chars only)
- **Files Updated**: `_________________`
- **Backup Location**: `_________________`
- **Verified Working**: ☐ Yes ☐ No

---

**Last Updated**: December 23, 2025
**Script Version**: 1.0.0
**Compatibility**: Node.js 14+, Python 3.8+

