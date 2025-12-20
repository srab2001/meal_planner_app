# 📚 Meal Planner App - Documentation Index# 🗂️ AI Meal Planner Installation - Master Index



> **Last Updated**: December 2025  ## 📦 Complete Installation Package - All Files

> **Version**: 2.0

---

---

## 🚀 START HERE

## 🏠 Production URLs

**New to this? Start with:**

| Service | URL |1. [DOWNLOAD_ALL_FILES.md](computer:///mnt/user-data/outputs/DOWNLOAD_ALL_FILES.md) - Master download list

|---------|-----|2. [QUICKSTART.md](computer:///mnt/user-data/outputs/QUICKSTART.md) - 5-minute installation

| **Frontend** | https://meal-planner-app-chi.vercel.app |

| **Backend** | https://meal-planner-app-mve2.onrender.com |**Want complete instructions?**

3. [README_INSTALLATION.md](computer:///mnt/user-data/outputs/README_INSTALLATION.md) - Full guide

---

---

## 🎯 Quick Navigation

## 📥 Installation Scripts (Download These)

### 🚀 Getting Started

| Document | Description |### Required Scripts:

|----------|-------------|

| **[README.md](./README.md)** | Main overview and quick start |1. **[complete-install.sh](computer:///mnt/user-data/outputs/complete-install.sh)** ⭐ **START HERE**

| **[QUICKSTART.md](./QUICKSTART.md)** | 5-minute installation guide |   - Master installation script

| **[README_INSTALLATION.md](./README_INSTALLATION.md)** | Complete installation guide |   - Runs all other scripts automatically

   - Creates backups

### 📊 Architecture & Data Model   - Shows progress

| Document | Description |   - **Run this first!**

|----------|-------------|

| **[DATA_MODEL.md](./DATA_MODEL.md)** | ⭐ Complete database schema with Mermaid diagrams |2. **[create-backend-files.sh](computer:///mnt/user-data/outputs/create-backend-files.sh)**

| **[REQUIREMENTS_AND_FEATURES.md](./REQUIREMENTS_AND_FEATURES.md)** | Feature specifications |   - Creates backend scraper files

   - Generates price-cache.js

### 🚀 Deployment   - Generates base-scraper.js

| Document | Description |   - Generates harris-teeter-scraper.js with mock data

|----------|-------------|   - Generates pdf-parser.js

| **[DEPLOY_TO_RENDER.md](./DEPLOY_TO_RENDER.md)** | Backend deployment to Render |

| **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** | Frontend deployment to Vercel |3. **[create-frontend-files.sh](computer:///mnt/user-data/outputs/create-frontend-files.sh)**

| **[PRODUCTION_CONFIG.md.example](./PRODUCTION_CONFIG.md.example)** | Environment configuration template |   - Creates React components

| **[render.yaml](./render.yaml)** | Render infrastructure as code |   - Generates ZIPCodeInput.js + CSS

| **[docker-compose.yml](./docker-compose.yml)** | Local Docker setup |   - Generates StoreSelection.js + CSS

   - Full working code included

---

4. **[update-server.sh](computer:///mnt/user-data/outputs/update-server.sh)**

## 🖥️ Application Modules   - Updates server.js automatically

   - Adds imports (priceCache, scrapers)

### Core Modules   - Adds /api/find-stores endpoint

   - Adds /api/scrape-store-prices endpoint

| Module | Location | Description | Status |

|--------|----------|-------------|--------|---

| 🍽️ **Meal Planner** | `client/src/components/` | AI meal plans, recipes, shopping lists | ✅ Core |

| 🥗 **Nutrition** | `client/src/modules/nutrition/` | Read-only nutrition analysis | ✅ Active |## 📖 Documentation Files (Download These)

| 💪 **Coaching** | `client/src/modules/coaching/` | AI health coaching | ✅ Active |

| 📈 **Progress** | `client/src/modules/progress/` | Streaks, badges, referrals | ✅ Active |### Essential Guides:

| 🔗 **Integrations** | `client/src/modules/integrations/` | Health data integrations | 🚧 Feature-flagged |

5. **[UPDATE_APP_JS_GUIDE.md](computer:///mnt/user-data/outputs/UPDATE_APP_JS_GUIDE.md)** ⭐ **REQUIRED**

### Module-Specific Documentation   - Complete App.js update instructions

   - Shows exact changes needed

| Document | Module |   - Includes full example code

|----------|--------|   - Checklist at the end

| **[NUTRITION_MODULE_DESIGN.md](./NUTRITION_MODULE_DESIGN.md)** | Nutrition |   - **You must follow this after running scripts!**

| **[COACHING_APP_DESIGN.md](./COACHING_APP_DESIGN.md)** | Coaching |

6. **[README_INSTALLATION.md](computer:///mnt/user-data/outputs/README_INSTALLATION.md)**

---   - Complete installation guide

   - Step-by-step instructions

## 🗄️ Database Schema   - Troubleshooting section

   - Verification commands

### PostgreSQL Tables   - Daily usage instructions



| Table | Purpose | Key Fields |7. **[QUICKSTART.md](computer:///mnt/user-data/outputs/QUICKSTART.md)**

|-------|---------|------------|   - 5-minute quick start guide

| `users` | User accounts | id, google_id, email, display_name |   - Minimal instructions

| `meal_plan_history` | Generated plans | user_id, meal_plan (JSONB), preferences |   - Common fixes

| `favorites` | Saved meals | user_id, meal_type, meal_data (JSONB) |   - One-command installation

| `shopping_list_states` | Shopping progress | user_id, checked_items (JSONB) |

| `user_preferences` | User settings | default_cuisines, dietary, theme |### Reference Documentation:

| `subscriptions` | Payment plans | stripe_customer_id, plan_type |

| `usage_stats` | Analytics | action_type, metadata |8. **[DOWNLOAD_ALL_FILES.md](computer:///mnt/user-data/outputs/DOWNLOAD_ALL_FILES.md)**

| `session` | Express sessions | sid, sess, expire |   - Master download list

| `cuisine_options` | Available cuisines | name, display_order |   - File descriptions

| `dietary_options` | Dietary restrictions | key, label |   - Installation order

| `app_settings` | Global config | key, value |   - Feature summary



**Full schema details**: [DATA_MODEL.md](./DATA_MODEL.md)9. **[PHASE_1_IMPLEMENTATION.md](computer:///mnt/user-data/outputs/PHASE_1_IMPLEMENTATION.md)**

   - Technical implementation details

---   - Full source code

   - Architecture explanation

## 📁 Project Structure   - Component specifications



```10. **[COMPLETE_INSTALLATION_README.md](computer:///mnt/user-data/outputs/COMPLETE_INSTALLATION_README.md)**

meal_planner_app/    - Comprehensive reference

├── client/                    # React Frontend    - All features explained

│   ├── src/    - Advanced configuration

│   │   ├── components/        # Core meal planner components    - Future enhancements

│   │   │   ├── App.js         # Main application router

│   │   │   ├── MealPlanView.js---

│   │   │   ├── RecipeModal.js

│   │   │   ├── ShoppingList.js## 🎯 Quick Reference

│   │   │   └── AppSwitchboard.js

│   │   ├── modules/           # Feature modules### Installation Process:

│   │   │   ├── nutrition/     # Nutrition tracking

│   │   │   ├── coaching/      # Health coaching```

│   │   │   ├── progress/      # Gamification1. Download all files above

│   │   │   └── integrations/  # Health data integrations   ↓

│   │   └── shared/            # Shared utilities2. Run: ./complete-install.sh

│   │       ├── services/      # Analytics, Feature flags   ↓

│   │       ├── context/       # React contexts3. Follow: UPDATE_APP_JS_GUIDE.md

│   │       └── utils/         # API utilities   ↓

│   └── public/4. Test: Start backend & frontend

├── migrations/                # SQL migrations   ↓

│   ├── 001_initial_schema.sql5. Success! 🎉

│   ├── 007_favorites.sql```

│   ├── 007_shopping_list_states.sql

│   └── 011_recreate_meal_plan_history.sql### File Categories:

├── server.js                  # Express backend

├── db.js                      # PostgreSQL connection| Category | Files | Purpose |

└── package.json|----------|-------|---------|

```| **Scripts** | 4 files | Automate installation |

| **Guides** | 3 files | Step-by-step instructions |

---| **Reference** | 3 files | Technical documentation |



## 🔧 Configuration Files---



| File | Purpose |## 📋 Installation Checklist

|------|---------|

| `.env` | Backend environment variables |### Pre-Installation:

| `client/.env` | Frontend environment variables |- [ ] Downloaded complete-install.sh

| `render.yaml` | Render deployment config |- [ ] Downloaded create-backend-files.sh

| `Dockerfile` | Container build |- [ ] Downloaded create-frontend-files.sh

| `docker-compose.yml` | Local development |- [ ] Downloaded update-server.sh

| `package.json` | Dependencies |- [ ] Downloaded UPDATE_APP_JS_GUIDE.md

- [ ] All files in ~/Downloads

---

### Run Installation:

## 🔐 Authentication- [ ] Made scripts executable (`chmod +x *.sh`)

- [ ] Ran `./complete-install.sh`

| Component | Technology |- [ ] Scripts completed successfully

|-----------|------------|- [ ] Backups created

| OAuth Provider | Google OAuth 2.0 |

| Backend Auth | Passport.js |### Manual Steps:

| Session Store | PostgreSQL (connect-pg-simple) |- [ ] Opened UPDATE_APP_JS_GUIDE.md

| Token Storage | JWT in localStorage |- [ ] Updated App.js with 5 changes

- [ ] Verified .env has PORT=5000

---- [ ] Fixed any issues



## 📡 API Reference### Testing:

- [ ] Started backend (port 5000)

### Authentication Endpoints- [ ] Started frontend (port 3000)

```- [ ] Logged in successfully

GET  /auth/google              - Initiate OAuth- [ ] ZIP code page appears

GET  /auth/google/callback     - OAuth callback- [ ] Store selection works

POST /auth/logout              - End session- [ ] Meal plan generates

GET  /api/auth/status          - Check auth status

```---



### Meal Planning Endpoints## 🗺️ Documentation Map

```

POST /api/meal-plan            - Generate meal plan```

GET  /api/meal-plan            - Get current planStart

POST /api/regenerate-meal      - Regenerate single meal  │

POST /api/modify-recipe        - Modify ingredients  ├─→ Quick Install? → QUICKSTART.md

```  │

  ├─→ Complete Guide? → README_INSTALLATION.md

### Favorites Endpoints  │

```  ├─→ Download List? → DOWNLOAD_ALL_FILES.md

GET    /api/favorites          - Get user favorites  │

POST   /api/favorites          - Add favorite  └─→ Technical Details? → PHASE_1_IMPLEMENTATION.md

DELETE /api/favorites/:id      - Remove favorite

```After Installation

  │

### Nutrition Endpoints  └─→ Update App.js → UPDATE_APP_JS_GUIDE.md

``````

GET  /api/nutrition/meal-plan-summary  - Nutrition summary

GET  /api/nutrition/daily/:date        - Daily nutrition---

GET  /api/nutrition/weekly             - Weekly nutrition

```## 🎓 What Each File Does



---### complete-install.sh

- ✅ Auto-detects project directory

## 🧪 Testing- ✅ Confirms path with user

- ✅ Runs all sub-scripts

| Type | Location | Command |- ✅ Creates backups

|------|----------|---------|- ✅ Shows progress

| Unit Tests | `client/src/**/__tests__/` | `npm test` |- ✅ Lists next steps

| CI Pipeline | GitHub Actions | Automatic on push |

### create-backend-files.sh

---- ✅ Creates scrapers/ directory

- ✅ Generates price-cache.js (caching system)

## 🚀 Deployment Checklist- ✅ Generates base-scraper.js (base class)

- ✅ Generates harris-teeter-scraper.js (mock data)

### Backend (Render)- ✅ Generates pdf-parser.js (PDF parsing)

- [ ] PostgreSQL database created

- [ ] Environment variables configured### create-frontend-files.sh

- [ ] Docker build successful- ✅ Creates ZIPCodeInput.js (ZIP entry page)

- [ ] Health check passing- ✅ Creates ZIPCodeInput.css (styling)

- ✅ Creates StoreSelection.js (store picker)

### Frontend (Vercel)- ✅ Creates StoreSelection.css (styling)

- [ ] Connected to GitHub repo- ✅ Backups existing files

- [ ] Environment variables set

- [ ] Build successful### update-server.sh

- [ ] Custom domain configured (optional)- ✅ Backs up server.js

- ✅ Adds price scraping imports

### Google OAuth- ✅ Adds getScraper() function

- [ ] Redirect URIs updated in Google Console- ✅ Adds /api/find-stores endpoint

- [ ] Production callback URL added- ✅ Adds /api/scrape-store-prices endpoint

- [ ] Test authentication flow- ✅ Verifies changes



---### UPDATE_APP_JS_GUIDE.md

- ✅ Shows required imports

## 📋 Strategy Documents- ✅ Shows state variables to add

- ✅ Shows handler functions to add

| Document | Purpose |- ✅ Shows JSX sections to add

|----------|---------|- ✅ Includes complete example

| **[HEALTH_PORTAL_EXPANSION_STRATEGY.md](./HEALTH_PORTAL_EXPANSION_STRATEGY.md)** | Health portal roadmap |- ✅ Has verification checklist

| **[ADVERTISING_MONETIZATION_STRATEGY.md](./ADVERTISING_MONETIZATION_STRATEGY.md)** | Monetization strategy |

| **[POSTGRESQL_MIGRATION_STRATEGY.md](./POSTGRESQL_MIGRATION_STRATEGY.md)** | Database migration |---

| **[IMPLEMENTATION_ROADMAP.csv](./IMPLEMENTATION_ROADMAP.csv)** | Implementation timeline |

| **[SECURITY_SCALABILITY_AUDIT.csv](./SECURITY_SCALABILITY_AUDIT.csv)** | Security audit |## 🚀 Installation Commands



---### One-Line Install:

```bash

## 🐛 Troubleshooting Guidescd ~/Downloads && chmod +x *.sh && ./complete-install.sh

```

| Document | Issue Area |

|----------|------------|### Step-by-Step:

| **[DEBUGGING_401.md](./DEBUGGING_401.md)** | Authentication errors |```bash

| **[FIX_SESSION_401.md](./FIX_SESSION_401.md)** | Session issues |# Step 1: Navigate

| **[CORS_FIX_DEPLOYED.md](./CORS_FIX_DEPLOYED.md)** | CORS problems |cd ~/Downloads

| **[FAVORITES_DEBUGGING_GUIDE.md](./FAVORITES_DEBUGGING_GUIDE.md)** | Favorites issues |

| **[ERROR_DOCUMENTATION_MASTER_INDEX.md](./ERROR_DOCUMENTATION_MASTER_INDEX.md)** | All error docs |# Step 2: Make executable

chmod +x complete-install.sh create-backend-files.sh create-frontend-files.sh update-server.sh

---

# Step 3: Run

## 📈 Shared Services./complete-install.sh



| Service | File | Purpose |# Step 4: Update App.js (see UPDATE_APP_JS_GUIDE.md)

|---------|------|---------|

| **AnalyticsService** | `shared/services/AnalyticsService.js` | User action tracking |# Step 5: Test

| **AuditLogger** | `shared/services/AuditLogger.js` | Comprehensive logging |cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp

| **FeatureFlags** | `shared/services/FeatureFlags.js` | Feature flag management |npm start  # Terminal 1

| **fetchWithAuth** | `shared/utils/api.js` | Authenticated API calls |

cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp/client

---npm start  # Terminal 2

```

## 🗓️ Version History

---

| Version | Date | Changes |

|---------|------|---------|## 🎯 Success Indicators

| 2.0 | Dec 2025 | Added modules (Nutrition, Coaching, Progress, Integrations), PostgreSQL migration |

| 1.0 | Nov 2025 | Initial release - Meal Planner core |### Installation Successful:

- ✅ Scripts run without errors

---- ✅ 4 backend files created

- ✅ 4 frontend files created

## 📞 Support- ✅ server.js updated

- ✅ Backups created

For issues:

1. Check [Troubleshooting Guides](#-troubleshooting-guides)### App Running Successfully:

2. Review [ERROR_DOCUMENTATION_MASTER_INDEX.md](./ERROR_DOCUMENTATION_MASTER_INDEX.md)- ✅ Backend: "Server running on port 5000"

3. Check GitHub Issues- ✅ Frontend: "Compiled successfully!"

- ✅ Browser: Opens to localhost:3000

---- ✅ Login works

- ✅ ZIP code page appears

**Happy meal planning! 🍽️**- ✅ Store selection works

- ✅ Meal plan generates

---

## 🐛 Troubleshooting Guide

### Issue: Scripts won't run
**Check:** File permissions
```bash
ls -l ~/Downloads/*.sh
chmod +x ~/Downloads/*.sh
```

### Issue: "Cannot find module"
**Check:** Backend files created
```bash
ls -la ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp/scrapers/
```

### Issue: Port conflicts
**Fix:** Kill existing processes
```bash
killall node
```

### Issue: Frontend can't connect
**Check:** .env has PORT=5000
```bash
cat ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp/.env | grep PORT
```

**Full troubleshooting in README_INSTALLATION.md**

---

## 📞 Where to Get Help

| Issue | See This File |
|-------|---------------|
| Can't download files | DOWNLOAD_ALL_FILES.md |
| Don't know where to start | QUICKSTART.md |
| Installation failing | README_INSTALLATION.md |
| App.js changes | UPDATE_APP_JS_GUIDE.md |
| Technical questions | PHASE_1_IMPLEMENTATION.md |
| Complete reference | COMPLETE_INSTALLATION_README.md |

---

## ✨ What You'll Get

### New Features:
- 🎯 ZIP code entry page
- 🏪 AI-powered store finder
- ✅ Store selection interface
- 💰 Price scraping system
- 🧠 Price-aware meal generation

### Technical Additions:
- 🔧 4 backend scraper files
- ⚛️ 4 frontend React components
- 🌐 2 new API endpoints
- 💾 Caching system (24-hour TTL)
- 📦 20 mock grocery items with prices

---

## 🎉 Ready to Install?

### Download All 10 Files:

**Scripts (4):**
1. complete-install.sh ⭐
2. create-backend-files.sh
3. create-frontend-files.sh
4. update-server.sh

**Guides (3):**
5. UPDATE_APP_JS_GUIDE.md ⭐
6. README_INSTALLATION.md
7. QUICKSTART.md

**Reference (3):**
8. DOWNLOAD_ALL_FILES.md
9. PHASE_1_IMPLEMENTATION.md
10. COMPLETE_INSTALLATION_README.md

### Then:
```bash
cd ~/Downloads
chmod +x *.sh
./complete-install.sh
```

---

## 🏥 Phase 6: Health Portal Foundation

### New Modules Added:

| Module | Location | Purpose |
|--------|----------|---------|
| **Nutrition Module** | `client/src/modules/nutrition/` | Nutrition tracking and analysis |
| **Coaching App** | `client/src/modules/coaching/` | Health coaching with goals, habits, programs |
| **App Switchboard** | `client/src/components/AppSwitchboard.js` | Multi-app navigation |
| **Shared Services** | `client/src/shared/services/` | Cross-module utilities |

### Shared Services:

| Service | File | Purpose |
|---------|------|---------|
| **AuditLogger** | `shared/services/AuditLogger.js` | Comprehensive audit logging |
| **FeatureFlags** | `shared/services/FeatureFlags.js` | Feature flag management with rollout |
| **IntegrationService** | `shared/services/integrations/IntegrationService.js` | Base class for integrations |
| **IntegrationRegistry** | `shared/services/integrations/IntegrationRegistry.js` | Registry pattern for integrations |
| **CalendarSyncIntegration** | `shared/services/integrations/CalendarSyncIntegration.js` | Google Calendar sync |
| **RolloutManager** | `shared/services/integrations/RolloutManager.js` | Staged rollout management |

### New Documentation:

| Document | Purpose |
|----------|---------|
| **[AUDIT_LOGGING.md](./AUDIT_LOGGING.md)** | Audit logging architecture |
| **[INTEGRATIONS.md](./INTEGRATIONS.md)** | Integrations architecture |
| **[COACHING_APP_DESIGN.md](./COACHING_APP_DESIGN.md)** | Coaching app design spec |
| **[NUTRITION_MODULE_DESIGN.md](./NUTRITION_MODULE_DESIGN.md)** | Nutrition module design spec |
| **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** | Overall project status |

### Test Files:

| Test | Location | Coverage |
|------|----------|----------|
| Coaching Sanity | `modules/coaching/__tests__/sanity.test.js` | Module isolation |
| Coaching Integration | `modules/coaching/__tests__/integration.test.js` | App integration |
| AuditLogger | `shared/services/__tests__/AuditLogger.test.js` | Logging service |
| Integrations | `shared/services/integrations/__tests__/integrations.test.js` | Integration architecture |

### Error Tracking:

- **[logs/error_log.md](./logs/error_log.md)** - Development error tracking

---

**That's everything you need! Download and install!** 🚀
