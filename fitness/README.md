# Fitness Module - Backend & Frontend

Fitness app module for meal_planner - Workout logging, progress tracking, goal management.

## Quick Start

### 1. Install Dependencies
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Deploy Database
```bash
npm run migrate
```

### 4. Seed Exercise Data
```bash
cd backend
npm run seed
```

### 5. Run Development
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Access: http://localhost:3000/fitness
```

## Structure

```
fitness/
├── backend/     # Express API (PORT 5000)
├── frontend/    # React UI (PORT 3000)
├── prisma/      # Database schema & migrations
├── scripts/     # Setup & seed scripts
└── docs/        # Documentation
```

## Documentation

- **API:** See `docs/API.md`
- **Architecture:** See `docs/ARCHITECTURE.md`
- **Development:** See `docs/DEVELOPMENT.md`
- **Troubleshooting:** See `docs/TROUBLESHOOTING.md`

## Database

Uses shared Neon PostgreSQL (same as meal_planner).

**Tables:** 7 fitness-specific tables in `fitness` schema
- `fitness_profiles` - User fitness data
- `fitness_exercises` - Exercise reference (seeded)
- `fitness_workouts` - Strength training sessions
- `fitness_workout_exercises` - Junction table
- `fitness_workout_sets` - Individual sets/reps
- `fitness_cardio_sessions` - Running/cycling/etc.
- `fitness_goals` - User goals tracking

## API Endpoints

**Base:** `http://localhost:5000/api/fitness`

- `POST/GET/PUT/DELETE /workouts` (5 endpoints)
- `GET /exercises` (2 endpoints)
- `POST/GET/PUT/DELETE /cardio` (5 endpoints)
- `GET /progress/*` (3 endpoints)

Total: **21 endpoints**

## Key Features

✅ Strength training workouts with exercises & sets
✅ Cardio session tracking (running, cycling, etc.)
✅ Progress analytics (exercise progression, weekly summary)
✅ Goal tracking with progress monitoring
✅ 24-hour edit/delete window enforcement
✅ Offline support with draft saving
✅ Real-time validation & error handling
✅ Responsive UI (mobile, tablet, desktop)

## Development

```bash
# Lint
npm run lint

# Test
npm test

# Build
npm run build

# Database Studio
npm run studio
```

## Deployment

- **Backend:** Render/Vercel (fitness/backend)
- **Frontend:** Vercel/Netlify (fitness/frontend)
- **Database:** Neon PostgreSQL

## Status

- ✅ Database schema & migrations ready
- ✅ Project structure created
- ⏳ API implementation (FIT-005 to FIT-021)
- ⏳ Frontend components (FIT-017 to FIT-065)
- ⏳ Testing & verification
- ⏳ Production deployment

## See Also

- `FITNESS_PROJECT_STRUCTURE.md` - Full directory layout
- `FITNESS_IMPLEMENTATION_BUILD_SEQUENCE.md` - 126 JIRA tickets in build order
- `FITNESS_DATA_MODEL.md` - Database schema
- `FITNESS_API_SPECIFICATION.md` - API contracts
- `FITNESS_COMPONENT_ARCHITECTURE.md` - Frontend design
