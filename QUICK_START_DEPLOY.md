# Quick Start: Complete AI Coach Deployment

## ✅ What's Done
- Frontend component built and styled (381 KB)
- Backend endpoint added (/auth/test-token)
- All code committed to main branch on GitHub
- Vercel frontend triggered for auto-deploy
- Render backend needs manual trigger

## 🚀 What You Need to Do NOW

### Step 1: Deploy Backend (Render)
```
1. Go to: https://dashboard.render.com
2. Click: "meal-planner-app" service
3. Click: "Manual Deploy" button
4. Select: "main" branch
5. Click: "Deploy"
6. Wait: 10-15 minutes for build
```

### Step 2: Verify Both Deployments
```bash
# Frontend loaded?
curl -s https://client-hqpdn7to6-stus-projects-458dd35a.vercel.app | grep -o "Interview"

# Backend ready?
curl -X POST https://meal-planner-app-mve2.onrender.com/auth/test-token \
  -H "Content-Type: application/json" -d '{}' | grep -o "token"
```

### Step 3: Run Tests
```bash
cd meal_planner_app
node scripts/smoke-test.js \
  --url https://client-hqpdn7to6-stus-projects-458dd35a.vercel.app \
  --backend https://meal-planner-app-mve2.onrender.com
```

## Expected Results
- ✅ Smoke tests pass
- ✅ User can answer 8 questions
- ✅ AI generates custom workout plan
- ✅ No errors in console

## Troubleshooting

**Render still showing 404?**
- Wait 15 minutes for deployment
- Check Render logs for errors
- May need to seed database: `npm run seed:fitness`

**Frontend showing blank?**
- Wait for Vercel deployment (5-10 min)
- Clear browser cache
- Check console for errors

**Tests failing?**
- Verify both deployments complete first
- Check that backend has new `/auth/test-token` endpoint
- Review RENDER_MANUAL_DEPLOY.md for help

## Quick Links
- Vercel Frontend: https://client-hqpdn7to6-stus-projects-458dd35a.vercel.app
- Render Backend: https://meal-planner-app-mve2.onrender.com
- Render Dashboard: https://dashboard.render.com
- GitHub Repo: [Your repo URL]
- Full Docs: AI_COACH_INTERVIEW_COMPLETE_FINAL.md

## Timeline
- **18:02** - Initial deploy triggered
- **18:30** - Status check (Render not deployed)
- **18:35** - Manual deploy guide created
- **NOW** - You trigger Render deployment
- **ETA** - Everything live in 15-20 minutes

---

**Status**: 95% Complete - Just need Render manual deploy trigger

Good luck! 🎉
