# FITNESS APP - PROJECT STRUCTURE

**Location:** `/meal_planner/fitness/`
**Database:** Shared Neon PostgreSQL (same as meal_planner)
**Status:** Ready for development

---

## DIRECTORY STRUCTURE

```
fitness/
├── README.md                          # Fitness module overview
├── .env.example                       # Environment variables template
├── package.json                       # Root workspace config (monorepo setup)
│
├── backend/                           # Node.js/Express API
│   ├── package.json                  # Backend dependencies
│   ├── .env.example                  # Backend env template
│   ├── src/
│   │   ├── server.js                # Express server entry point
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT authentication
│   │   │   ├── errorHandler.js      # Global error handling
│   │   │   ├── validateRequest.js   # Input validation
│   │   │   └── enforceEditWindow.js # 24-hour edit window
│   │   ├── routes/
│   │   │   ├── index.js             # Route registration
│   │   │   ├── workouts.js          # POST/GET/PUT/DELETE workouts
│   │   │   ├── exercises.js         # GET exercise definitions
│   │   │   ├── cardio.js            # POST/GET/PUT/DELETE cardio
│   │   │   └── analytics.js         # Progress/summary analytics
│   │   ├── controllers/
│   │   │   ├── workoutController.js
│   │   │   ├── exerciseController.js
│   │   │   ├── cardioController.js
│   │   │   └── analyticsController.js
│   │   ├── utils/
│   │   │   ├── ApiError.js          # Custom error class
│   │   │   ├── validators.js        # Input validation logic
│   │   │   └── dateHelpers.js       # Date/time utilities
│   │   └── services/
│   │       ├── workoutService.js    # Business logic
│   │       ├── cardioService.js
│   │       └── analyticsService.js
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── e2e/
│
├── frontend/                          # React UI
│   ├── package.json                  # Frontend dependencies
│   ├── .env.example                  # Frontend env template
│   ├── src/
│   │   ├── main.jsx                 # Vite entry point
│   │   ├── App.jsx                  # Root component
│   │   ├── pages/
│   │   │   ├── fitness/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── WorkoutLog.jsx
│   │   │   │   ├── WorkoutHistory.jsx
│   │   │   │   ├── WeeklySummary.jsx
│   │   │   │   ├── ProgressTracking.jsx
│   │   │   │   └── CardioLog.jsx
│   │   ├── components/
│   │   │   ├── common/               # Reusable UI components
│   │   │   ├── fitness/
│   │   │   │   ├── forms/           # Form components
│   │   │   │   ├── modals/          # Modal components
│   │   │   │   └── common/          # Fitness-specific reusable
│   │   ├── context/
│   │   │   ├── FitnessContext.js
│   │   │   └── fitnessReducer.js
│   │   ├── hooks/
│   │   │   ├── useWorkouts.js
│   │   │   ├── useCardio.js
│   │   │   ├── useProgress.js
│   │   │   ├── useExercises.js
│   │   │   └── useFitnessState.js
│   │   ├── services/
│   │   │   ├── api.js               # API client
│   │   │   ├── localStorageService.js
│   │   │   └── pendingActionQueue.js
│   │   ├── utils/
│   │   │   ├── errors/
│   │   │   ├── validation.js
│   │   │   └── formatters.js
│   │   ├── styles/
│   │   │   └── index.scss           # Global styles
│   │   └── __tests__/
│   │       ├── unit/
│   │       ├── integration/
│   │       └── e2e/
│   └── public/
│       └── (static assets)
│
├── prisma/                            # Database schema & migrations
│   ├── schema.prisma                 # Fitness tables only
│   ├── migrations/
│   │   └── 001_fitness_module_init/
│   │       └── migration.sql
│   ├── seed.ts                       # Seed exercise definitions
│   └── generated/
│       └── client/                   # Generated Prisma client
│
├── scripts/
│   ├── seed-exercises.js             # Load exercise reference data
│   ├── migrate-neon.sh               # Deploy migration to Neon
│   └── setup-env.sh                  # Setup environment variables
│
├── docs/                              # Documentation
│   ├── README.md                     # Quick start guide
│   ├── API.md                        # API documentation
│   ├── DEVELOPMENT.md                # Dev setup instructions
│   ├── ARCHITECTURE.md               # Architecture decisions
│   └── TROUBLESHOOTING.md            # Common issues
│
└── docker-compose.yml                # Local dev environment (optional)
```

---

## KEY CONFIGURATION FILES

### Root .env.example
```
# Database
DATABASE_URL=postgresql://user:password@db.neon.tech/fitness?schema=fitness

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h

# API
BACKEND_PORT=5000
FRONTEND_PORT=3000
API_BASE_URL=http://localhost:5000/api

# Environment
NODE_ENV=development
```

### Backend .env.example
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h
PORT=5000
NODE_ENV=development
LOG_LEVEL=debug
```

### Frontend .env.example
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ENVIRONMENT=development
```

---

## DATABASE SCHEMA SEPARATION

### Option 1: Single Neon Database (Recommended)
- **Database:** Single Neon PostgreSQL instance
- **Schemas:** 
  - `meal_planner` schema (meal_planner app tables)
  - `fitness` schema (fitness app tables) - separate namespace
- **Shared:** Same `users` table (auth/user context)
- **Benefit:** Single database connection, unified backup, easier user linking
- **Implementation:**
  ```sql
  CREATE SCHEMA fitness;
  -- All fitness tables in fitness schema
  -- Reference meal_planner.users
  ```

### Option 2: Separate Neon Projects (Alternative)
- **Database 1:** meal_planner (existing)
- **Database 2:** fitness (new standalone)
- **Shared User Context:** API passes user_id in JWT
- **Benefit:** Complete isolation, independent scaling
- **Drawback:** Two database connections, more complex migrations

**CURRENT RECOMMENDATION:** Option 1 (Single Database, Separate Schema)
- Uses same Neon connection
- Both apps share users table
- Tables isolated by schema
- Easier deployment and management

---

## DEVELOPMENT SETUP

### Prerequisites
```bash
# Node.js 18+
node --version

# npm 9+
npm --version

# PostgreSQL CLI (for testing)
psql --version
```

### 1. Install Dependencies
```bash
# Root
npm install

# Backend
cd fitness/backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Setup Environment
```bash
# Copy templates
cp .env.example .env
cp fitness/backend/.env.example fitness/backend/.env
cp fitness/frontend/.env.example fitness/frontend/.env

# Update DATABASE_URL in .env files
```

### 3. Deploy Database Schema
```bash
cd fitness

# Option A: Via Prisma (recommended)
npm run migrate

# Option B: Direct SQL
psql $DATABASE_URL < prisma/migrations/001_fitness_module_init/migration.sql
```

### 4. Seed Exercise Definitions
```bash
cd fitness/backend
npm run seed
```

### 5. Start Development
```bash
# Terminal 1: Backend (localhost:5000)
cd fitness/backend && npm run dev

# Terminal 2: Frontend (localhost:3000)
cd fitness/frontend && npm run dev

# Access: http://localhost:3000/fitness
```

---

## PRISMA SETUP

### Generate Prisma Client
```bash
cd fitness
npx prisma generate
```

### View Database with Prisma Studio
```bash
cd fitness
npm run studio
# Opens http://localhost:5555
```

### Create New Migration
```bash
cd fitness
npx prisma migrate dev --name add_field_name
```

### Reset Database (Development Only)
```bash
cd fitness
npm run migrate:reset
```

---

## FILE ORGANIZATION RATIONALE

### Backend Structure
- **routes/**: HTTP endpoint definitions (21 endpoints)
- **controllers/**: Request handling, validation
- **services/**: Business logic, database queries
- **utils/**: Helper functions, error classes
- **middleware/**: Cross-cutting concerns (auth, validation, error handling)
- **tests/**: Unit, integration, E2E tests

### Frontend Structure
- **pages/**: Full page components (6 screens)
- **components/**: Reusable UI components (45 total)
- **context/**: Global state (FitnessContext)
- **hooks/**: Custom data-fetching hooks (5 hooks)
- **services/**: API client, localStorage, pending queue
- **utils/**: Validation, formatters, error handling
- **styles/**: SCSS/CSS files

---

## MONOREPO SETUP (Optional)

### Root package.json Workspaces
```json
{
  "workspaces": [
    "fitness/backend",
    "fitness/frontend",
    "fitness"
  ]
}
```

### Benefits
- Single node_modules (shared dependencies)
- Unified npm scripts
- Shared dev tools (eslint, prettier)

### Usage
```bash
npm install                    # Install all workspaces
npm run dev --workspace=backend # Run backend only
npm run build --workspaces     # Build all
```

---

## DEPLOYMENT

### Database Migration
```bash
# Deploy to Neon
npx prisma migrate deploy

# Verify
npx prisma studio
```

### Backend Deployment (Render/Vercel)
```bash
cd fitness/backend
npm run build
npm start
```

### Frontend Deployment (Vercel/Netlify)
```bash
cd fitness/frontend
npm run build
# Deploy dist/ folder
```

---

## API ENDPOINTS

**Base URL:** `http://localhost:5000/api/fitness`

### Workouts
- `POST /workouts` - Create workout
- `GET /workouts` - List workouts (paginated)
- `GET /workouts/:id` - Get workout details
- `PUT /workouts/:id` - Update workout (24h window)
- `DELETE /workouts/:id` - Delete workout (24h window)

### Exercises
- `GET /exercises` - List exercise definitions
- `GET /exercises/:id` - Get exercise details

### Cardio
- `POST /cardio` - Create cardio session
- `GET /cardio` - List cardio sessions
- `GET /cardio/:id` - Get cardio details
- `PUT /cardio/:id` - Update cardio (24h window)
- `DELETE /cardio/:id` - Delete cardio (24h window)

### Analytics
- `GET /progress/exercise-progress` - Exercise stats
- `GET /progress/cardio-progress` - Cardio stats
- `GET /progress/weekly-summary` - Weekly stats

**Full API Docs:** See `docs/API.md`

---

## TESTING STRATEGY

### Unit Tests (80% coverage)
```bash
npm test -- fitness/backend
npm test -- fitness/frontend
```

### Integration Tests
```bash
npm test -- integration
```

### E2E Tests (Cypress/Playwright)
```bash
npm run test:e2e
```

---

## TROUBLESHOOTING

### Migration Failed
```bash
# Check Neon connection
psql $DATABASE_URL -c "SELECT version();"

# View pending migrations
cd fitness && npx prisma migrate status

# Manually rollback if needed
psql $DATABASE_URL -c "DROP SCHEMA fitness CASCADE;"
```

### Prisma Client Out of Date
```bash
cd fitness
npx prisma generate
```

### Port Already in Use
```bash
# Backend (5000)
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Frontend (3000)
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

---

## NEXT STEPS

1. ✅ Directory structure created
2. ✅ Prisma schema defined
3. ✅ package.json files ready
4. **→ Deploy database migration to Neon**
5. **→ Implement backend (21 endpoints - FIT-005 to FIT-021)**
6. **→ Implement frontend (45 components - FIT-017 to FIT-065)**
7. **→ Testing and verification**
8. **→ Production deployment**

---

## USEFUL COMMANDS

```bash
# Build sequence
npm install                          # Install all dependencies
cd fitness && npm run migrate        # Deploy database
cd fitness/backend && npm run seed   # Seed exercises
cd fitness/backend && npm run dev    # Start backend
cd fitness/frontend && npm run dev   # Start frontend

# Quality assurance
npm run lint                         # Lint all
npm run test                         # Test all
npm run test:coverage                # Coverage report

# Database
npm run studio                       # Prisma Studio (view DB)
npm run migrate:dev                  # Create new migration
npm run migrate:reset                # Reset DB (dev only)
```

---

## CONTACT & SUPPORT

**Specification Documents:**
- `FITNESS_DATA_MODEL.md` - Schema reference
- `FITNESS_API_SPECIFICATION.md` - API contracts
- `FITNESS_COMPONENT_ARCHITECTURE.md` - Frontend design
- `FITNESS_IMPLEMENTATION_BUILD_SEQUENCE.md` - Build order (126 JIRA tickets)

**More Info:** See `docs/README.md`
