# ⚠️ Outdated Documentation Notice

**Date:** December 25, 2025

---

## 📌 Current Documentation (Use These)

**For deployment, use:**
- [DEPLOYMENT_INSTRUCTIONS.md](DEPLOYMENT_INSTRUCTIONS.md) - Simple 3-step guide ✅
- [RUN_MIGRATIONS_ON_RENDER.md](RUN_MIGRATIONS_ON_RENDER.md) - Render Shell commands ✅
- [../SINGLE_DATABASE_PLAN.md](../SINGLE_DATABASE_PLAN.md) - Quick action plan ✅

---

## 🗑️ Outdated Documentation (Don't Use)

The following documents reference **dual database architecture** (Render + Neon) which we are **NOT using**:

### Outdated Deployment Docs:
- ❌ `DEPLOYMENT_GUIDE.md` - References FITNESS_DATABASE_URL and Neon
- ❌ `DEPLOYMENT_STATUS.md` - References Neon PostgreSQL
- ❌ `DEPLOYMENT_PACKAGE.md` - References dual databases
- ❌ `DEPLOYMENT_READY.md` - References FITNESS_DATABASE_URL
- ❌ `DEPLOYMENT_SCRIPTS_READY.md` - References Neon
- ❌ `PRE_DEPLOYMENT_CHECKLIST.md` - References FITNESS_DATABASE_URL
- ❌ `QUICK_DEPLOY.md` - References FITNESS_DATABASE_URL
- ❌ `verify-env.sh` - References FITNESS_DATABASE_URL

### Outdated Technical Docs:
- ❌ `docs/FITNESS_MONOREPO_SEPARATE_DB.md` - Dual database architecture
- ❌ `docs/BACKEND_ROUTES_IMPLEMENTATION_SUMMARY.md` - References FITNESS_DATABASE_URL

---

## ✅ What Changed

**Old Architecture (Complex):**
```
Backend → DATABASE_URL (Render) → Main app
       → FITNESS_DATABASE_URL (Neon) → Fitness
```

**New Architecture (Simple):**
```
Backend → DATABASE_URL (Render) → Everything
                                   ├─ Main app
                                   └─ Fitness
```

---

## 📝 Key Differences

| Old (Dual DB) | New (Single DB) |
|--------------|-----------------|
| Two databases | One database |
| FITNESS_DATABASE_URL required | FITNESS_DATABASE_URL NOT needed |
| Neon PostgreSQL for fitness | Render PostgreSQL for all |
| Complex setup | Simple setup |
| Two connection strings | One connection string |

---

## 🎯 For New Deployments

**Use:** [DEPLOYMENT_INSTRUCTIONS.md](DEPLOYMENT_INSTRUCTIONS.md)

**Steps:**
1. Run migrations in Render Shell
2. Verify environment variables (only DATABASE_URL needed)
3. Redeploy and test

**Total time:** 10-15 minutes

---

## 🔄 Migration from Old Docs

If you were following the old dual-database approach:

1. **Ignore** references to FITNESS_DATABASE_URL
2. **Remove** FITNESS_DATABASE_URL from Render if added
3. **Use** single DATABASE_URL (Render PostgreSQL)
4. **Run** migrations to Render database
5. **Deploy** and test

---

## 📞 Questions?

**Why the change?**
- Simpler architecture
- Easier to maintain
- Lower cost
- Single source of truth

**Can I still use dual databases?**
- Yes, but not recommended
- More complex
- Not covered in current docs

**What about existing Neon data?**
- If you already ran migrations to Neon, you can:
  1. Use single Render DB (recommended)
  2. Or migrate data from Neon to Render

---

**Decision:** Single Render PostgreSQL database
**Status:** Active
**Documentation:** Up to date

---

**Created:** December 25, 2025
**Purpose:** Clarify documentation status
**Action:** Use DEPLOYMENT_INSTRUCTIONS.md for new deployments
