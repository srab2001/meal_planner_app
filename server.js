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
  OPENAI_API_KEY,
  STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY
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

// Meal plan generation endpoint
app.post('/api/generate-meals', requireAuth, async (req, res) => {
  try {
    const { zipCode, groceryStore, selectedMeals, ...preferences } = req.body;

    console.log(`Generating meal plan for user: ${req.user.email}`);
    console.log(`Store: ${groceryStore?.name}, ZIP: ${zipCode}`);
    console.log(`Selected meals: ${selectedMeals?.join(', ')}`);

    // Build meal type list based on user selection
    const mealTypes = selectedMeals && selectedMeals.length > 0
      ? selectedMeals
      : ['breakfast', 'lunch', 'dinner'];

    // Create example meal structure for the prompt
    const mealStructureExample = mealTypes.map(mealType =>
      `      "${mealType}": { "name": "...", "prepTime": "...", "cookTime": "...", "servings": ${preferences.people || 2}, "estimatedCost": "$X-Y", "ingredients": [...], "instructions": [...] }`
    ).join(',\n');

    // Build a comprehensive prompt for meal planning
    const prompt = `You are a professional meal planner. Create a personalized weekly meal plan based on these preferences:

**User Information:**
- Name: ${req.user.full_name || 'User'}
- Email: ${req.user.email}

**Location & Store:**
- ZIP Code: ${zipCode}
- Selected Grocery Store: ${groceryStore?.name || 'Local grocery store'}
- Store Type: ${groceryStore?.type || 'Conventional'}

**Preferences:**
- Cuisines: ${preferences.cuisines?.join(', ') || 'Any'}
- Number of people: ${preferences.people || 2}
- Meals needed: ${mealTypes.join(', ')}

**IMPORTANT Requirements:**
1. Create a 7-day meal plan with ONLY these meal types: ${mealTypes.join(', ')}
2. DO NOT include meal types that were not selected
3. Include recipes that match the user's cuisine preferences
4. Create a consolidated shopping list organized by category
5. All items should be commonly available at ${groceryStore?.name || 'the selected store'}
6. Include prep time, cooking time, servings, and estimated cost for each meal
7. Provide simple, clear cooking instructions

**Response Format:**
Return ONLY valid JSON in this exact format:
{
  "mealPlan": {
    "Monday": {
${mealStructureExample}
    },
    "Tuesday": {
${mealStructureExample}
    },
    ... (continue for all 7 days: Monday through Sunday)
  },
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
    ],
    "Pantry Staples": [
      { "item": "Olive oil", "quantity": "1 bottle", "estimatedPrice": "$7.99" }
    ],
    "Other": []
  },
  "totalEstimatedCost": "$150-200",
  "summary": {
    "totalMeals": ${mealTypes.length * 7},
    "estimatedCost": "$150-200",
    "prepTimeTotal": "~5 hours",
    "dietaryNotes": "..."
  }
}`;

    console.log('Calling OpenAI to generate meal plan...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert meal planner and nutritionist. Create detailed, practical meal plans with realistic recipes. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 4000,
    });

    let responseText = completion.choices[0].message.content.trim();

    // Clean up response - remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const mealPlanData = JSON.parse(responseText);

    console.log('Meal plan generated successfully');

    res.json(mealPlanData);

  } catch (error) {
    console.error('Error generating meal plan:', error);
    res.status(500).json({
      error: 'Failed to generate meal plan',
      details: error.message
    });
  }
});

// Single meal regeneration endpoint
app.post('/api/regenerate-meal', requireAuth, async (req, res) => {
  try {
    const { mealType, cuisines, people, groceryStore, currentMeal } = req.body;

    console.log(`Regenerating ${mealType} for user: ${req.user.email}`);
    console.log(`Current meal: ${currentMeal}`);
    console.log(`Store: ${groceryStore?.name}`);

    // Build a prompt for regenerating a single meal
    const prompt = `You are a professional chef and meal planner. Generate ONE new ${mealType} recipe based on these preferences:

**User Information:**
- Name: ${req.user.full_name || 'User'}
- Cooking for: ${people || 2} people

**Preferences:**
- Cuisine preferences: ${cuisines?.join(', ') || 'Any'}
- Grocery Store: ${groceryStore?.name || 'Local grocery store'}
- Store Type: ${groceryStore?.type || 'Conventional'}

**Requirements:**
1. Create a DIFFERENT meal than: "${currentMeal}"
2. Make it appropriate for ${mealType}
3. Include prep time and cooking time
4. Include servings count (for ${people || 2} people)
5. List all ingredients with quantities
6. Provide clear, step-by-step cooking instructions
7. Estimate the cost
8. All ingredients should be commonly available at ${groceryStore?.name || 'the selected store'}

**Response Format:**
Return ONLY valid JSON in this exact format:
{
  "name": "Recipe Name",
  "prepTime": "10 mins",
  "cookTime": "20 mins",
  "servings": ${people || 2},
  "estimatedCost": "$8-12",
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

// Discount codes configuration
// Add or modify codes as needed
const DISCOUNT_CODES = {
  'TESTFREE': { percentOff: 100, description: 'Free access for testers' },
  'BETA50': { percentOff: 50, description: '50% off for beta testers' },
  'WELCOME25': { percentOff: 25, description: '25% off welcome discount' },
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
      console.log(`✅ Valid discount code applied: ${normalizedCode} (${discount.percentOff}% off)`);
      res.json({
        valid: true,
        code: normalizedCode,
        percentOff: discount.percentOff,
        description: discount.description
      });
    } else {
      console.log(`❌ Invalid discount code attempted: ${normalizedCode}`);
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
  console.log(`Payment status check for ${req.user.email}: ${hasPaidAccess ? 'PAID' : 'UNPAID'}`);
  res.json({ hasPaidAccess });
});

const port = PORT || 5000;
app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});