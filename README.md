# Meal Planner App

> **AI-powered meal planning with integrated health modules**

🌐 **Production**: https://meal-planner-app-chi.vercel.app  
🔧 **Backend**: https://meal-planner-app-mve2.onrender.com

---

## 📦 Latest Deployment (Dec 23, 2025)

✅ **Status:** Features deployed and fixes applied
- ✨ Load/edit previous meal plans before store selection
- 🔧 Shopping list consolidation fixed (handles fractions & units)
- 🎨 Improved UI/UX with better button visibility

**Documentation:** See `PRODUCTION_DEPLOYMENT.md` for details

---

## 🎯 Overview

A comprehensive meal planning platform featuring:
- **AI Meal Planning** - Generate weekly plans with ChatGPT
- **Nutrition Tracking** - Read-only nutrition analysis
- **Health Coaching** - AI-powered wellness guidance
- **Progress & Gamification** - Streaks, badges, referrals
- **Health Integrations** - Connect fitness trackers

---

## 🖥️ Application Modules

| Module | Description | Status |
|--------|-------------|--------|
| 🍽️ **Meal Planner** | AI meal plans, recipes, shopping lists, favorites | ✅ Core |
| 🥗 **Nutrition** | Weekly/daily nutrition summary from meal plans | ✅ Active |
| 💪 **Coaching** | AI health coaching, goals, habits, programs | ✅ Active |
| 📈 **Progress** | Streaks, achievements, referral system | ✅ Active |
| 🔗 **Integrations** | Apple Health, Google Fit, Fitbit | 🚧 Feature-flagged |

---

## 🚀 Quick Start

### Local Development

1. **Backend Setup**:
   ```bash
   npm install
   cp .env.example .env
   # Edit .env with your credentials
   node server.js
   ```

2. **Frontend Setup**:
   ```bash
   cd client
   npm install
   cp .env.example .env
   # Edit .env if needed (defaults to localhost:5000)
   npm start
   ```

3. Visit `http://localhost:3000`

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                        │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ ┌───────┐│
│  │ Meal    │ │ Nutrition│ │ Coaching │ │Progress│ │Integr.││
│  │ Planner │ │  (R/O)   │ │          │ │        │ │       ││
│  └────┬────┘ └────┬─────┘ └────┬─────┘ └───┬────┘ └───┬───┘│
│       │           │            │           │          │     │
│       └───────────┴────────────┴───────────┴──────────┘     │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │ HTTPS/REST
┌────────────────────────────┼─────────────────────────────────┐
│                    Backend (Render)                          │
│  ┌─────────────────────────┴───────────────────────────┐    │
│  │              Express.js + Passport.js               │    │
│  └─────────────────────────┬───────────────────────────┘    │
│                            │                                 │
│  ┌───────────┬─────────────┼────────────┬──────────────┐    │
│  │  OpenAI   │  Google     │  PostgreSQL│   Session    │    │
│  │   API     │   OAuth     │  Database  │   Store      │    │
│  └───────────┴─────────────┴────────────┴──────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, CSS Modules |
| Backend | Express.js, Passport.js |
| Database | PostgreSQL |
| AI | OpenAI GPT-4 |
| Auth | Google OAuth 2.0 + JWT |
| Hosting | Vercel (frontend), Render (backend) |

---

## 📚 Documentation

### Getting Started
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide
- **[README_INSTALLATION.md](./README_INSTALLATION.md)** - Installation details
- **[PRODUCTION_CONFIG.md.example](./PRODUCTION_CONFIG.md.example)** - Production environment template

### Data & Architecture
- **[DATA_MODEL.md](./DATA_MODEL.md)** - 📊 Complete database schema with Mermaid diagrams
- **[MASTER_INDEX.md](./MASTER_INDEX.md)** - Complete documentation index

### Deployment
- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** - Frontend deployment guide
- **[DEPLOY_TO_RENDER.md](./DEPLOY_TO_RENDER.md)** - Backend deployment guide

### Implementation
- **[PHASE_1_IMPLEMENTATION.md](./PHASE_1_IMPLEMENTATION.md)** - Implementation details
- **[REQUIREMENTS_AND_FEATURES.md](./REQUIREMENTS_AND_FEATURES.md)** - Feature specifications

---

## ⚙️ Environment Variables

### Backend (.env in root)
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-backend.com/auth/google/callback

# Frontend URL (for CORS)
FRONTEND_BASE=https://your-app.vercel.app

# Security
SESSION_SECRET=your-secure-session-secret
JWT_SECRET=your-jwt-secret

# AI
OPENAI_API_KEY=your-openai-api-key

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

### Frontend (client/.env or Vercel env vars)
```bash
REACT_APP_API_URL=https://your-backend.com
```

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts (Google OAuth) |
| `meal_plan_history` | Generated meal plans |
| `favorites` | Saved favorite meals |
| `shopping_list_states` | Shopping list checkboxes |
| `user_preferences` | User settings |
| `subscriptions` | Payment plans (Stripe) |
| `usage_stats` | Analytics tracking |
| `session` | Express sessions |
| `cuisine_options` | Available cuisines |
| `dietary_options` | Dietary restrictions |
| `app_settings` | Global configuration |

See **[DATA_MODEL.md](./DATA_MODEL.md)** for complete schema and relationships.

---

## 🔧 Troubleshooting

### Google Auth not working on Vercel?

1. Check `REACT_APP_API_URL` is set in Vercel environment variables
2. Verify `GOOGLE_CALLBACK_URL` points to your backend (not Vercel)
3. Confirm Google Cloud Console has correct redirect URI
4. See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed troubleshooting

### CORS errors?

Ensure backend `FRONTEND_BASE` matches your Vercel URL exactly.

### Nutrition module shows "No data"?

The Nutrition module reads from `meal_plan_history`. Generate a meal plan first.

### Login skipping to store selection?

After login, users should land on the App Switchboard. Check `handleLogin` in `App.js`.

---

## 📄 License

Private - All rights reserved
