// server.js

require('dotenv').config();

const {
  NODE_ENV = PRODUCTION
  SESSION_SECRET=d801eb87c325d2e6147056e716d3c4cc46a1740be2c4a9e13d1a52b048b2eabf
  GOOGLE_CLIENT_ID=72766863605-p5uqeeh3jlemcml92k1k72duh9bpgtl6.apps.googleusercontent.com 
  GOOGLE_CLIENT_SECRET=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
  GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
  FRONTEND_BASE=
  OPENAI_API_KEY
} = process.env;

// basic env checks
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
  console.error('Google OAuth env values missing');
  process.exit(1);
}

if (!SESSION_SECRET) {
  console.error('SESSION_SECRET missing');
  process.exit(1);
}

// debug logs (safe, only show prefix)
console.log('GOOGLE_CLIENT_ID set?', !!GOOGLE_CLIENT_ID);
console.log(
  'GOOGLE_CLIENT_ID prefix:',
  GOOGLE_CLIENT_ID ? GOOGLE_CLIENT_ID.slice(0, 15) : null
);
console.log('GOOGLE_CALLBACK_URL:', GOOGLE_CALLBACK_URL);
console.log('FRONTEND_BASE:', FRONTEND_BASE);

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

// CORS
const allowedOrigins = [
  'http://localhost:3000',
  FRONTEND_BASE
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);

// core middleware
app.use(express.json());

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: NODE_ENV === 'production',
      httpOnly: true,
      sameSite: NODE_ENV === 'production' ? 'none' : 'lax'
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

// passport session storage (no DB)
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Google OAuth strategy (no DB)
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email =
          profile.emails && profile.emails[0] && profile.emails[0].value;

        if (!email) {
          return done(new Error('email missing from Google profile'));
        }

        const user = {
          id: profile.id,
          email,
          full_name: profile.displayName,
          picture:
            profile.photos && profile.photos[0] && profile.photos[0].value,
          role: null
        };

        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);

// auth guard
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'not_authenticated' });
  }
  next();
}

// routes

// health
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Google login
app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google callback
app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: (FRONTEND_BASE || 'http://localhost:3000') + '/login?error=1',
    session: true
  }),
  (req, res) => {
    const frontend = FRONTEND_BASE || 'http://localhost:3000';
    res.redirect(frontend);
  }
);

// current user
app.get('/auth/user', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ user: null });
  }

  res.json({
    id: req.user.id,
    email: req.user.email,
    full_name: req.user.full_name,
    role: req.user.role || null,
    picture: req.user.picture || null
  });
});

// logout
app.post('/auth/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });
});

// placeholder protected route
app.get('/api/profile', requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    full_name: req.user.full_name
  });
});

// your meal planner routes go here
// app.post('/api/find-stores', requireAuth, async (req, res) => { ... });
// app.post('/api/generate-meals', requireAuth, async (req, res) => { ... });

const port = PORT || 5000;
app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});