# Meal Planner App

AI-powered meal planning application with Google OAuth authentication.

## Quick Start

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

## Deployment

### Production Configuration (Quick Start)

**📋 For your production setup:**
1. Copy the template: `cp PRODUCTION_CONFIG.md.example PRODUCTION_CONFIG.md`
2. Edit `PRODUCTION_CONFIG.md` with your actual credentials
3. Follow the configuration guide in that file

The actual `PRODUCTION_CONFIG.md` is git-ignored for security.

### Deploying to Vercel (Frontend) + Backend Service

See **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** for complete deployment guide.

**Quick checklist**:
- Backend: Deploy `server.js` to Render/Railway/etc
- Frontend: Deploy `/client` folder to Vercel
- Configure environment variables (see `.env.example` files)
- Update Google OAuth redirect URIs in Google Cloud Console

## Documentation

- **[PRODUCTION_CONFIG.md.example](./PRODUCTION_CONFIG.md.example)** - 🔧 **START HERE** - Production environment setup template
- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** - Complete Vercel deployment guide with Google OAuth
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide
- **[README_INSTALLATION.md](./README_INSTALLATION.md)** - Installation details
- **[PHASE_1_IMPLEMENTATION.md](./PHASE_1_IMPLEMENTATION.md)** - Implementation details

## Architecture

- **Frontend**: React app (port 3000 in dev)
- **Backend**: Express.js with Passport.js for Google OAuth (port 5000 in dev)
- **Authentication**: Google OAuth 2.0
- **AI**: OpenAI integration for meal planning

## Environment Variables

### Backend (.env in root)
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://your-backend.com/auth/google/callback
FRONTEND_BASE=https://your-app.vercel.app
SESSION_SECRET=...
OPENAI_API_KEY=...
```

### Frontend (client/.env or Vercel env vars)
```
REACT_APP_API_URL=https://your-backend.com
```

## Troubleshooting

### Google Auth not working on Vercel?

1. Check `REACT_APP_API_URL` is set in Vercel environment variables
2. Verify `GOOGLE_CALLBACK_URL` points to your backend (not Vercel)
3. Confirm Google Cloud Console has correct redirect URI
4. See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed troubleshooting

### CORS errors?

Ensure backend `FRONTEND_BASE` matches your Vercel URL exactly.
