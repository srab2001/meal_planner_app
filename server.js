require('dotenv').config();

const {
  PORT,
  NODE_ENV,
  SESSION_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  FRONTEND_BASE,
  OPENAI_API_KEY
} = process.env;

// TEMP DEBUG LOGS
console.log('GOOGLE_CLIENT_ID present:', !!GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET present:', !!GOOGLE_CLIENT_SECRET);
console.log('GOOGLE_CALLBACK_URL:', GOOGLE_CALLBACK_URL);

// basic env checks
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
  console.error('Google OAuth env values not set');
  process.exit(1);
}

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

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

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

app.post('/auth/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });
});

app.get('/api/profile', requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    full_name: req.user.full_name
  });
});

// TODO: add meal routes here

const port = PORT || 5000;
app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});
