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
    const { zipCode, primaryStore, comparisonStore, selectedMeals, selectedDays, dietaryPreferences, leftovers, ...preferences } = req.body;

    console.log(`Generating meal plan for user: ${req.user.email}`);
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

    const shoppingListRequirement = `${requirementNumber++}. Create a consolidated shopping list organized by category\n`;
    const storeRequirement = `${requirementNumber++}. All items should be commonly available at the selected store(s)\n`;
    const timeRequirement = `${requirementNumber++}. Include prep time, cooking time, servings, and estimated cost for each meal\n`;
    const instructionsRequirement = `${requirementNumber++}. Provide simple, clear cooking instructions\n`;

    const comparisonRequirement = comparisonStore
      ? `${requirementNumber++}. **CRITICAL**: For EVERY item in the shopping list, provide estimated prices at BOTH stores (primaryStorePrice and comparisonStorePrice)\n${requirementNumber++}. Calculate total estimated costs for both stores and show potential savings\n`
      : '';

    // Create example meal structure for the prompt
    const mealStructureExample = mealTypes.map(mealType =>
      `      "${mealType}": { "name": "...", "prepTime": "...", "cookTime": "...", "servings": ${preferences.people || 2}, "estimatedCost": "$X-Y", "ingredients": [...], "instructions": [...] }`
    ).join(',\n');

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

**IMPORTANT Requirements:**
1. Create a meal plan for these days: ${daysOfWeek.join(', ')} with ONLY these meal types: ${mealTypes.join(', ')}
2. DO NOT include meal types that were not selected
3. DO NOT include days that were not selected
${leftoverRequirement}${cuisineRequirement}${dietaryRequirement}${shoppingListRequirement}${storeRequirement}${timeRequirement}${instructionsRequirement}${comparisonRequirement}

**Response Format:**
Return ONLY valid JSON in this exact format:
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
    const { mealType, cuisines, people, groceryStore, currentMeal, dietaryPreferences } = req.body;

    console.log(`Regenerating ${mealType} for user: ${req.user.email}`);
    console.log(`Current meal: ${currentMeal}`);
    console.log(`Store: ${groceryStore?.name}`);
    console.log(`Dietary preferences: ${dietaryPreferences?.join(', ') || 'None'}`);

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
- Cuisine preferences: ${cuisines?.join(', ') || 'Any'}
- Grocery Store: ${groceryStore?.name || 'Local grocery store'}
- Store Type: ${groceryStore?.type || 'Conventional'}
${dietaryRestrictionsText}

**Requirements:**
1. Create a DIFFERENT meal than: "${currentMeal}"
2. Make it appropriate for ${mealType}
${dietaryPreferences && dietaryPreferences.length > 0 ? `3. **CRITICAL**: This recipe MUST comply with these dietary restrictions: ${dietaryPreferences.map(formatDietaryPreference).join('; ')}. Do not use any ingredients that violate these restrictions.
4. Include prep time and cooking time` : '3. Include prep time and cooking time'}
${dietaryPreferences && dietaryPreferences.length > 0 ? '5' : '4'}. Include servings count (for ${people || 2} people)
${dietaryPreferences && dietaryPreferences.length > 0 ? '6' : '5'}. List all ingredients with quantities
${dietaryPreferences && dietaryPreferences.length > 0 ? '7' : '6'}. Provide clear, step-by-step cooking instructions
${dietaryPreferences && dietaryPreferences.length > 0 ? '8' : '7'}. Estimate the cost
${dietaryPreferences && dietaryPreferences.length > 0 ? '9' : '8'}. All ingredients should be commonly available at ${groceryStore?.name || 'the selected store'}

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

// Custom item prices endpoint
app.post('/api/custom-item-prices', requireAuth, async (req, res) => {
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

// Helper function to get user's favorites file path
const getFavoritesFilePath = (userEmail) => {
  const fs = require('fs');
  const path = require('path');
  const favoritesDir = path.join(__dirname, 'user-data', 'favorites');

  // Create directory if it doesn't exist
  if (!fs.existsSync(favoritesDir)) {
    fs.mkdirSync(favoritesDir, { recursive: true });
  }

  // Use email hash for filename (for privacy/security)
  const crypto = require('crypto');
  const emailHash = crypto.createHash('md5').update(userEmail).digest('hex');
  return path.join(favoritesDir, `${emailHash}.json`);
};

// Helper function to get user's history file path
const getHistoryFilePath = (userEmail) => {
  const fs = require('fs');
  const path = require('path');
  const historyDir = path.join(__dirname, 'user-data', 'history');

  // Create directory if it doesn't exist
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }

  const crypto = require('crypto');
  const emailHash = crypto.createHash('md5').update(userEmail).digest('hex');
  return path.join(historyDir, `${emailHash}.json`);
};

// Add meal to favorites
app.post('/api/favorites/add', requireAuth, (req, res) => {
  try {
    const { meal, mealType } = req.body;
    const fs = require('fs');

    if (!meal || !meal.name) {
      return res.status(400).json({ error: 'Invalid meal data' });
    }

    const filePath = getFavoritesFilePath(req.user.email);

    // Read existing favorites
    let favorites = [];
    if (fs.existsSync(filePath)) {
      favorites = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    // Add new favorite with metadata
    const favorite = {
      id: Date.now().toString(),
      meal,
      mealType: mealType || 'unknown',
      savedAt: new Date().toISOString(),
      savedDate: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
    };

    favorites.push(favorite);

    // Save back to file
    fs.writeFileSync(filePath, JSON.stringify(favorites, null, 2));

    console.log(`❤️ ${req.user.email} saved favorite: ${meal.name}`);
    res.json({ success: true, favorite });

  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// Get user's favorites
app.get('/api/favorites', requireAuth, (req, res) => {
  try {
    const fs = require('fs');
    const filePath = getFavoritesFilePath(req.user.email);

    if (!fs.existsSync(filePath)) {
      return res.json({ favorites: [] });
    }

    const favorites = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json({ favorites });

  } catch (error) {
    console.error('Error reading favorites:', error);
    res.status(500).json({ error: 'Failed to read favorites' });
  }
});

// Remove favorite
app.delete('/api/favorites/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const fs = require('fs');
    const filePath = getFavoritesFilePath(req.user.email);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'No favorites found' });
    }

    let favorites = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    favorites = favorites.filter(fav => fav.id !== id);

    fs.writeFileSync(filePath, JSON.stringify(favorites, null, 2));

    console.log(`🗑️ ${req.user.email} removed favorite: ${id}`);
    res.json({ success: true });

  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

// Save meal plan to history
app.post('/api/save-meal-plan', requireAuth, (req, res) => {
  try {
    const { mealPlan, preferences, selectedStores } = req.body;
    const fs = require('fs');

    if (!mealPlan) {
      return res.status(400).json({ error: 'No meal plan provided' });
    }

    const filePath = getHistoryFilePath(req.user.email);

    // Read existing history
    let history = [];
    if (fs.existsSync(filePath)) {
      history = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    // Add new history entry
    const historyEntry = {
      id: Date.now().toString(),
      mealPlan,
      preferences,
      selectedStores,
      createdAt: new Date().toISOString(),
      createdDate: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
    };

    history.unshift(historyEntry); // Add to beginning

    // Keep only last 100 entries
    if (history.length > 100) {
      history = history.slice(0, 100);
    }

    fs.writeFileSync(filePath, JSON.stringify(history, null, 2));

    console.log(`📝 Saved meal plan to history for ${req.user.email}`);
    res.json({ success: true });

  } catch (error) {
    console.error('Error saving meal plan:', error);
    res.status(500).json({ error: 'Failed to save meal plan' });
  }
});

// Get meal plan history
app.get('/api/meal-plan-history', requireAuth, (req, res) => {
  try {
    const { days } = req.query; // ?days=30, ?days=60, ?days=90
    const fs = require('fs');
    const filePath = getHistoryFilePath(req.user.email);

    if (!fs.existsSync(filePath)) {
      return res.json({ history: [] });
    }

    let history = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Filter by days if specified
    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

      history = history.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        return entryDate >= cutoffDate;
      });
    }

    res.json({ history });

  } catch (error) {
    console.error('Error reading meal plan history:', error);
    res.status(500).json({ error: 'Failed to read history' });
  }
});

const port = PORT || 5000;
app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});