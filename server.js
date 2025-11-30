require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const OpenAI = require('openai'); // uncomment and wire /api/generate-meals when ready

const {
  PORT,
  NODE_ENV = 'development',
  SESSION_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  FRONTEND_BASE,
  OPENAI_API_KEY
} = process.env;

// basic env checks
console.log('GOOGLE_CLIENT_ID present:', !!GOOGLE_CLIENT_ID);
console.log(
  'GOOGLE_CLIENT_ID prefix:',
  GOOGLE_CLIENT_ID ? GOOGLE_CLIENT_ID.slice(0, 20) : null
);
console.log('GOOGLE_CALLBACK_URL:', GOOGLE_CALLBACK_URL);
console.log('FRONTEND_BASE:', FRONTEND_BASE);

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
  console.error('Google OAuth env values not set');
  process.exit(1);
}

if (!SESSION_SECRET) {
  console.error('SESSION_SECRET not set');
  process.exit(1);
}

const app = express();

// behind Render proxy
app.set('trust proxy', 1);

// CORS: allow frontend and cookies
app.use(
  cors({
    origin: true,
    credentials: true
  })
);

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

// Google OAuth
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

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
          return done(new Error('email not in Google profile'));
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

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'not_authenticated' });
  }
  next();
}

// health check
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
    failureRedirect:
      (FRONTEND_BASE || 'http://localhost:3000') + '/login?error=1',
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
    user: {
      id: req.user.id,
      email: req.user.email,
      full_name: req.user.full_name,
      role: req.user.role || null,
      picture: req.user.picture || null
    }
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

// simple profile endpoint
app.get('/api/profile', requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    full_name: req.user.full_name
  });
});

// placeholder for meal generation route
// replace with your real logic that calls OpenAI when you are ready
app.post('/api/generate-meals', requireAuth, async (req, res) => {
  return res
    .status(501)
    .json({ error: 'generate-meals route not wired on this server build' });
});

const port = PORT || 5000;
app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});