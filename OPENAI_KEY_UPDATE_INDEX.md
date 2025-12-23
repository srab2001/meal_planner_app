# 🔑 OpenAI Key Update Tools - Index

## 📍 You are here

This is your central hub for updating your OpenAI API key.

---

## 🚀 Quick Start (< 2 minutes)

```bash
# 1. Get your API key from:
https://platform.openai.com/api-keys

# 2. Run this command:
npm run update-key

# 3. Copy/paste your key when prompted
# 4. Done! ✨
```

---

## 📂 Files in This Directory

### 🛠️ Tools (Choose One)

| File | Command | Platform | Best For |
|------|---------|----------|----------|
| `update-openai-key.js` | `npm run update-key` | Mac/Linux/Windows | Everyone (easiest) |
| `update-openai-key.sh` | `./update-openai-key.sh sk-proj-...` | Mac/Linux | CLI users |
| `update-openai-key.bat` | `update-openai-key.bat sk-proj-...` | Windows | Windows users |

### 📖 Documentation (Choose By Your Needs)

| File | Read Time | Content |
|------|-----------|---------|
| **UPDATE_KEY_QUICK_REF.md** | 2 min | Just the basics - start here! |
| **OPENAI_KEY_UPDATE_SUMMARY.md** | 5 min | Overview of all tools |
| **OPENAI_KEY_UPDATE_GUIDE.md** | 15 min | Complete guide with troubleshooting |

---

## 🎯 Choose Your Path

### Path 1: "Just Do It" (Recommended)
1. Read: `UPDATE_KEY_QUICK_REF.md` (2 min)
2. Get your key: https://platform.openai.com/api-keys
3. Run: `npm run update-key`
4. Follow prompts
5. ✅ Done!

### Path 2: "Show Me Everything"
1. Read: `OPENAI_KEY_UPDATE_SUMMARY.md` (5 min)
2. Read: `OPENAI_KEY_UPDATE_GUIDE.md` (15 min)
3. Choose a tool (any of the 3)
4. Run it with your API key
5. ✅ Done!

### Path 3: "I'm a CLI Person"
1. Get your key: https://platform.openai.com/api-keys
2. Run: `./update-openai-key.sh sk-proj-your-key-here`
3. Watch it work
4. ✅ Done!

### Path 4: "Windows Developer"
1. Get your key: https://platform.openai.com/api-keys
2. Run: `update-openai-key.bat sk-proj-your-key-here`
3. Watch it work
4. ✅ Done!

---

## ❓ FAQ

### How do I get my API key?
1. Go to: https://platform.openai.com/api-keys
2. Sign in
3. Click "Create new secret key"
4. Copy it (you'll only see it once!)

### Which tool should I use?
**Recommended**: `npm run update-key` (works everywhere, interactive)

### What files get updated?
- `.env` (always)
- `fitness/.env` (if exists)
- `render.yaml` (if exists)

### What if something goes wrong?
Restore from backup:
```bash
mv .env.backup.TIMESTAMP .env
npm start
```

### How do I verify it worked?
```bash
grep OPENAI_API_KEY .env
npm start
curl http://localhost:5000/api/health
```

### Can I undo the change?
Yes! Backups are automatic. Restore with:
```bash
mv .env.backup.LATEST_TIMESTAMP .env
```

---

## 📚 What Each File Does

### update-openai-key.js
- **Type**: Interactive Node.js script
- **Best for**: Everyone
- **How to use**: `npm run update-key`
- **Features**: 
  - Colorful prompts
  - Input validation
  - Auto backups
  - Clear next steps

### update-openai-key.sh
- **Type**: Shell script
- **Best for**: Mac/Linux CLI users
- **How to use**: `./update-openai-key.sh sk-proj-your-key`
- **Features**:
  - One-line execution
  - Auto backups
  - Input validation
  - Progress display

### update-openai-key.bat
- **Type**: Windows batch script
- **Best for**: Windows Command Prompt users
- **How to use**: `update-openai-key.bat sk-proj-your-key`
- **Features**:
  - Windows native
  - Uses PowerShell for reliability
  - Auto backups
  - User-friendly output

---

## 🔐 Security Checklist

- ✅ Keep your API key secret
- ✅ Never commit `.env` to git
- ✅ Treat it like a password
- ✅ Don't hardcode in source code
- ✅ Don't share in Slack/email
- ✅ Rotate regularly (monthly)
- ✅ Monitor usage at https://platform.openai.com/account/billing

---

## 📊 What Happens

When you run any tool:

```
1. Validate key format
   ↓
2. Create backup of .env
   ↓
3. Update .env file
   ↓
4. Update fitness/.env (if exists)
   ↓
5. Update render.yaml (if exists)
   ↓
6. Show success message
   ↓
7. Provide next steps
```

All automatic, no manual editing needed!

---

## ✅ Verification

After running any tool:

```bash
# 1. Check it was updated
grep OPENAI_API_KEY .env

# 2. Restart server
npm start

# 3. Look for success message
# Should see: ✅ OpenAI client initialized

# 4. Test API
curl http://localhost:5000/api/health

# 5. Test a feature
# Open browser, try generating a meal
```

---

## 💾 Backups

Automatic backups with timestamps:
```
.env.backup.1703456789123
fitness/.env.backup.1703456789456
render.yaml.backup.1703456789789
```

Restore any time:
```bash
mv .env.backup.1703456789123 .env
npm start
```

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| "npm: command not found" | Install Node.js / npm |
| "Permission denied" | `chmod +x update-openai-key.sh` |
| "401 Unauthorized" | Create new API key at OpenAI |
| "Rate limit exceeded" | Wait or upgrade your plan |
| ".env not found" | Script creates it automatically |

---

## 📞 Getting Help

**Quick reference**: `UPDATE_KEY_QUICK_REF.md`

**Full guide**: `OPENAI_KEY_UPDATE_GUIDE.md`

**OpenAI resources**:
- Keys: https://platform.openai.com/api-keys
- Docs: https://platform.openai.com/docs
- Status: https://status.openai.com

---

## 🎁 Bonus Tips

- All tools create backups automatically
- All tools validate your API key format
- All tools provide clear error messages
- All tools work cross-platform
- No external dependencies needed
- Can be used for key rotation
- Can be used for emergency changes
- Perfect for team onboarding

---

## 📝 Checklist

- [ ] Read `UPDATE_KEY_QUICK_REF.md` (2 min)
- [ ] Get API key from OpenAI (1 min)
- [ ] Run `npm run update-key` (1 min)
- [ ] Verify with `grep OPENAI_API_KEY .env` (1 min)
- [ ] Restart server with `npm start` (1 min)
- [ ] Test with `curl http://localhost:5000/api/health` (1 min)

**Total Time**: ~7 minutes

---

## 🚀 Ready?

1. Get your API key: https://platform.openai.com/api-keys
2. Run: `npm run update-key`
3. Follow the prompts
4. Done! ✨

---

**Last Updated**: December 23, 2025  
**Status**: ✅ Ready to use  
**Version**: 1.0.0

