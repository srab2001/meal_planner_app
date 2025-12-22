# Fitness Module - Quick Reference Card

**Last Updated:** December 21, 2025  
**Print this page for quick reference while developing**

---

## 🔥 Most Important Files

```
fitness/backend/routes/fitness.js       ← All API endpoints
fitness/frontend/components/            ← React components
fitness/frontend/styles/                ← Design system & CSS
fitness/prisma/schema.prisma            ← Database tables
fitness/docs/                           ← All documentation
```

---

## ⚡ Quick Commands

```bash
# Start Backend
cd /path/to/meal_planner
npm start

# Start Frontend
cd fitness/frontend
npm install
npm start

# Build Frontend
npm run build

# Test Backend Endpoint
curl -X GET http://localhost:3001/api/fitness/workouts \
  -H "Authorization: Bearer TOKEN"
```

---

## 🎨 Design System Colors

```javascript
Primary Blue:       #0066CC
Light Gray:         #F5F5F5
Dark Text:          #333333
Border Gray:        #CCCCCC
Error Red:          #CC0000
Success Green:      #00CC00
```

---

## 📐 Component Sizes

```javascript
Header Height:      60px
Footer Height:      60px
Input Height:       44px
Button Height:      44px
Touch Target Min:   44x44px
Border Radius:      12px
```

---

## 📏 Spacing Scale

```javascript
xs:  4px    md: 12px    xl: 20px
sm:  8px    lg: 16px    xxl: 24px
```

---

## 📱 Responsive Breakpoints

```javascript
Mobile:  375px (default)
Tablet:  768px (@media min-width: 768px)
Desktop: 1024px (@media min-width: 1024px)
```

---

## 🔌 API Endpoints (6 Main)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/fitness/workouts` | Create workout |
| GET | `/api/fitness/workouts` | List workouts |
| GET | `/api/fitness/workouts/:id` | Get one |
| PUT | `/api/fitness/workouts/:id` | Update |
| DELETE | `/api/fitness/workouts/:id` | Delete |
| GET | `/api/fitness/profile` | User profile |

---

## 📦 Component Props Quick Reference

### LogWorkout
```javascript
<LogWorkout
  onSave={(formData) => handleSave(formData)}
  onCancel={() => goBack()}
/>
```

### ExerciseCard
```javascript
<ExerciseCard
  exercise={exerciseObj}
  index={0}
  exerciseNumber={1}
  onUpdate={(idx, ex) => update(idx, ex)}
  onDelete={(idx) => delete(idx)}
/>
```

### ExerciseModal
```javascript
<ExerciseModal
  onAdd={(exercise) => addExercise(exercise)}
  onClose={() => setShowModal(false)}
/>
```

---

## 🗂️ File Organization

```
fitness/
├── backend/routes/fitness.js       ← Routes
├── prisma/schema.prisma            ← DB Schema
├── frontend/components/
│   ├── LogWorkout.jsx
│   ├── ExerciseCard.jsx
│   └── modals/ExerciseModal.jsx
├── frontend/styles/
│   ├── wireframe.config.js
│   └── global.css.js
└── docs/
    ├── DOCUMENTATION_INDEX.md
    ├── UI_COMPONENT_LIBRARY.md
    ├── API_INTEGRATION_GUIDE.md
    └── DEPLOYMENT_GUIDE.md
```

---

## 🔑 Authentication

```javascript
// All requests need:
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'Content-Type': 'application/json'
}

// Get token from:
localStorage.getItem('token')
```

---

## 📊 Workout Data Structure

```javascript
{
  workoutDate: "2025-12-21",      // YYYY-MM-DD
  workoutName: "Leg Day",
  exercises: [
    {
      exerciseName: "Barbell Squat",
      category: "Legs",
      sets: [
        {
          reps: 8,
          weight: 225,
          unit: "lbs",
          duration: null
        }
      ]
    }
  ],
  notes: "Great session"
}
```

---

## ✅ Pre-Flight Checklist

Before making changes:
- [ ] Environment variables set (.env)
- [ ] Backend running (`npm start`)
- [ ] Database connected
- [ ] No TypeScript errors
- [ ] Read relevant documentation

---

## 🚨 Common Errors & Fixes

### "Cannot find module"
```bash
rm -rf node_modules
npm install
```

### "401 Unauthorized"
```javascript
// Check token exists:
console.log(localStorage.getItem('token'))
// Should not be null
```

### "CORS error"
```bash
# Check CORS_ORIGIN in .env matches:
# Frontend URL (http://localhost:5173)
# Production URL (https://your-domain.vercel.app)
```

### "Database connection failed"
```bash
# Verify connection string:
echo $FITNESS_DATABASE_URL
# Should output valid PostgreSQL URL
```

---

## 📚 Documentation Quick Links

| Document | Purpose |
|----------|---------|
| DOCUMENTATION_INDEX.md | Start here |
| UI_COMPONENT_LIBRARY.md | Component API |
| API_INTEGRATION_GUIDE.md | Backend docs |
| DEPLOYMENT_GUIDE.md | Deployment steps |

---

## 🎯 Component Usage Template

```javascript
import PropTypes from 'prop-types';
import styles from './Component.module.css';

function Component({ prop1, onAction }) {
  return (
    <div className={styles.container}>
      {/* Content */}
    </div>
  );
}

Component.propTypes = {
  prop1: PropTypes.string.isRequired,
  onAction: PropTypes.func.isRequired
};

export default Component;
```

---

## 🎨 CSS Module Template

```css
.container {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-lg);
  background-color: var(--color-surface);
}

@media (max-width: 768px) {
  .container {
    padding: var(--spacing-md);
  }
}
```

---

## 🧪 Test Component Locally

```bash
# 1. Start backend
npm start

# 2. In another terminal, start frontend
cd fitness/frontend && npm start

# 3. Open http://localhost:5173

# 4. Check DevTools → Network for API calls

# 5. Check DevTools → Console for errors
```

---

## 🚀 Deploy Quickly

```bash
# Backend (auto-deploys via Render)
git add .
git commit -m "fitness: updates"
git push origin main

# Frontend (manual deploy)
cd fitness/frontend
npm run build
vercel --prod
```

---

## 📝 CSS Variables (Available in All Styles)

```css
--color-primary: #0066CC
--color-surface: #F5F5F5
--color-text: #333333
--color-border: #CCCCCC
--color-error: #CC0000

--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 12px
--spacing-lg: 16px
--spacing-xl: 20px

--size-touch-target: 44px
--size-header: 60px
--size-footer: 60px

--radius-default: 12px

--transition-normal: 300ms ease
```

---

## 🔧 Quick Dev Tools

```javascript
// Check if token exists
localStorage.getItem('token')

// Clear storage
localStorage.clear()

// Check environment
process.env.REACT_APP_API_BASE_URL

// Log current state
console.log({formData, errors})
```

---

## 📋 Pre-Commit Checklist

- [ ] No console.log() left in code
- [ ] No console.error() for debugging
- [ ] CSS modules properly scoped
- [ ] Props have PropTypes defined
- [ ] Component has JSDoc comment
- [ ] Responsive design tested
- [ ] Error handling working
- [ ] All imports correct

---

## 🚀 Deployment Checklist

### Backend
- [ ] All endpoints tested
- [ ] Error handling working
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Code pushed to GitHub
- [ ] Render auto-deployment triggered

### Frontend
- [ ] Build completes without errors
- [ ] API URL configured
- [ ] Components render correctly
- [ ] Responsive design working
- [ ] Accessibility checked
- [ ] Vercel deployment successful

---

## 🆘 Need Help?

1. **Check Documentation:** `fitness/docs/DOCUMENTATION_INDEX.md`
2. **Review Component File:** Check .jsx for usage examples
3. **Check Git History:** `git log --oneline fitness/`
4. **Search Codebase:** Look for similar patterns
5. **Ask in Code Comments:** Add context for future devs

---

## 📞 Key Contacts

### Documentation
- **Main Index:** `fitness/docs/DOCUMENTATION_INDEX.md`
- **Components:** `fitness/docs/UI_COMPONENT_LIBRARY.md`
- **API:** `fitness/docs/API_INTEGRATION_GUIDE.md`
- **Deploy:** `fitness/docs/DEPLOYMENT_GUIDE.md`

### Source Code
- **Backend:** `fitness/backend/routes/fitness.js`
- **Frontend:** `fitness/frontend/components/`
- **Database:** `fitness/prisma/schema.prisma`
- **Config:** `fitness/frontend/styles/wireframe.config.js`

---

## ⚡ Performance Tips

```javascript
// Use CSS Modules for scoped styles
import styles from './Component.module.css';

// Memoize expensive components
const Component = React.memo(YourComponent);

// Lazy load modals
const Modal = React.lazy(() => import('./Modal'));

// Optimize images
// Use WEBP format where possible
// Compress SVGs
```

---

## 🎯 Must Know

1. **All endpoints require JWT token** in Authorization header
2. **Mobile first** - design for mobile then scale up
3. **Responsive breakpoints:** 375px, 768px, 1024px
4. **44px minimum** for all clickable elements
5. **CSS Modules** for scoped styling
6. **PropTypes** for all component props
7. **Async/await** for API calls
8. **Error handling** on all user actions

---

## 📱 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ⚠️ IE11 (not supported)

---

## 🔐 Security Reminders

- ✅ Never commit .env file
- ✅ Always use Bearer token for API
- ✅ Validate input on frontend and backend
- ✅ Sanitize user input
- ✅ Use HTTPS in production
- ✅ Don't expose secrets in logs

---

**Bookmark this page for quick reference!**

Keep a printed copy at your desk while developing.

---

**Last Updated:** December 21, 2025  
**Version:** 1.0  
**Status:** ✅ Complete
