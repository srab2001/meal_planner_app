# 🔑 Update OpenAI Key - Quick Reference

## 3 Ways to Update (Pick One)

### 1️⃣ **Interactive Tool** (Recommended)
```bash
npm run update-key
```
Follow the prompts, no command-line arguments needed.

### 2️⃣ **Shell Script** (Mac/Linux, Fastest)
```bash
./update-openai-key.sh sk-proj-your-actual-key-here
```

### 3️⃣ **Batch Script** (Windows)
```bash
update-openai-key.bat sk-proj-your-actual-key-here
```

---

## Get Your API Key

1. Go to: https://platform.openai.com/api-keys
2. Click **"Create new secret key"**
3. Copy it (you'll only see it once!)
4. Use any method above to insert it

---

## Verify It Worked

```bash
# 1. Check it's in the .env file
grep OPENAI_API_KEY .env

# 2. Restart the server
npm start

# 3. Look for this in logs:
# ✅ OpenAI client initialized successfully

# 4. Quick test
curl http://localhost:5000/api/health
```

---

## If Something Goes Wrong

### Restore From Backup
```bash
# See available backups
ls .env.backup.*

# Restore the most recent one
mv .env.backup.LATEST_NUMBER .env

# Restart
npm start
```

### Common Issues

| Problem | Solution |
|---------|----------|
| "Command not found" | Use `npm run update-key` instead |
| "Permission denied" | `chmod +x update-openai-key.sh` |
| "401 Unauthorized" | API key is invalid, create a new one |
| "Rate limit exceeded" | Wait a few minutes or upgrade your plan |
| ".env file not found" | Script creates it automatically |

---

## Files That Get Updated

- ✅ `.env` (Main config - always updated)
- ⚠️ `fitness/.env` (If exists)
- ⚠️ `render.yaml` (If exists)

---

## Security Notes

- 🔒 Keep your API key private
- 🔒 Never commit `.env` to git
- 🔒 Treat it like a password
- ❌ Don't hardcode in source
- ❌ Don't share in Slack/email

---

## Need Help?

- **Complete Guide**: `cat OPENAI_KEY_UPDATE_GUIDE.md`
- **Check Status**: https://status.openai.com
- **View Keys**: https://platform.openai.com/api-keys
- **Documentation**: https://platform.openai.com/docs

---

**Quick Tip**: Use `npm run update-key` - it's the easiest! 🚀
