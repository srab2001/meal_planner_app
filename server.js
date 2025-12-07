require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const OpenAI = require('openai');
const rateLimit = require('express-rate-limit');
const db = require('./db');
const jwt = require('jsonwebtoken');
const pgSession = require('connect-pg-simple')(session);

const {
  PORT,
  NODE_ENV = 'development',
  SESSION_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  FRONTEND_BASE,
  OPENAI_API_KEY,
  STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY,
  ADMIN_PASSWORD
} = process.env;

// Use SESSION_SECRET for JWT as well
const JWT_SECRET = SESSION_SECRET;
const ADMIN_SECRET = ADMIN_PASSWORD || 'change-this-in-production';

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

// Initialize Stripe (if configured)
let stripe = null;
if (STRIPE_SECRET_KEY) {
  const stripeLib = require('stripe');
  stripe = stripeLib(STRIPE_SECRET_KEY);
  console.log('Stripe initialized');
} else {
  console.warn('STRIPE_SECRET_KEY not set - payment features will be disabled');
}

// behind Render proxy
app.set('trust proxy', 1);

// CORS: whitelist specific origins only
const allowedOrigins = [
  FRONTEND_BASE,
  'http://localhost:3000',  // Local development
  'http://localhost:5000',  // Local backend
  'https://meal-planner-rjyhqof89-stus-projects-458dd35a.vercel.app',  // Vercel preview
  // Add your production Vercel URL here when deployed
].filter(Boolean); // Remove undefined values

console.log('Allowed CORS origins:', allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from origin ${origin}`;
        console.warn('CORS blocked:', origin);
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true
  })
);

app.use(express.json());

// Rate Limiting - Prevent DoS attacks and API abuse
// General rate limiter for all requests
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the request limit. Please try again in 15 minutes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 login attempts per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    console.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Please wait 15 minutes before trying again.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Strict rate limiter for expensive AI API calls
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 AI requests per windowMs
  message: 'Too many AI requests, please try again later.',
  handler: (req, res) => {
    console.warn(`AI rate limit exceeded for IP: ${req.ip} - preventing OpenAI cost overrun`);
    res.status(429).json({
      error: 'Too many meal plan requests',
      message: 'To prevent abuse, we limit meal plan generations. Please try again in 15 minutes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Apply general rate limiter to all requests
app.use(generalLimiter);

console.log('Rate limiting enabled:');
console.log('- General: 100 requests per 15 minutes');
console.log('- Auth: 20 attempts per 15 minutes');
console.log('- AI: 30 requests per 15 minutes');

app.use(
  session({
    store: new pgSession({
      pool: db.pool,
      tableName: 'session',
      createTableIfMissing: false, // We create it via migration
      pruneSessionInterval: 60 * 15 // Cleanup expired sessions every 15 minutes
    }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true, // Trust the proxy for secure cookie handling
    cookie: {
      secure: NODE_ENV === 'production',
      httpOnly: true,
      sameSite: NODE_ENV === 'production' ? 'none' : 'lax', // 'none' required for cross-domain OAuth
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  })
);

console.log('✅ Session storage: PostgreSQL (persistent across restarts)');

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
        console.log('🔐 OAuth callback received for:', profile.id);
        const email =
          profile.emails && profile.emails[0] && profile.emails[0].value;

        if (!email) {
          console.error('❌ No email in Google profile');
          return done(new Error('email not in Google profile'));
        }

        console.log('📧 Email from profile:', email);

        // Check if user exists in database
        const userResult = await db.query(
          'SELECT * FROM users WHERE google_id = $1',
          [profile.id]
        );

        let user;

        if (userResult.rows.length === 0) {
          console.log('👤 New user detected, creating account...');
          // Create new user
          try {
            const insertResult = await db.query(`
              INSERT INTO users (google_id, email, display_name, picture_url, last_login)
              VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
              RETURNING *
            `, [profile.id, email, profile.displayName, profile.photos?.[0]?.value]);

            user = insertResult.rows[0];
            console.log('✅ User record created with ID:', user.id);

            // Create free subscription for new user
            await db.query(`
              INSERT INTO subscriptions (user_id, plan_type, status)
              VALUES ($1, 'free', 'active')
            `, [user.id]);

            console.log('✅ Free subscription created for new user');
            console.log('✅ New user created:', user.email);
          } catch (createError) {
            console.error('❌ Error creating new user:', createError.message);
            console.error('❌ Full error:', createError);
            throw createError;
          }
        } else {
          user = userResult.rows[0];

          // Update last login
          await db.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
          );

          console.log('✅ Existing user logged in:', user.email);
        }

        // Return user object for session
        const userObj = {
          id: user.id,
          googleId: user.google_id,
          email: user.email,
          displayName: user.display_name,
          picture: user.picture_url
        };
        console.log('✅ Returning user object to passport:', userObj.email);
        done(null, userObj);
      } catch (err) {
        console.error('❌ OAuth error:', err.message);
        console.error('❌ Full OAuth error:', err);
        done(err);
      }
    }
  )
);

// JWT Helper Functions
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      googleId: user.googleId,
      displayName: user.displayName,
      picture: user.picture
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// JWT Authentication Middleware
function requireAuth(req, res, next) {
  // Check for token in Authorization header or query parameter
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'not_authenticated', message: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'invalid_token', message: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
}

// health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Google login (with auth rate limiter to prevent brute force)
app.get(
  '/auth/google',
  authLimiter,
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google callback (with auth rate limiter to prevent brute force)
app.get(
  '/auth/google/callback',
  authLimiter,
  passport.authenticate('google', {
    failureRedirect:
      (FRONTEND_BASE || 'http://localhost:3000') + '/login?error=1',
    session: false // No longer using sessions, using JWT tokens instead
  }),
  (req, res) => {
    // Generate JWT token for the authenticated user
    console.log('OAuth callback successful for user:', req.user?.email);

    try {
      const token = generateToken(req.user);
      console.log('✅ JWT token generated for:', req.user.email);

      // Redirect to frontend with token in URL hash (more secure than query param)
      const frontend = FRONTEND_BASE || 'http://localhost:3000';
      res.redirect(`${frontend}#token=${token}`);
    } catch (err) {
      console.error('❌ Error generating token:', err);
      res.redirect((FRONTEND_BASE || 'http://localhost:3000') + '/login?error=1');
    }
  }
);

// current user (JWT-based)
app.get('/auth/user', (req, res) => {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  console.log('GET /auth/user - Token present:', !!token);

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ user: null });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    console.log('Invalid or expired token');
    return res.status(401).json({ user: null, error: 'invalid_token' });
  }

  console.log('✅ Token verified for user:', decoded.email);

  res.json({
    user: {
      id: decoded.id,
      email: decoded.email,
      displayName: decoded.displayName,
      picture: decoded.picture
    }
  });
});

// logout (JWT - handled client-side by deleting token)
app.post('/auth/logout', (req, res) => {
  // With JWT, logout is handled by the client deleting the token from localStorage
  console.log('Logout request received');
  res.json({ success: true, message: 'Logged out successfully' });
});

// simple profile endpoint
app.get('/api/profile', requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    full_name: req.user.full_name
  });
});

// Store finder endpoint (with AI rate limiter)
app.post('/api/find-stores', aiLimiter, requireAuth, async (req, res) => {
  try {
    const { zipCode, storeName } = req.body;

    if (!zipCode || !/^\d{5}(-\d{4})?$/.test(zipCode)) {
      return res.status(400).json({ error: 'Invalid ZIP code' });
    }

    // Build prompt based on whether a specific store was requested
    let prompt;
    if (storeName && storeName.trim()) {
      prompt = `Given the ZIP code ${zipCode}, list grocery stores within a 10-mile radius with a focus on "${storeName}".

CRITICAL REQUIREMENTS:
1. ONLY include stores within 10 miles of the ZIP code ${zipCode}
2. If "${storeName}" exists within 10 miles, it MUST be the FIRST store in the list
3. Do NOT include stores beyond 10 miles

For each store, provide:
- name: The official store name
- type: Category like "Organic", "Discount", "Conventional", "Specialty"
- distance: Estimated distance from ${zipCode} (e.g., "3 miles", "7 miles", "10 miles")

List 6-8 stores within 10 miles:
1. "${storeName}" (if it exists within 10 miles) - MUST BE FIRST
2. Other nearby stores similar to "${storeName}"
3. Other major chains within the 10-mile radius

Include a mix of:
- The requested store if available within 10 miles
- National chains (Walmart, Kroger, Target)
- Regional chains appropriate for this area
- Specialty stores (Whole Foods, Trader Joe's)

Return ONLY valid JSON in this exact format:
{
  "stores": [
    {
      "name": "Store Name",
      "address": "Typical location description",
      "distance": "5 miles",
      "type": "Conventional"
    }
  ]
}`;
    } else {
      prompt = `Given the ZIP code ${zipCode}, list major grocery stores within a 10-mile radius.

CRITICAL REQUIREMENT: ONLY include stores within 10 miles of ZIP code ${zipCode}. Do NOT include stores beyond 10 miles.

For each store, provide:
- name: The official store name
- type: Category like "Organic", "Discount", "Conventional", "Specialty"
- distance: Estimated distance from ${zipCode} (e.g., "3 miles", "7 miles", "10 miles")

List 6-8 major chains within the 10-mile radius. Include a mix of:
- National chains (Walmart, Kroger, Target)
- Regional chains appropriate for this area
- Specialty stores (Whole Foods, Trader Joe's)

Return ONLY valid JSON in this exact format:
{
  "stores": [
    {
      "name": "Store Name",
      "address": "Typical location description",
      "distance": "5 miles",
      "type": "Conventional"
    }
  ]
}`;
    }

    console.log(`Finding stores within 10 miles of ZIP: ${zipCode}${storeName ? `, prioritizing: ${storeName}` : ''}`);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that provides grocery store information for a specific ZIP code. CRITICAL: Only include stores within a 10-mile radius of the given ZIP code. Always respond with valid JSON only.'
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

// Helper function to validate that all recipe ingredients are in the shopping list
function validateShoppingListCompleteness(mealPlanData, daysOfWeek) {
  const missingIngredients = [];
  const shoppingListItems = new Set();

  // Collect all items from shopping list (normalize for comparison)
  if (mealPlanData.shoppingList) {
    Object.values(mealPlanData.shoppingList).forEach(category => {
      if (Array.isArray(category)) {
        category.forEach(item => {
          if (item.item) {
            // Normalize: lowercase, remove articles, trim
            const normalized = item.item.toLowerCase()
              .replace(/^(a|an|the)\s+/i, '')
              .replace(/\s+/g, ' ')
              .trim();
            shoppingListItems.add(normalized);
          }
        });
      }
    });
  }

  // Check each recipe's ingredients
  if (mealPlanData.mealPlan) {
    daysOfWeek.forEach(day => {
      const dayMeals = mealPlanData.mealPlan[day];
      if (dayMeals) {
        Object.entries(dayMeals).forEach(([mealType, meal]) => {
          if (meal && meal.ingredients && Array.isArray(meal.ingredients)) {
            meal.ingredients.forEach(ingredient => {
              // Normalize ingredient for comparison
              const normalized = ingredient.toLowerCase()
                .replace(/^(a|an|the)\s+/i, '')
                .replace(/\d+\s*(cups?|tbsps?|tsps?|ozs?|lbs?|grams?|mls?|liters?|pieces?|cloves?|stalks?|bunches?)/gi, '')
                .replace(/\s+/g, ' ')
                .trim()
                // Extract main ingredient (before comma or parenthesis)
                .split(/[,(]/)[0]
                .trim();

              // Check if this ingredient (or close match) exists in shopping list
              let found = false;
              for (const listItem of shoppingListItems) {
                // Check if either contains the other (handles variations like "chicken breast" vs "chicken")
                if (listItem.includes(normalized) || normalized.includes(listItem)) {
                  found = true;
                  break;
                }
              }

              if (!found && normalized.length > 2) { // Ignore very short ingredients
                missingIngredients.push({
                  ingredient: ingredient,
                  normalizedIngredient: normalized,
                  day: day,
                  meal: `${meal.name} (${mealType})`
                });
              }
            });
          }
        });
      }
    });
  }

  return {
    isComplete: missingIngredients.length === 0,
    missingIngredients: missingIngredients,
    totalShoppingListItems: shoppingListItems.size
  };
}

// Meal plan generation endpoint (with AI rate limiter to prevent cost overruns)
app.post('/api/generate-meals', aiLimiter, requireAuth, async (req, res) => {
  try {
    const { zipCode, primaryStore, comparisonStore, selectedMeals, servingsByMeal, selectedDays, dietaryPreferences, leftovers, specialOccasion, ...preferences } = req.body;

    console.log(`Generating meal plan for user: ${req.user.email}`);
    if (specialOccasion) {
      console.log('✨ Special occasion meal requested - will generate premium restaurant-quality meal');
    }

    // Check if this is the test user (bypass all limits)
    let isTestUser = false;
    try {
      const testUserResult = await db.query(`
        SELECT value FROM app_settings WHERE key = 'test_user_email'
      `);
      const testUserEmail = testUserResult.rows[0]?.value?.trim().toLowerCase();
      if (testUserEmail && req.user.email.toLowerCase() === testUserEmail) {
        isTestUser = true;
        console.log(`🧪 Test user detected - bypassing all limits`);
      }
    } catch (error) {
      // If settings table doesn't exist, just continue normally
      console.log('Could not check test user setting:', error.message);
    }

    if (!isTestUser) {
      // Check user subscription status and usage limits
      const subscription = await db.query(
        'SELECT plan_type FROM subscriptions WHERE user_id = $1',
        [req.user.id]
      );

      const planType = subscription.rows[0]?.plan_type || 'free';

      if (planType === 'free') {
        // Check monthly usage for free tier
        const usageResult = await db.query(`
          SELECT COUNT(*) as count
          FROM usage_stats
          WHERE user_id = $1
            AND action_type = 'meal_plan_generated'
            AND created_at >= date_trunc('month', CURRENT_TIMESTAMP)
        `, [req.user.id]);

        const usageCount = parseInt(usageResult.rows[0].count);

        if (usageCount >= 10) {
          console.log(`⚠️  Free tier limit reached for ${req.user.email} (${usageCount}/10)`);
          return res.status(403).json({
            error: 'Free tier limit reached',
            message: 'You have generated 10 meal plans this month. Upgrade to Premium for unlimited access.',
            usageCount: usageCount,
            limit: 10,
            planType: 'free',
            upgradeUrl: '/pricing'
          });
        }

        console.log(`✅ Usage: ${usageCount}/10 meal plans this month`);
      } else {
        console.log(`✅ Premium user - unlimited access`);
      }
    }

    console.log(`Primary Store: ${primaryStore?.name}, ZIP: ${zipCode}`);
    if (comparisonStore) {
      console.log(`Comparison Store: ${comparisonStore.name}`);
    }
    console.log(`Selected meals: ${selectedMeals?.join(', ')}`);
    console.log(`Selected days: ${selectedDays?.join(', ') || 'All days'}`);
    console.log(`Dietary preferences: ${dietaryPreferences?.join(', ') || 'None'}`);
    console.log(`Leftover ingredients: ${leftovers?.join(', ') || 'None'}`);

    // Build meal type list based on user selection
    const mealTypes = selectedMeals && selectedMeals.length > 0
      ? selectedMeals
      : ['breakfast', 'lunch', 'dinner'];

    // Build days list based on user selection
    const daysOfWeek = selectedDays && selectedDays.length > 0
      ? selectedDays
      : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Build dietary restrictions text
    const formatDietaryPreference = (pref) => {
      const mapping = {
        'diabetic': 'Diabetic-friendly (low sugar, complex carbohydrates)',
        'dairyFree': 'Dairy-free (no milk, cheese, butter, cream, yogurt)',
        'glutenFree': 'Gluten-free (no wheat, barley, rye)',
        'peanutFree': 'Peanut-free (no peanuts or peanut products)',
        'vegetarian': 'Vegetarian (no meat, poultry, or seafood)',
        'kosher': 'Kosher (following Jewish dietary laws - no pork, shellfish, mixing meat and dairy)'
      };
      return mapping[pref] || pref;
    };

    const dietaryRestrictionsText = dietaryPreferences && dietaryPreferences.length > 0
      ? `- Dietary Restrictions: ${dietaryPreferences.map(formatDietaryPreference).join(', ')}`
      : '';

    // Build leftovers text
    const leftoversText = leftovers && leftovers.length > 0
      ? `- Leftover ingredients to use: ${leftovers.join(', ')}`
      : '';

    // Build requirements based on what's selected
    let requirementNumber = 4;
    const leftoverRequirement = leftovers && leftovers.length > 0
      ? `${requirementNumber++}. **PRIORITY**: Incorporate these leftover ingredients into the meal plan wherever possible: ${leftovers.join(', ')}. Try to use them in at least 2-3 meals throughout the plan.\n`
      : '';

    const cuisineRequirement = `${requirementNumber++}. Include recipes that match the user's cuisine preferences\n`;

    const dietaryRequirement = dietaryPreferences && dietaryPreferences.length > 0
      ? `${requirementNumber++}. **CRITICAL**: ALL recipes MUST comply with these dietary restrictions: ${dietaryPreferences.map(formatDietaryPreference).join('; ')}. Do not use any ingredients that violate these restrictions.\n`
      : '';

    const shoppingListRequirement = `${requirementNumber++}. **CRITICAL**: Create a consolidated shopping list that includes EVERY SINGLE ingredient from ALL recipes across ALL ${daysOfWeek.length} days. Do not omit any ingredients - every ingredient listed in the recipes must appear in the shopping list, organized by category (Produce, Meat & Seafood, Dairy & Eggs, Pantry Staples). Combine duplicate ingredients with appropriate quantities.\n`;
    const storeRequirement = `${requirementNumber++}. All items should be commonly available at the selected store(s)\n`;
    const timeRequirement = `${requirementNumber++}. Include prep time, cooking time, servings, and estimated cost for each meal\n`;
    const imageRequirement = `${requirementNumber++}. **CRITICAL**: For EVERY meal, include an "imageUrl" field with a high-quality Unsplash food image URL that matches the dish. Use URLs in format: https://images.unsplash.com/photo-[id]?w=800&q=80\n`;
    const instructionsRequirement = `${requirementNumber++}. Provide simple, clear cooking instructions\n`;

    const comparisonRequirement = comparisonStore
      ? `${requirementNumber++}. **CRITICAL**: For EVERY item in the shopping list, provide estimated prices at BOTH stores (primaryStorePrice and comparisonStorePrice)\n${requirementNumber++}. Calculate total estimated costs for both stores and show potential savings\n`
      : '';

    // Create example meal structure for the prompt
    const mealStructureExample = mealTypes.map(mealType => {
      const servings = servingsByMeal?.[mealType] || preferences.people || 2;
      return `      "${mealType}": { "name": "...", "prepTime": "...", "cookTime": "...", "servings": ${servings}, "estimatedCost": "$X-Y", "imageUrl": "https://images.unsplash.com/photo-...", "ingredients": [...], "instructions": [...] }`;
    }).join(',\n');

    // Build shopping list format based on whether we have comparison store
    const shoppingListFormat = comparisonStore ? `
  "shoppingList": {
    "Produce": [
      {
        "item": "Tomatoes",
        "quantity": "6 medium",
        "primaryStorePrice": "$4.50",
        "comparisonStorePrice": "$5.00"
      },
      {
        "item": "Lettuce",
        "quantity": "2 heads",
        "primaryStorePrice": "$3.00",
        "comparisonStorePrice": "$2.50"
      }
    ],
    "Meat & Seafood": [
      {
        "item": "Chicken breast",
        "quantity": "2 lbs",
        "primaryStorePrice": "$8.99",
        "comparisonStorePrice": "$9.49"
      }
    ],
    "Dairy & Eggs": [
      {
        "item": "Eggs",
        "quantity": "1 dozen",
        "primaryStorePrice": "$3.50",
        "comparisonStorePrice": "$3.25"
      }
    ],
    "Pantry Staples": [],
    "Other": []
  },
  "priceComparison": {
    "primaryStoreTotal": "$150-175",
    "comparisonStoreTotal": "$145-170",
    "savings": "Save $5-10 at ${comparisonStore.name}"
  },` : `
  "shoppingList": {
    "Produce": [
      { "item": "Tomatoes", "quantity": "6 medium", "estimatedPrice": "$4.50" },
      { "item": "Lettuce", "quantity": "2 heads", "estimatedPrice": "$3.00" }
    ],
    "Meat & Seafood": [
      { "item": "Chicken breast", "quantity": "2 lbs", "estimatedPrice": "$8.99" }
    ],
    "Dairy & Eggs": [
      { "item": "Eggs", "quantity": "1 dozen", "estimatedPrice": "$3.50" }
    ],`;

    // Build store information for prompt
    const storeInfo = comparisonStore ?
      `- Primary Store: ${primaryStore?.name || 'Local grocery store'} (${primaryStore?.type || 'Conventional'})
- Comparison Store: ${comparisonStore.name} (${comparisonStore.type || 'Conventional'})
- **IMPORTANT**: Provide estimated prices at BOTH stores for ALL shopping list items` :
      `- Selected Grocery Store: ${primaryStore?.name || 'Local grocery store'}
- Store Type: ${primaryStore?.type || 'Conventional'}`;

    // Build a comprehensive prompt for meal planning
    const prompt = `You are a professional meal planner. Create a personalized weekly meal plan based on these preferences:

**User Information:**
- Name: ${req.user.full_name || 'User'}
- Email: ${req.user.email}

**Location & Store:**
- ZIP Code: ${zipCode}
${storeInfo}

**Preferences:**
- Cuisines: ${preferences.cuisines?.join(', ') || 'Any'}
- Number of people: ${preferences.people || 2}
- Meals needed: ${mealTypes.join(', ')}
${dietaryRestrictionsText}
${leftoversText}
${specialOccasion ? `
**✨ SPECIAL OCCASION MEAL:**
- The user requested ONE special occasion meal this week
- This should be a premium, restaurant-quality dish
- Inspire this meal from renowned chefs like Gordon Ramsay, Jamie Oliver, or publications like Bon Appétit, Saveur, or Food & Wine
- Use elevated cooking techniques (sous vide, braising, reduction sauces, etc.)
- Include gourmet ingredients from premium stores like Whole Foods, specialty butchers, or farmers markets
- Add elegant presentation suggestions
- Include wine or beverage pairing recommendations
- Estimated cost for this meal: $40-80 (higher than regular meals)
- Mark this meal with "isSpecialOccasion": true in the JSON
- Add a "productRecommendations" array with 3-5 premium products (fine cookware, elegant serving pieces, specialty ingredients, linens, wine)
` : ''}

**CRITICAL Requirements:**
1. **YOU MUST create meals for ALL ${daysOfWeek.length} days**: ${daysOfWeek.join(', ')}
2. **YOU MUST include ONLY these meal types**: ${mealTypes.join(', ')}
3. **EACH day MUST have ${mealTypes.length} meal(s)**: ${mealTypes.join(', ')}
4. DO NOT skip any requested days - ALL ${daysOfWeek.length} days are required
${leftoverRequirement}${cuisineRequirement}${dietaryRequirement}${shoppingListRequirement}${storeRequirement}${timeRequirement}${imageRequirement}${instructionsRequirement}${comparisonRequirement}

**Response Format:**
You MUST return JSON with ALL ${daysOfWeek.length} days (${daysOfWeek.join(', ')}). Return ONLY valid JSON in this exact format:
{
  "mealPlan": {
${daysOfWeek.map(day => `    "${day}": {\n${mealStructureExample}\n    }`).join(',\n')}
  },
${shoppingListFormat}
    "Pantry Staples": [
      { "item": "Olive oil", "quantity": "1 bottle", "estimatedPrice": "$7.99" }
    ],
    "Other": []
  },
  "totalEstimatedCost": "$150-200",
  "summary": {
    "totalMeals": ${mealTypes.length * daysOfWeek.length},
    "estimatedCost": "$150-200",
    "prepTimeTotal": "~5 hours",
    "dietaryNotes": "..."
  }
}`;

    console.log('Calling OpenAI to generate meal plan...');
    console.log(`📋 Prompt includes days: ${daysOfWeek.join(', ')}`);
    console.log(`📋 Prompt includes meals: ${mealTypes.join(', ')}`);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert meal planner and nutritionist. Create detailed, practical meal plans with realistic recipes. CRITICAL: You must generate meals for EVERY day requested by the user - do not skip any days. Always respond with valid JSON only, including all requested days.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 6000,
    });

    // Check if response was truncated
    if (completion.choices[0].finish_reason === 'length') {
      console.warn('⚠️  WARNING: OpenAI response was truncated due to token limit!');
    }

    let responseText = completion.choices[0].message.content.trim();
    console.log(`📏 Response length: ${responseText.length} characters`);

    // Clean up response - remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const mealPlanData = JSON.parse(responseText);

    // Debug: Log what days OpenAI actually returned
    const returnedDays = Object.keys(mealPlanData.mealPlan || {});
    console.log('✅ Meal plan generated successfully');
    console.log(`📅 Days requested: ${daysOfWeek.join(', ')}`);
    console.log(`📅 Days returned by OpenAI: ${returnedDays.join(', ')}`);

    if (returnedDays.length !== daysOfWeek.length) {
      console.error(`❌ MISMATCH: Requested ${daysOfWeek.length} days but received ${returnedDays.length} days`);
      console.error(`Missing days: ${daysOfWeek.filter(d => !returnedDays.includes(d)).join(', ')}`);
    }

    // Track usage for analytics and quota enforcement
    await db.query(`
      INSERT INTO usage_stats (user_id, action_type, metadata)
      VALUES ($1, 'meal_plan_generated', $2)
    `, [req.user.id, JSON.stringify({
      cuisines: preferences.cuisines || [],
      days: selectedDays?.length || 7,
      meals: selectedMeals?.length || 3,
      dietaryPreferences: dietaryPreferences || [],
      hasComparison: !!comparisonStore
    })]);

    console.log(`📊 Usage tracked for ${req.user.email}`);

    // Validate that all recipe ingredients are in the shopping list
    console.log('🔍 Validating shopping list completeness...');
    const validationResult = validateShoppingListCompleteness(mealPlanData, daysOfWeek);
    if (!validationResult.isComplete) {
      console.warn('⚠️  Shopping list validation found missing ingredients:');
      validationResult.missingIngredients.forEach(missing => {
        console.warn(`   - ${missing.ingredient} (from ${missing.meal} on ${missing.day})`);
      });
      console.warn(`   Total missing: ${validationResult.missingIngredients.length} ingredients`);
    } else {
      console.log('✅ Shopping list validation passed - all ingredients accounted for');
    }

    res.json(mealPlanData);

  } catch (error) {
    console.error('Error generating meal plan:', error);
    res.status(500).json({
      error: 'Failed to generate meal plan',
      details: error.message
    });
  }
});

// Single meal regeneration endpoint (with AI rate limiter)
app.post('/api/regenerate-meal', aiLimiter, requireAuth, async (req, res) => {
  try {
    const { mealType, cuisines, people, groceryStore, currentMeal, dietaryPreferences } = req.body;

    console.log(`Regenerating ${mealType} for user: ${req.user.email}`);
    console.log(`Current meal: ${currentMeal}`);
    console.log(`Store: ${groceryStore?.name}`);
    console.log(`Dietary preferences: ${dietaryPreferences?.join(', ') || 'None'}`);

    // Randomly select ONE cuisine from the user's preferences for variety
    let selectedCuisine = 'Any';
    if (cuisines && cuisines.length > 0) {
      selectedCuisine = cuisines[Math.floor(Math.random() * cuisines.length)];
      console.log(`🎲 Randomly selected cuisine: ${selectedCuisine} (from ${cuisines.join(', ')})`);
    }

    // Build dietary restrictions text
    const formatDietaryPreference = (pref) => {
      const mapping = {
        'diabetic': 'Diabetic-friendly (low sugar, complex carbohydrates)',
        'dairyFree': 'Dairy-free (no milk, cheese, butter, cream, yogurt)',
        'glutenFree': 'Gluten-free (no wheat, barley, rye)',
        'peanutFree': 'Peanut-free (no peanuts or peanut products)',
        'vegetarian': 'Vegetarian (no meat, poultry, or seafood)',
        'kosher': 'Kosher (following Jewish dietary laws - no pork, shellfish, mixing meat and dairy)'
      };
      return mapping[pref] || pref;
    };

    const dietaryRestrictionsText = dietaryPreferences && dietaryPreferences.length > 0
      ? `- Dietary Restrictions: ${dietaryPreferences.map(formatDietaryPreference).join(', ')}`
      : '';

    // Build a prompt for regenerating a single meal
    const prompt = `You are a professional chef and meal planner. Generate ONE new ${mealType} recipe based on these preferences:

**User Information:**
- Name: ${req.user.full_name || 'User'}
- Cooking for: ${people || 2} people

**Preferences:**
- Cuisine focus: ${selectedCuisine}
- Grocery Store: ${groceryStore?.name || 'Local grocery store'}
- Store Type: ${groceryStore?.type || 'Conventional'}
${dietaryRestrictionsText}

**Requirements:**
1. Create a DIFFERENT meal than: "${currentMeal}"
2. Make it appropriate for ${mealType}
3. Focus on ${selectedCuisine} cuisine style
${dietaryPreferences && dietaryPreferences.length > 0 ? `4. **CRITICAL**: This recipe MUST comply with these dietary restrictions: ${dietaryPreferences.map(formatDietaryPreference).join('; ')}. Do not use any ingredients that violate these restrictions.
5. Include prep time and cooking time` : '4. Include prep time and cooking time'}
${dietaryPreferences && dietaryPreferences.length > 0 ? '6' : '5'}. Include servings count (for ${people || 2} people)
${dietaryPreferences && dietaryPreferences.length > 0 ? '7' : '6'}. **CRITICAL**: Include an "imageUrl" field with a high-quality Unsplash food image URL that matches the dish. Use URLs in format: https://images.unsplash.com/photo-[id]?w=800&q=80
${dietaryPreferences && dietaryPreferences.length > 0 ? '8' : '7'}. List all ingredients with quantities
${dietaryPreferences && dietaryPreferences.length > 0 ? '9' : '8'}. Provide clear, step-by-step cooking instructions
${dietaryPreferences && dietaryPreferences.length > 0 ? '10' : '9'}. Estimate the cost
${dietaryPreferences && dietaryPreferences.length > 0 ? '11' : '10'}. All ingredients should be commonly available at ${groceryStore?.name || 'the selected store'}

**Response Format:**
Return ONLY valid JSON in this exact format:
{
  "name": "Recipe Name",
  "prepTime": "10 mins",
  "cookTime": "20 mins",
  "servings": ${people || 2},
  "estimatedCost": "$8-12",
  "imageUrl": "https://images.unsplash.com/photo-[id]?w=800&q=80",
  "ingredients": [
    "1 cup of ingredient",
    "2 tablespoons of ingredient"
  ],
  "instructions": [
    "Step 1 description",
    "Step 2 description"
  ]
}`;

    console.log(`Calling OpenAI to regenerate ${mealType}...`);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert chef and meal planner. Create detailed, practical recipes that are easy to follow. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.9, // Higher temperature for more variety
      max_tokens: 1000,
    });

    let responseText = completion.choices[0].message.content.trim();

    // Clean up response - remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const meal = JSON.parse(responseText);

    console.log(`✅ New ${mealType} generated: ${meal.name}`);

    res.json({ meal });

  } catch (error) {
    console.error('Error regenerating meal:', error);
    res.status(500).json({
      error: 'Failed to regenerate meal',
      details: error.message
    });
  }
});

// Custom item prices endpoint (with AI rate limiter)
app.post('/api/custom-item-prices', aiLimiter, requireAuth, async (req, res) => {
  try {
    const { items, primaryStore, comparisonStore } = req.body;

    console.log(`Getting prices for custom items: ${items.join(', ')}`);
    console.log(`Primary store: ${primaryStore}`);
    console.log(`Comparison store: ${comparisonStore || 'None'}`);

    const isComparisonMode = !!comparisonStore;

    // Build the prompt for GPT
    const prompt = `You are a grocery pricing expert. Provide estimated prices for the following grocery items at the specified store(s).

**Items to price:**
${items.map((item, i) => `${i + 1}. ${item}`).join('\n')}

**Store Information:**
- Primary Store: ${primaryStore}
${isComparisonMode ? `- Comparison Store: ${comparisonStore}` : ''}

**Instructions:**
1. For each item, estimate a realistic current price at the specified store(s)
2. Use standard quantities (e.g., "1 lb", "1 gallon", "per item", "1 dozen", etc.)
3. Prices should be realistic and based on typical ${primaryStore} pricing${isComparisonMode ? ` and ${comparisonStore} pricing` : ''}
4. Format prices as dollar amounts (e.g., "$3.99", "$2.50")

**Response Format:**
Return ONLY valid JSON in this exact format:
{
  "items": [
    {
      "item": "item name",
      "quantity": "standard quantity (e.g., '1 lb', '1 gallon')",
      ${isComparisonMode ? `"primaryStorePrice": "$X.XX",
      "comparisonStorePrice": "$X.XX"` : `"estimatedPrice": "$X.XX"`}
    }
  ]
}`;

    console.log('Calling OpenAI for custom item prices...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a grocery pricing expert with knowledge of current market prices at major grocery stores. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent pricing
      max_tokens: 1000,
    });

    let responseText = completion.choices[0].message.content.trim();

    // Clean up response - remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const priceData = JSON.parse(responseText);

    console.log(`✅ Prices retrieved for ${priceData.items.length} custom items`);

    res.json(priceData);

  } catch (error) {
    console.error('Error getting custom item prices:', error);
    res.status(500).json({
      error: 'Failed to get prices for custom items',
      details: error.message
    });
  }
});

// Discount codes configuration
// Add or modify codes as needed
// To add a new code, add a line like: 'YOURCODE': { percentOff: 100, description: 'Description' },
const DISCOUNT_CODES = {
  'TESTFREE': { percentOff: 100, description: 'Free access for testers' },
  'BETA50': { percentOff: 50, description: '50% off for beta testers' },
  'WELCOME25': { percentOff: 25, description: '25% off welcome discount' },
  'REDTEST': { percentOff: 100, description: 'Red test code - free access' },
  // Add your custom codes below:
  // 'FRIEND100': { percentOff: 100, description: 'Free for friends' },
  // 'LAUNCH20': { percentOff: 20, description: 'Launch discount' },
};

// Function to track discount code usage
const trackDiscountCodeUsage = (email, code, percentOff, usageType = 'validated') => {
  try {
    const fs = require('fs');
    const path = require('path');
    const trackingFile = path.join(__dirname, 'discount-code-usage.json');

    // Read existing data
    let trackingData = [];
    if (fs.existsSync(trackingFile)) {
      const fileContent = fs.readFileSync(trackingFile, 'utf8');
      trackingData = JSON.parse(fileContent);
    }

    // Add new entry
    trackingData.push({
      email,
      code,
      percentOff,
      usageType, // 'validated', 'applied_free', 'applied_paid'
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
    });

    // Write back to file
    fs.writeFileSync(trackingFile, JSON.stringify(trackingData, null, 2));
    console.log(`📊 Tracked discount code: ${email} used ${code} (${percentOff}% off) - ${usageType}`);
  } catch (error) {
    console.error('Error tracking discount code usage:', error);
    // Don't fail the request if tracking fails
  }
};

// Validate discount code endpoint
app.post('/api/validate-discount', requireAuth, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Invalid code format', valid: false });
    }

    const normalizedCode = code.trim().toUpperCase();
    const discount = DISCOUNT_CODES[normalizedCode];

    if (discount) {
      console.log(`✅ Valid discount code applied: ${normalizedCode} (${discount.percentOff}% off) by ${req.user.email}`);

      // Track the validation
      trackDiscountCodeUsage(req.user.email, normalizedCode, discount.percentOff, 'validated');

      res.json({
        valid: true,
        code: normalizedCode,
        percentOff: discount.percentOff,
        description: discount.description
      });
    } else {
      console.log(`❌ Invalid discount code attempted: ${normalizedCode} by ${req.user.email}`);
      res.status(400).json({ error: 'Invalid discount code', valid: false });
    }
  } catch (error) {
    console.error('Error validating discount code:', error);
    res.status(500).json({ error: 'Failed to validate code', valid: false });
  }
});

// Apply free access (for 100% discount codes)
app.post('/api/apply-free-access', requireAuth, async (req, res) => {
  try {
    const { code } = req.body;
    const normalizedCode = code?.trim().toUpperCase();
    const discount = DISCOUNT_CODES[normalizedCode];

    if (!discount || discount.percentOff !== 100) {
      return res.status(400).json({ error: 'Invalid free access code' });
    }

    // Mark user as having paid access in session
    req.session.hasPaidAccess = true;
    req.session.discountCodeUsed = normalizedCode;

    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log(`✅ Free access granted to ${req.user.email} with code ${normalizedCode}`);

    // Track the free access application
    trackDiscountCodeUsage(req.user.email, normalizedCode, 100, 'applied_free');

    res.json({ success: true, message: 'Free access granted' });
  } catch (error) {
    console.error('Error applying free access:', error);
    res.status(500).json({ error: 'Failed to apply free access' });
  }
});

// Create Stripe checkout session
app.post('/api/create-checkout-session', requireAuth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Payment system not configured' });
    }

    const { discountCode } = req.body;
    let discount = null;

    // Validate discount code if provided
    if (discountCode) {
      const normalizedCode = discountCode.trim().toUpperCase();
      discount = DISCOUNT_CODES[normalizedCode];

      if (!discount) {
        return res.status(400).json({ error: 'Invalid discount code' });
      }

      // If 100% off, shouldn't reach here (should use free access endpoint)
      if (discount.percentOff === 100) {
        return res.status(400).json({ error: 'Use free access for 100% discount codes' });
      }
    }

    // Calculate price (in cents)
    const basePrice = 999; // $9.99
    let finalPrice = basePrice;

    if (discount && discount.percentOff) {
      finalPrice = Math.round(basePrice * (1 - discount.percentOff / 100));
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: '7-Day Personalized Meal Plan',
              description: 'Complete meal plan with recipes and shopping list',
            },
            unit_amount: finalPrice,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${FRONTEND_BASE || 'http://localhost:3000'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_BASE || 'http://localhost:3000'}/payment-cancelled`,
      client_reference_id: req.user.id,
      customer_email: req.user.email,
      metadata: {
        userId: req.user.id,
        userEmail: req.user.email,
        discountCode: discountCode || 'none',
      },
    });

    console.log(`💳 Checkout session created for ${req.user.email}: ${session.id}`);

    // Track paid discount code usage
    if (discount && discountCode) {
      trackDiscountCodeUsage(req.user.email, discountCode.trim().toUpperCase(), discount.percentOff, 'applied_paid');
    }

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session', details: error.message });
  }
});

// Verify payment success
app.post('/api/verify-payment', requireAuth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Payment system not configured' });
    }

    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      // Mark user as having paid access in session
      req.session.hasPaidAccess = true;
      req.session.stripeSessionId = sessionId;

      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log(`✅ Payment verified for ${req.user.email}: ${sessionId}`);
      res.json({ success: true, verified: true });
    } else {
      res.status(400).json({ error: 'Payment not completed', verified: false });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment', details: error.message });
  }
});

// Check payment status
app.get('/api/payment-status', requireAuth, (req, res) => {
  const hasPaidAccess = req.session.hasPaidAccess || false;
  console.log(`💰 Payment status check for ${req.user.email}: ${hasPaidAccess ? 'PAID ✅' : 'UNPAID ❌'}`);
  console.log(`   Session details:`, {
    hasPaidAccess: req.session.hasPaidAccess,
    discountCodeUsed: req.session.discountCodeUsed,
    stripeSessionId: req.session.stripeSessionId
  });
  res.json({ hasPaidAccess });
});

// Reset payment status (for testing only)
app.post('/api/reset-payment', requireAuth, (req, res) => {
  req.session.hasPaidAccess = false;
  req.session.discountCodeUsed = null;
  req.session.stripeSessionId = null;

  req.session.save((err) => {
    if (err) {
      console.error('Error resetting payment:', err);
      return res.status(500).json({ error: 'Failed to reset' });
    }
    console.log(`🔄 Payment status RESET for ${req.user.email}`);
    res.json({ success: true, message: 'Payment status reset' });
  });
});

// View discount code usage statistics
// Access via: http://your-server-url/api/discount-usage-stats
app.get('/api/discount-usage-stats', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const trackingFile = path.join(__dirname, 'discount-code-usage.json');

    if (!fs.existsSync(trackingFile)) {
      return res.json({
        message: 'No discount code usage data yet',
        totalUsage: 0,
        usageByCode: {},
        recentUsage: []
      });
    }

    const trackingData = JSON.parse(fs.readFileSync(trackingFile, 'utf8'));

    // Calculate statistics
    const usageByCode = {};
    const usageByEmail = {};

    trackingData.forEach(entry => {
      // By code
      if (!usageByCode[entry.code]) {
        usageByCode[entry.code] = {
          totalUses: 0,
          percentOff: entry.percentOff,
          users: [],
          usageTypes: { validated: 0, applied_free: 0, applied_paid: 0 }
        };
      }
      usageByCode[entry.code].totalUses++;
      usageByCode[entry.code].usageTypes[entry.usageType]++;
      if (!usageByCode[entry.code].users.includes(entry.email)) {
        usageByCode[entry.code].users.push(entry.email);
      }

      // By email
      if (!usageByEmail[entry.email]) {
        usageByEmail[entry.email] = {
          codesUsed: [],
          totalValidations: 0,
          totalApplications: 0
        };
      }
      if (!usageByEmail[entry.email].codesUsed.includes(entry.code)) {
        usageByEmail[entry.email].codesUsed.push(entry.code);
      }
      if (entry.usageType === 'validated') {
        usageByEmail[entry.email].totalValidations++;
      } else {
        usageByEmail[entry.email].totalApplications++;
      }
    });

    // Get recent usage (last 20)
    const recentUsage = trackingData.slice(-20).reverse();

    res.json({
      totalRecords: trackingData.length,
      usageByCode,
      usageByEmail,
      recentUsage,
      summary: {
        totalCodes: Object.keys(usageByCode).length,
        totalUsers: Object.keys(usageByEmail).length,
        mostUsedCode: Object.keys(usageByCode).reduce((a, b) =>
          usageByCode[a].totalUses > usageByCode[b].totalUses ? a : b, Object.keys(usageByCode)[0]
        )
      }
    });
  } catch (error) {
    console.error('Error reading discount usage stats:', error);
    res.status(500).json({ error: 'Failed to read usage stats' });
  }
});

// ==================== FAVORITES & HISTORY ====================

// Add meal to favorites
app.post('/api/favorites/add', requireAuth, async (req, res) => {
  try {
    const { meal, mealType, servings_adjustment, user_notes } = req.body;

    if (!meal || !meal.name) {
      return res.status(400).json({ error: 'Invalid meal data' });
    }

    // Validate meal type
    if (!['breakfast', 'lunch', 'dinner'].includes(mealType)) {
      return res.status(400).json({ error: 'Invalid meal type' });
    }

    // Insert favorite with customization data
    const result = await db.query(`
      INSERT INTO favorites (
        user_id, meal_type, meal_data, meal_name,
        servings_adjustment, user_notes
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, meal_name, meal_type)
      DO UPDATE SET
        servings_adjustment = EXCLUDED.servings_adjustment,
        user_notes = EXCLUDED.user_notes
      RETURNING *
    `, [
      req.user.id,
      mealType,
      JSON.stringify(meal),
      meal.name,
      servings_adjustment || null,
      user_notes || null
    ]);

    if (result.rows.length > 0) {
      const customInfo = servings_adjustment || user_notes ? ' (customized)' : '';
      console.log(`❤️  ${req.user.email} saved favorite: ${meal.name}${customInfo}`);
      res.json({ success: true, favorite: result.rows[0] });
    } else {
      res.json({ success: true, message: 'Favorite updated' });
    }

  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// Get user's favorites
app.get('/api/favorites', requireAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        id,
        meal_type,
        meal_data,
        meal_name,
        created_at
      FROM favorites
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [req.user.id]);

    // Format response for frontend
    const favorites = result.rows.map(row => ({
      id: row.id,
      meal: row.meal_data,
      mealType: row.meal_type,
      savedAt: row.created_at
    }));

    res.json({ favorites });

  } catch (error) {
    console.error('Error reading favorites:', error);
    res.status(500).json({ error: 'Failed to read favorites' });
  }
});

// Remove favorite
app.delete('/api/favorites/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Delete favorite (only if it belongs to the user)
    await db.query(`
      DELETE FROM favorites
      WHERE id = $1 AND user_id = $2
    `, [id, req.user.id]);

    console.log(`🗑️  ${req.user.email} removed favorite: ${id}`);
    res.json({ success: true });

  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

// Save shopping list state (checked items)
app.post('/api/shopping-list-state', requireAuth, async (req, res) => {
  try {
    const { checkedItems, mealPlanDate } = req.body;

    if (!checkedItems) {
      return res.status(400).json({ error: 'No checked items provided' });
    }

    const planDate = mealPlanDate || new Date().toISOString().split('T')[0];

    // Upsert shopping list state
    await db.query(`
      INSERT INTO shopping_list_states (user_id, meal_plan_date, checked_items, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, meal_plan_date)
      DO UPDATE SET
        checked_items = EXCLUDED.checked_items,
        updated_at = CURRENT_TIMESTAMP
    `, [req.user.id, planDate, JSON.stringify(checkedItems)]);

    console.log(`💾 ${req.user.email} saved shopping list state (${Object.keys(checkedItems).length} items checked)`);
    res.json({ success: true });

  } catch (error) {
    console.error('Error saving shopping list state:', error);
    res.status(500).json({ error: 'Failed to save shopping list state' });
  }
});

// Get shopping list state (checked items)
app.get('/api/shopping-list-state', requireAuth, async (req, res) => {
  try {
    const { mealPlanDate } = req.query;
    const planDate = mealPlanDate || new Date().toISOString().split('T')[0];

    const result = await db.query(`
      SELECT checked_items, updated_at
      FROM shopping_list_states
      WHERE user_id = $1 AND meal_plan_date = $2
    `, [req.user.id, planDate]);

    if (result.rows.length > 0) {
      res.json({
        checkedItems: result.rows[0].checked_items,
        lastUpdated: result.rows[0].updated_at
      });
    } else {
      // No saved state for this date
      res.json({ checkedItems: {} });
    }

  } catch (error) {
    console.error('Error getting shopping list state:', error);
    res.status(500).json({ error: 'Failed to get shopping list state' });
  }
});

// Save meal plan to history
app.post('/api/save-meal-plan', requireAuth, async (req, res) => {
  try {
    const { mealPlan, preferences, selectedStores, shoppingList, totalCost } = req.body;

    if (!mealPlan) {
      return res.status(400).json({ error: 'No meal plan provided' });
    }

    // Insert history entry
    await db.query(`
      INSERT INTO meal_plan_history (
        user_id,
        preferences,
        meal_plan,
        stores,
        shopping_list,
        total_cost
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      req.user.id,
      JSON.stringify(preferences || {}),
      JSON.stringify(mealPlan),
      JSON.stringify(selectedStores || {}),
      JSON.stringify(shoppingList || {}),
      totalCost || null
    ]);

    console.log(`📝 Saved meal plan to history for ${req.user.email}`);
    res.json({ success: true });

  } catch (error) {
    console.error('Error saving meal plan:', error);
    res.status(500).json({ error: 'Failed to save meal plan' });
  }
});

// Get meal plan history
app.get('/api/meal-plan-history', requireAuth, async (req, res) => {
  try {
    const { days } = req.query; // ?days=30, ?days=60, ?days=90

    let query = `
      SELECT
        id,
        preferences,
        meal_plan,
        stores as "selectedStores",
        shopping_list,
        total_cost,
        created_at as "createdAt"
      FROM meal_plan_history
      WHERE user_id = $1
    `;

    const params = [req.user.id];

    // Filter by days if specified
    if (days) {
      query += ` AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${parseInt(days)} days'`;
    }

    query += ` ORDER BY created_at DESC LIMIT 100`;

    const result = await db.query(query, params);

    res.json({ history: result.rows });

  } catch (error) {
    console.error('Error reading meal plan history:', error);
    res.status(500).json({ error: 'Failed to read history' });
  }
});

// ============================================================================
// PROFILE MANAGEMENT ENDPOINTS
// ============================================================================

// Get full user profile with preferences and stats
app.get('/api/user/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user data
    const userResult = await db.query(
      `SELECT
        id, email, display_name, picture_url, phone_number, timezone,
        meal_plans_generated, bio, created_at, last_login
      FROM users
      WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get user preferences
    const prefsResult = await db.query(
      `SELECT
        default_cuisines, default_people, default_meals, default_days,
        default_dietary, email_notifications, theme, units, language,
        share_favorites, public_profile
      FROM user_preferences
      WHERE user_id = $1`,
      [userId]
    );

    const preferences = prefsResult.rows.length > 0 ? prefsResult.rows[0] : null;

    // Get user stats
    const statsResult = await db.query(
      `SELECT
        (SELECT COUNT(*) FROM favorites WHERE user_id = $1) as favorites_count,
        (SELECT COUNT(*) FROM meal_plan_history WHERE user_id = $1) as meal_plans_count,
        (SELECT MAX(created_at) FROM meal_plan_history WHERE user_id = $1) as last_meal_plan
      `,
      [userId]
    );

    const stats = statsResult.rows[0];

    res.json({
      user,
      preferences,
      stats
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
app.put('/api/user/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { display_name, phone_number, timezone, bio } = req.body;

    const result = await db.query(
      `UPDATE users
       SET display_name = COALESCE($1, display_name),
           phone_number = COALESCE($2, phone_number),
           timezone = COALESCE($3, timezone),
           bio = COALESCE($4, bio),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, email, display_name, picture_url, phone_number, timezone, bio`,
      [display_name, phone_number, timezone, bio, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log activity (non-blocking - don't fail if logging fails)
    try {
      await db.query(
        `SELECT log_user_activity($1, 'profile_updated', $2)`,
        [userId, JSON.stringify({ fields_updated: Object.keys(req.body) })]
      );
    } catch (logError) {
      console.warn('Failed to log profile update activity:', logError.message);
    }

    res.json({ user: result.rows[0] });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user preferences
app.get('/api/user/preferences', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT
        default_cuisines, default_people, default_meals, default_days,
        default_dietary, email_notifications, theme, units, language,
        share_favorites, public_profile
      FROM user_preferences
      WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Create default preferences if they don't exist
      const createResult = await db.query(
        `INSERT INTO user_preferences (user_id)
         VALUES ($1)
         RETURNING *`,
        [userId]
      );
      return res.json({ preferences: createResult.rows[0] });
    }

    res.json({ preferences: result.rows[0] });

  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// Update user preferences
app.put('/api/user/preferences', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      default_cuisines,
      default_people,
      default_meals,
      default_days,
      default_dietary,
      email_notifications,
      theme,
      units,
      language,
      share_favorites,
      public_profile
    } = req.body;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (default_cuisines !== undefined) {
      updates.push(`default_cuisines = $${paramIndex++}`);
      values.push(JSON.stringify(default_cuisines));
    }
    if (default_people !== undefined) {
      updates.push(`default_people = $${paramIndex++}`);
      values.push(default_people);
    }
    if (default_meals !== undefined) {
      updates.push(`default_meals = $${paramIndex++}`);
      values.push(JSON.stringify(default_meals));
    }
    if (default_days !== undefined) {
      updates.push(`default_days = $${paramIndex++}`);
      values.push(JSON.stringify(default_days));
    }
    if (default_dietary !== undefined) {
      updates.push(`default_dietary = $${paramIndex++}`);
      values.push(JSON.stringify(default_dietary));
    }
    if (email_notifications !== undefined) {
      updates.push(`email_notifications = $${paramIndex++}`);
      values.push(JSON.stringify(email_notifications));
    }
    if (theme !== undefined) {
      updates.push(`theme = $${paramIndex++}`);
      values.push(theme);
    }
    if (units !== undefined) {
      updates.push(`units = $${paramIndex++}`);
      values.push(units);
    }
    if (language !== undefined) {
      updates.push(`language = $${paramIndex++}`);
      values.push(language);
    }
    if (share_favorites !== undefined) {
      updates.push(`share_favorites = $${paramIndex++}`);
      values.push(share_favorites);
    }
    if (public_profile !== undefined) {
      updates.push(`public_profile = $${paramIndex++}`);
      values.push(public_profile);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `
      UPDATE user_preferences
      SET ${updates.join(', ')}
      WHERE user_id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Preferences not found' });
    }

    // Log activity (non-blocking - don't fail if logging fails)
    try {
      await db.query(
        `SELECT log_user_activity($1, 'preferences_updated', $2)`,
        [userId, JSON.stringify({ fields_updated: Object.keys(req.body) })]
      );
    } catch (logError) {
      console.warn('Failed to log preferences update activity:', logError.message);
    }

    res.json({ preferences: result.rows[0] });

  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Get user statistics
app.get('/api/user/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT
        (SELECT COUNT(*) FROM favorites WHERE user_id = $1) as favorites_count,
        (SELECT COUNT(*) FROM meal_plan_history WHERE user_id = $1) as total_meal_plans,
        (SELECT MAX(created_at) FROM meal_plan_history WHERE user_id = $1) as last_meal_plan,
        (SELECT COUNT(*) FROM meal_plan_history
         WHERE user_id = $1 AND created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days') as meal_plans_this_month,
        (SELECT created_at FROM users WHERE id = $1) as member_since,
        (SELECT COUNT(DISTINCT activity_type) FROM user_activity WHERE user_id = $1) as activity_types,
        (SELECT COUNT(*) FROM user_activity
         WHERE user_id = $1 AND activity_type = 'login'
         AND created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days') as logins_this_month
      `,
      [userId]
    );

    res.json({ stats: result.rows[0] });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get user activity log
app.get('/api/user/activity', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const result = await db.query(
      `SELECT id, activity_type, activity_data, created_at
       FROM user_activity
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    res.json({ activities: result.rows });

  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// ============================================================================
// ADMIN PANEL ENDPOINTS
// ============================================================================

// Admin authentication middleware
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid admin token' });
  }
}

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_SECRET) {
    const token = jwt.sign(
      { role: 'admin', timestamp: Date.now() },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log('✅ Admin logged in');
    res.json({ success: true, token });
  } else {
    console.log('❌ Failed admin login attempt');
    res.status(401).json({ error: 'Invalid admin password' });
  }
});

// Get all discount codes
app.get('/api/admin/discount-codes', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        id, code, description, discount_type, discount_value,
        active, max_uses, uses_count, valid_from, valid_until,
        created_at, updated_at
      FROM discount_codes
      ORDER BY created_at DESC
    `);

    res.json({ codes: result.rows });
  } catch (error) {
    console.error('Error fetching discount codes:', error);
    res.status(500).json({ error: 'Failed to fetch discount codes' });
  }
});

// Create discount code
app.post('/api/admin/discount-codes', requireAdmin, async (req, res) => {
  try {
    const {
      code,
      description,
      discount_type,
      discount_value,
      max_uses,
      valid_until
    } = req.body;

    // Validation
    if (!code || !discount_type || !discount_value) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['percentage', 'fixed_amount'].includes(discount_type)) {
      return res.status(400).json({ error: 'Invalid discount type' });
    }

    const result = await db.query(`
      INSERT INTO discount_codes (
        code, description, discount_type, discount_value,
        max_uses, valid_until
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      code.toUpperCase(),
      description || null,
      discount_type,
      discount_value,
      max_uses || null,
      valid_until || null
    ]);

    console.log(`✅ Admin created discount code: ${code}`);
    res.json({ success: true, code: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Discount code already exists' });
    }
    console.error('Error creating discount code:', error);
    res.status(500).json({ error: 'Failed to create discount code' });
  }
});

// Update discount code
app.put('/api/admin/discount-codes/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { description, active, max_uses, valid_until } = req.body;

    const result = await db.query(`
      UPDATE discount_codes
      SET
        description = COALESCE($1, description),
        active = COALESCE($2, active),
        max_uses = COALESCE($3, max_uses),
        valid_until = COALESCE($4, valid_until),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [description, active, max_uses, valid_until, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Discount code not found' });
    }

    console.log(`✅ Admin updated discount code: ${result.rows[0].code}`);
    res.json({ success: true, code: result.rows[0] });
  } catch (error) {
    console.error('Error updating discount code:', error);
    res.status(500).json({ error: 'Failed to update discount code' });
  }
});

// Delete discount code
app.delete('/api/admin/discount-codes/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      DELETE FROM discount_codes
      WHERE id = $1
      RETURNING code
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Discount code not found' });
    }

    console.log(`✅ Admin deleted discount code: ${result.rows[0].code}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting discount code:', error);
    res.status(500).json({ error: 'Failed to delete discount code' });
  }
});

// Get app settings
app.get('/api/admin/settings', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT key, value, updated_at
      FROM app_settings
      WHERE key IN ('free_meal_plans_limit', 'test_user_email')
    `);

    const settings = {};
    result.rows.forEach(row => {
      if (row.key === 'free_meal_plans_limit') {
        settings.free_meal_plans_limit = parseInt(row.value);
      } else if (row.key === 'test_user_email') {
        settings.test_user_email = row.value;
      }
    });

    res.json({
      settings: {
        free_meal_plans_limit: settings.free_meal_plans_limit || 10,
        test_user_email: settings.test_user_email || ''
      }
    });
  } catch (error) {
    // Table might not exist yet, return defaults
    res.json({
      settings: {
        free_meal_plans_limit: 10,
        test_user_email: ''
      }
    });
  }
});

// Update app settings
app.put('/api/admin/settings', requireAdmin, async (req, res) => {
  try {
    const { free_meal_plans_limit, test_user_email } = req.body;

    if (free_meal_plans_limit !== undefined) {
      await db.query(`
        INSERT INTO app_settings (key, value)
        VALUES ('free_meal_plans_limit', $1)
        ON CONFLICT (key)
        DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP
      `, [free_meal_plans_limit.toString()]);

      console.log(`✅ Admin updated free meal plans limit: ${free_meal_plans_limit}`);
    }

    if (test_user_email !== undefined) {
      await db.query(`
        INSERT INTO app_settings (key, value)
        VALUES ('test_user_email', $1)
        ON CONFLICT (key)
        DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP
      `, [test_user_email.trim()]);

      console.log(`✅ Admin updated test user email: ${test_user_email || '(cleared)'}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get admin dashboard stats
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as users_this_week,
        (SELECT COUNT(*) FROM meal_plan_history) as total_meal_plans,
        (SELECT COUNT(*) FROM meal_plan_history WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as meal_plans_this_week,
        (SELECT COUNT(*) FROM discount_codes WHERE active = TRUE) as active_discount_codes,
        (SELECT COUNT(*) FROM discount_usage) as total_discount_uses,
        (SELECT COUNT(*) FROM subscriptions WHERE status = 'active' AND plan_type = 'premium') as premium_subscribers
    `);

    res.json({ stats: result.rows[0] });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ============================================================================
// CUISINE AND DIETARY OPTIONS MANAGEMENT
// ============================================================================

// Public endpoint - Get active cuisines (no auth required)
app.get('/api/cuisines', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, display_order
      FROM cuisine_options
      WHERE active = TRUE
      ORDER BY display_order ASC, name ASC
    `);

    res.json({ cuisines: result.rows });
  } catch (error) {
    console.error('Error fetching cuisines:', error);
    // Return empty array if table doesn't exist yet
    res.json({ cuisines: [] });
  }
});

// Public endpoint - Get active dietary options (no auth required)
app.get('/api/dietary-options', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, key, label, display_order
      FROM dietary_options
      WHERE active = TRUE
      ORDER BY display_order ASC, label ASC
    `);

    res.json({ options: result.rows });
  } catch (error) {
    console.error('Error fetching dietary options:', error);
    // Return empty array if table doesn't exist yet
    res.json({ options: [] });
  }
});

// Admin - Get all cuisines (including inactive)
app.get('/api/admin/cuisines', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, display_order, active, created_at, updated_at
      FROM cuisine_options
      ORDER BY display_order ASC, name ASC
    `);

    res.json({ cuisines: result.rows });
  } catch (error) {
    console.error('Error fetching cuisines:', error);
    res.status(500).json({ error: 'Failed to fetch cuisines' });
  }
});

// Admin - Create cuisine
app.post('/api/admin/cuisines', requireAdmin, async (req, res) => {
  try {
    const { name, display_order } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Cuisine name is required' });
    }

    const result = await db.query(`
      INSERT INTO cuisine_options (name, display_order)
      VALUES ($1, $2)
      RETURNING *
    `, [name.trim(), display_order || 0]);

    console.log(`✅ Admin created cuisine: ${name}`);
    res.json({ success: true, cuisine: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Cuisine already exists' });
    }
    console.error('Error creating cuisine:', error);
    res.status(500).json({ error: 'Failed to create cuisine' });
  }
});

// Admin - Update cuisine
app.put('/api/admin/cuisines/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, display_order, active } = req.body;

    const result = await db.query(`
      UPDATE cuisine_options
      SET
        name = COALESCE($1, name),
        display_order = COALESCE($2, display_order),
        active = COALESCE($3, active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [name, display_order, active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cuisine not found' });
    }

    console.log(`✅ Admin updated cuisine: ${result.rows[0].name}`);
    res.json({ success: true, cuisine: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Cuisine name already exists' });
    }
    console.error('Error updating cuisine:', error);
    res.status(500).json({ error: 'Failed to update cuisine' });
  }
});

// Admin - Delete cuisine
app.delete('/api/admin/cuisines/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      DELETE FROM cuisine_options
      WHERE id = $1
      RETURNING name
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cuisine not found' });
    }

    console.log(`✅ Admin deleted cuisine: ${result.rows[0].name}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting cuisine:', error);
    res.status(500).json({ error: 'Failed to delete cuisine' });
  }
});

// Admin - Get all dietary options (including inactive)
app.get('/api/admin/dietary-options', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, key, label, display_order, active, created_at, updated_at
      FROM dietary_options
      ORDER BY display_order ASC, label ASC
    `);

    res.json({ options: result.rows });
  } catch (error) {
    console.error('Error fetching dietary options:', error);
    res.status(500).json({ error: 'Failed to fetch dietary options' });
  }
});

// Admin - Create dietary option
app.post('/api/admin/dietary-options', requireAdmin, async (req, res) => {
  try {
    const { key, label, display_order } = req.body;

    if (!key || !key.trim() || !label || !label.trim()) {
      return res.status(400).json({ error: 'Key and label are required' });
    }

    // Validate key format (lowercase camelCase)
    if (!/^[a-z][a-zA-Z0-9]*$/.test(key)) {
      return res.status(400).json({ error: 'Key must be in camelCase format (e.g., glutenFree)' });
    }

    const result = await db.query(`
      INSERT INTO dietary_options (key, label, display_order)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [key.trim(), label.trim(), display_order || 0]);

    console.log(`✅ Admin created dietary option: ${label} (${key})`);
    res.json({ success: true, option: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Dietary option key already exists' });
    }
    console.error('Error creating dietary option:', error);
    res.status(500).json({ error: 'Failed to create dietary option' });
  }
});

// Admin - Update dietary option
app.put('/api/admin/dietary-options/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { label, display_order, active } = req.body;

    const result = await db.query(`
      UPDATE dietary_options
      SET
        label = COALESCE($1, label),
        display_order = COALESCE($2, display_order),
        active = COALESCE($3, active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [label, display_order, active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dietary option not found' });
    }

    console.log(`✅ Admin updated dietary option: ${result.rows[0].label}`);
    res.json({ success: true, option: result.rows[0] });
  } catch (error) {
    console.error('Error updating dietary option:', error);
    res.status(500).json({ error: 'Failed to update dietary option' });
  }
});

// Admin - Delete dietary option
app.delete('/api/admin/dietary-options/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      DELETE FROM dietary_options
      WHERE id = $1
      RETURNING label
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dietary option not found' });
    }

    console.log(`✅ Admin deleted dietary option: ${result.rows[0].label}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting dietary option:', error);
    res.status(500).json({ error: 'Failed to delete dietary option' });
  }
});

// ============================================================================
// MEAL OF THE DAY ENDPOINTS
// ============================================================================

// Public endpoint - Get current/latest meal of the day
app.get('/api/meal-of-the-day', async (req, res) => {
  try {
    const { date } = req.query;

    let query = `
      SELECT
        id, title, description, meal_type, cuisine, prep_time, cook_time,
        servings, ingredients, instructions, image_url, nutrition_info, tags,
        featured_date, view_count, share_count, published_at
      FROM meal_of_the_day
      WHERE active = TRUE
    `;

    const params = [];

    if (date) {
      query += ` AND featured_date = $1`;
      params.push(date);
    } else {
      query += ` AND featured_date <= CURRENT_DATE`;
    }

    query += ` ORDER BY featured_date DESC LIMIT 1`;

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.json({ meal: null });
    }

    // Increment view count
    await db.query(
      `UPDATE meal_of_the_day SET view_count = view_count + 1 WHERE id = $1`,
      [result.rows[0].id]
    );

    res.json({ meal: result.rows[0] });
  } catch (error) {
    console.error('Error fetching meal of the day:', error);
    res.json({ meal: null });
  }
});

// Public endpoint - Track social media share
app.post('/api/meal-of-the-day/:id/share', async (req, res) => {
  try {
    const { id } = req.params;
    const { platform } = req.body;

    if (!platform) {
      return res.status(400).json({ error: 'Platform is required' });
    }

    // Get user ID if authenticated
    let userId = null;
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        userId = decoded.id;
      }
    }

    // Track the share
    await db.query(`
      INSERT INTO meal_of_day_shares (meal_id, platform, user_id)
      VALUES ($1, $2, $3)
    `, [id, platform, userId]);

    // Increment share count
    await db.query(
      `UPDATE meal_of_the_day SET share_count = share_count + 1 WHERE id = $1`,
      [id]
    );

    console.log(`📤 Meal ${id} shared on ${platform}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking share:', error);
    res.status(500).json({ error: 'Failed to track share' });
  }
});

// Public endpoint - Get meal of the day by ID (for adding to plan)
app.get('/api/meal-of-the-day/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT
        id, title, description, meal_type, cuisine, prep_time, cook_time,
        servings, ingredients, instructions, image_url, nutrition_info, tags,
        featured_date
      FROM meal_of_the_day
      WHERE id = $1 AND active = TRUE
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    res.json({ meal: result.rows[0] });
  } catch (error) {
    console.error('Error fetching meal:', error);
    res.status(500).json({ error: 'Failed to fetch meal' });
  }
});

// Admin - Get all meals of the day
app.get('/api/admin/meal-of-the-day', requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const result = await db.query(`
      SELECT
        id, title, description, meal_type, cuisine, prep_time, cook_time,
        servings, ingredients, instructions, image_url, nutrition_info, tags,
        featured_date, active, view_count, share_count, created_by,
        created_at, updated_at, published_at
      FROM meal_of_the_day
      ORDER BY featured_date DESC
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), parseInt(offset)]);

    res.json({ meals: result.rows });
  } catch (error) {
    console.error('Error fetching meals:', error);
    res.status(500).json({ error: 'Failed to fetch meals' });
  }
});

// Admin - Create meal of the day
app.post('/api/admin/meal-of-the-day', requireAdmin, async (req, res) => {
  try {
    console.log('🔵 Creating meal of the day, admin:', req.admin);
    console.log('🔵 Request body:', req.body);

    const {
      title,
      description,
      meal_type,
      cuisine,
      prep_time,
      cook_time,
      servings,
      ingredients,
      instructions,
      image_url,
      nutrition_info,
      tags,
      featured_date,
      active = true
    } = req.body;

    console.log('🔵 Extracted data - title:', title, 'ingredients:', ingredients?.length, 'instructions:', instructions?.length);

    // Validation
    if (!title || !ingredients || !instructions) {
      console.log('🔴 Validation failed');
      return res.status(400).json({ error: 'Title, ingredients, and instructions are required' });
    }

    // If active and featured_date is set, deactivate any other meal for that date
    if (active && featured_date) {
      console.log('🔵 Deactivating other meals for date:', featured_date);
      await db.query(`
        UPDATE meal_of_the_day
        SET active = FALSE
        WHERE featured_date = $1 AND active = TRUE
      `, [featured_date]);
    }

    console.log('🔵 Inserting meal into database...');
    const result = await db.query(`
      INSERT INTO meal_of_the_day (
        title, description, meal_type, cuisine, prep_time, cook_time,
        servings, ingredients, instructions, image_url, nutrition_info,
        tags, featured_date, active, created_by, published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
      title,
      description || null,
      meal_type || null,
      cuisine || null,
      prep_time || null,
      cook_time || null,
      servings || 2,
      JSON.stringify(ingredients),
      JSON.stringify(instructions),
      image_url || null,
      nutrition_info ? JSON.stringify(nutrition_info) : null,
      tags ? JSON.stringify(tags) : '[]',
      featured_date || new Date().toISOString().split('T')[0],
      active,
      req.admin?.role || 'admin', // Safely access role with fallback
      active ? new Date() : null
    ]);

    console.log(`✅ Admin created meal of the day: ${title}`);
    res.json({ success: true, meal: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      console.error('🔴 Unique constraint violation:', error.message);
      return res.status(400).json({ error: 'A meal is already active for this date' });
    }
    console.error('🔴 Error creating meal - Full error:', error);
    console.error('🔴 Error code:', error.code);
    console.error('🔴 Error message:', error.message);
    console.error('🔴 Error detail:', error.detail);
    res.status(500).json({
      error: 'Failed to create meal',
      details: error.message,
      code: error.code
    });
  }
});

// Admin - Update meal of the day
app.put('/api/admin/meal-of-the-day/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      meal_type,
      cuisine,
      prep_time,
      cook_time,
      servings,
      ingredients,
      instructions,
      image_url,
      nutrition_info,
      tags,
      featured_date,
      active
    } = req.body;

    // If activating and featured_date is changing, deactivate others for that date
    if (active && featured_date) {
      await db.query(`
        UPDATE meal_of_the_day
        SET active = FALSE
        WHERE featured_date = $1 AND active = TRUE AND id != $2
      `, [featured_date, id]);
    }

    const result = await db.query(`
      UPDATE meal_of_the_day
      SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        meal_type = COALESCE($3, meal_type),
        cuisine = COALESCE($4, cuisine),
        prep_time = COALESCE($5, prep_time),
        cook_time = COALESCE($6, cook_time),
        servings = COALESCE($7, servings),
        ingredients = COALESCE($8, ingredients),
        instructions = COALESCE($9, instructions),
        image_url = COALESCE($10, image_url),
        nutrition_info = COALESCE($11, nutrition_info),
        tags = COALESCE($12, tags),
        featured_date = COALESCE($13, featured_date),
        active = COALESCE($14, active),
        published_at = CASE WHEN $14 = TRUE AND published_at IS NULL THEN CURRENT_TIMESTAMP ELSE published_at END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *
    `, [
      title,
      description,
      meal_type,
      cuisine,
      prep_time,
      cook_time,
      servings,
      ingredients ? JSON.stringify(ingredients) : null,
      instructions ? JSON.stringify(instructions) : null,
      image_url,
      nutrition_info ? JSON.stringify(nutrition_info) : null,
      tags ? JSON.stringify(tags) : null,
      featured_date,
      active,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    console.log(`✅ Admin updated meal: ${result.rows[0].title}`);
    res.json({ success: true, meal: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'A meal is already active for this date' });
    }
    console.error('Error updating meal:', error);
    res.status(500).json({ error: 'Failed to update meal' });
  }
});

// Admin - Delete meal of the day
app.delete('/api/admin/meal-of-the-day/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      DELETE FROM meal_of_the_day
      WHERE id = $1
      RETURNING title
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    console.log(`✅ Admin deleted meal: ${result.rows[0].title}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting meal:', error);
    res.status(500).json({ error: 'Failed to delete meal' });
  }
});

// Admin - Get meal of the day statistics
app.get('/api/admin/meal-of-the-day/stats', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        COUNT(*) as total_meals,
        SUM(view_count) as total_views,
        SUM(share_count) as total_shares,
        COUNT(CASE WHEN active = TRUE THEN 1 END) as active_meals,
        (SELECT COUNT(DISTINCT platform) FROM meal_of_day_shares) as platforms_used,
        (SELECT platform FROM meal_of_day_shares GROUP BY platform ORDER BY COUNT(*) DESC LIMIT 1) as most_used_platform
      FROM meal_of_the_day
    `);

    res.json({ stats: result.rows[0] });
  } catch (error) {
    console.error('Error fetching meal stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Admin - Generate meal of the day with AI
app.post('/api/admin/meal-of-the-day/generate-ai', requireAdmin, async (req, res) => {
  try {
    const { preferences } = req.body;
    console.log('🤖 Generating meal with AI...');

    // Generate meal details with GPT
    const mealPrompt = `Create a unique, delicious, and persuasive meal recipe. Make it sound irresistible!

${preferences?.cuisine ? `Cuisine: ${preferences.cuisine}` : 'Choose any popular cuisine'}
${preferences?.mealType ? `Meal type: ${preferences.mealType}` : 'Meal type: dinner'}

Return a JSON object with:
- title: A compelling, mouthwatering meal name (make it sound amazing!)
- description: A persuasive 2-3 sentence description that makes people want to try this meal
- cuisine: The cuisine type
- meal_type: breakfast, lunch, dinner, or snack
- prep_time: Realistic prep time (e.g., "15 mins")
- cook_time: Realistic cook time (e.g., "30 mins")
- servings: Number of servings (2-6)
- ingredients: Array of ingredient strings with measurements (e.g., ["2 cups flour", "1 tsp salt"])
- instructions: Array of step-by-step cooking instructions (at least 5 steps)
- tags: Array of 3-5 descriptive tags (e.g., ["quick", "healthy", "family-friendly"])

Make the meal sound amazing and ensure the recipe is complete and realistic!`;

    const mealCompletion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a professional chef and food writer who creates irresistible recipes. Always return valid JSON only, no markdown formatting.'
        },
        { role: 'user', content: mealPrompt }
      ],
      temperature: 0.8,
      max_tokens: 2000
    });

    let mealData;
    try {
      const content = mealCompletion.choices[0].message.content.trim();
      // Remove markdown code blocks if present
      const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      mealData = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Error parsing GPT response:', parseError);
      console.log('Raw response:', mealCompletion.choices[0].message.content);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    console.log(`📝 Generated meal: ${mealData.title}`);

    // Generate image with DALL-E
    console.log('🎨 Generating meal image with DALL-E...');

    const imagePrompt = `Professional food photography of ${mealData.title}.
${mealData.description}
The dish should look appetizing, well-plated, and restaurant-quality.
Natural lighting, beautiful presentation, high-quality photo.`;

    const imageResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard'
    });

    const imageUrl = imageResponse.data[0].url;
    console.log('✅ Image generated successfully');

    // Get app URL for the call-to-action link
    const appUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : (process.env.NODE_ENV === 'production'
        ? 'https://your-app.vercel.app'
        : 'http://localhost:3000');

    // Return generated meal data
    res.json({
      meal: {
        ...mealData,
        image_url: imageUrl,
        app_link: `${appUrl}/meal-of-the-day`,
        featured_date: new Date().toISOString().split('T')[0],
        active: false // Don't auto-publish, let admin review first
      }
    });

    console.log('✅ AI meal generation complete');
  } catch (error) {
    console.error('Error generating meal with AI:', error);
    if (error.response) {
      console.error('OpenAI API error:', error.response.data);
    }
    res.status(500).json({
      error: 'Failed to generate meal with AI',
      details: error.message
    });
  }
});

// Initialize database tables on startup
async function initializeDatabase() {
  try {
    console.log('🔍 Checking database schema...');

    // Check if favorites table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'favorites'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('📋 Creating favorites table...');

      await db.query(`
        CREATE TABLE favorites (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
          meal_data JSONB NOT NULL,
          meal_name VARCHAR(255) NOT NULL,
          servings_adjustment INTEGER,
          user_notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, meal_name, meal_type)
        );

        CREATE INDEX idx_favorites_user_id ON favorites(user_id);
        CREATE INDEX idx_favorites_meal_type ON favorites(meal_type);
        CREATE INDEX idx_favorites_meal_name ON favorites(meal_name);
      `);

      console.log('✅ Favorites table created successfully');
    } else {
      console.log('✅ Favorites table already exists');
    }

    // Check if shopping_list_states table exists
    const shoppingListTableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'shopping_list_states'
      );
    `);

    if (!shoppingListTableCheck.rows[0].exists) {
      console.log('📋 Creating shopping_list_states table...');

      await db.query(`
        CREATE TABLE shopping_list_states (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          meal_plan_date DATE NOT NULL DEFAULT CURRENT_DATE,
          checked_items JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, meal_plan_date)
        );

        CREATE INDEX idx_shopping_list_states_user_id ON shopping_list_states(user_id);
        CREATE INDEX idx_shopping_list_states_date ON shopping_list_states(meal_plan_date);
      `);

      console.log('✅ Shopping list states table created successfully');
    } else {
      console.log('✅ Shopping list states table already exists');
    }

  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    // Don't crash the server - continue even if this fails
  }
}

const port = PORT || 5000;
app.listen(port, async () => {
  console.log(`server listening on port ${port}`);
  await initializeDatabase();
});