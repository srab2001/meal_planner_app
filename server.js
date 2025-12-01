require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const OpenAI = require('openai');

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

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

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
    // Log successful authentication
    console.log('OAuth callback successful for user:', req.user?.email);

    // Save session before redirecting to avoid race condition
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.redirect((FRONTEND_BASE || 'http://localhost:3000') + '/login?error=1');
      }
      console.log('Session saved, redirecting to frontend');
      const frontend = FRONTEND_BASE || 'http://localhost:3000';
      res.redirect(frontend);
    });
  }
);

// current user
app.get('/auth/user', (req, res) => {
  console.log('GET /auth/user - Session ID:', req.sessionID, 'User:', req.user?.email || 'none');

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

// Store finder endpoint
app.post('/api/find-stores', requireAuth, async (req, res) => {
  try {
    const { zipCode, storeName } = req.body;

    if (!zipCode || !/^\d{5}(-\d{4})?$/.test(zipCode)) {
      return res.status(400).json({ error: 'Invalid ZIP code' });
    }

    // Build prompt based on whether a specific store was requested
    let prompt;
    if (storeName && storeName.trim()) {
      prompt = `Given the ZIP code ${zipCode}, list grocery stores in this area with a focus on "${storeName}".

IMPORTANT: If "${storeName}" exists in this area, it MUST be the FIRST store in the list.

For each store, provide:
- name: The official store name
- type: Category like "Organic", "Discount", "Conventional", "Specialty"
- typical_distance: Range like "1-3 miles", "2-5 miles", etc.

List 6-8 stores total:
1. "${storeName}" (if it exists in this area) - MUST BE FIRST
2. Other nearby stores similar to "${storeName}"
3. Other major chains in the area

Include a mix of:
- The requested store if available
- National chains (Walmart, Kroger, Target)
- Regional chains appropriate for this area
- Specialty stores (Whole Foods, Trader Joe's)

Return ONLY valid JSON in this exact format:
{
  "stores": [
    {
      "name": "Store Name",
      "address": "Typical location within 5 miles",
      "distance": "2-4 miles",
      "type": "Conventional"
    }
  ]
}`;
    } else {
      prompt = `Given the ZIP code ${zipCode}, list major grocery stores commonly found in this area of the United States.

For each store, provide:
- name: The official store name
- type: Category like "Organic", "Discount", "Conventional", "Specialty"
- typical_distance: Range like "1-3 miles", "2-5 miles", etc.

List 6-8 major chains that would realistically be in this area. Include a mix of:
- National chains (Walmart, Kroger, Target)
- Regional chains appropriate for this area
- Specialty stores (Whole Foods, Trader Joe's)

Return ONLY valid JSON in this exact format:
{
  "stores": [
    {
      "name": "Store Name",
      "address": "Typical location within 5 miles",
      "distance": "2-4 miles",
      "type": "Conventional"
    }
  ]
}`;
    }

    console.log(`Finding stores for ZIP: ${zipCode}${storeName ? `, prioritizing: ${storeName}` : ''}`);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that provides grocery store information. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    let responseText = completion.choices[0].message.content.trim();

    // Clean up response - remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const storeData = JSON.parse(responseText);

    console.log(`Found ${storeData.stores?.length || 0} stores`);
    res.json(storeData);

  } catch (error) {
    console.error('Error finding stores:', error);
    res.status(500).json({ error: 'Failed to find stores' });
  }
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