const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const OpenAI = require('openai');
require('dotenv').config();

// Phase 1-3: Price Scraping System
const priceCache = require('./scrapers/price-cache');
const HarrisTeeterScraper = require('./scrapers/harris-teeter-scraper');

function getScraper(storeName) {
  const storeNameLower = storeName.toLowerCase();
  if (storeNameLower.includes('harris') && storeNameLower.includes('teeter')) {
    return new HarrisTeeterScraper();
  }
  return new HarrisTeeterScraper();
}

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Passport Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:5000/auth/google/callback'
  },
  (accessToken, refreshToken, profile, done) => {
    const user = {
      id: profile.id,
      email: profile.emails[0].value,
      displayName: profile.displayName,
      picture: profile.photos[0].value
    };
    return done(null, user);
  }
));

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

// ============================================
// AUTHENTICATION ROUTES
// ============================================

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://localhost:3000' }),
  (req, res) => {
    console.log('✅ User authenticated:', req.user.displayName);
    res.redirect('http://localhost:3000');
  }
);

app.get('/auth/user', (req, res) => {
  if (req.isAuthenticated()) {
    console.log('📋 User info requested:', req.user.displayName);
    res.json({ user: req.user });
  } else {
    console.log('❌ No authenticated user');
    res.json({ user: null });
  }
});

app.get('/auth/logout', (req, res) => {
  const userName = req.user ? req.user.displayName : 'Unknown';
  req.logout((err) => {
    if (err) {
      console.error('❌ Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    console.log('👋 User logged out:', userName);
    res.redirect('http://localhost:3000');
  });
});

// ============================================
// PHASE 1: Store Finder Endpoint
// ============================================
app.post('/api/find-stores', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { zipCode } = req.body;

    if (!zipCode || !/^\d{5}(-\d{4})?$/.test(zipCode)) {
      return res.status(400).json({ error: 'Invalid ZIP code' });
    }

    console.log('🔵 Finding stores for ZIP:', zipCode);

    const prompt = `Given the ZIP code ${zipCode}, list major grocery stores commonly found in this area of the United States.

For each store, provide:
- name: Official store name
- type: "Organic", "Discount", "Conventional", or "Specialty"
- typical_distance: Realistic range like "1-3 miles"

List 6-8 major chains realistic for this area.

Return ONLY valid JSON (no markdown):
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that provides grocery store information. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    let responseText = completion.choices[0].message.content.trim();
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const storeData = JSON.parse(responseText);
    console.log('✅ Found', storeData.stores.length, 'stores');
    res.json(storeData);

  } catch (error) {
    console.error('❌ Error finding stores:', error);
    res.status(500).json({ error: 'Failed to find stores' });
  }
});

// ============================================
// PHASE 2: Price Scraping Endpoint
// ============================================
app.post('/api/scrape-store-prices', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { storeName, zipCode } = req.body;

    if (!storeName || !zipCode) {
      return res.status(400).json({ error: 'Store name and ZIP code required' });
    }

    if (priceCache.has(storeName, zipCode)) {
      const cachedData = priceCache.get(storeName, zipCode);
      console.log(`✅ Returning cached prices for ${storeName} (${zipCode})`);
      return res.json({
        ...cachedData,
        fromCache: true
      });
    }

    console.log(`🔵 Scraping prices for ${storeName} (${zipCode})`);
    const scraper = getScraper(storeName);
    const items = await scraper.scrape(zipCode);

    const response = {
      store: storeName,
      zipCode,
      items,
      itemCount: items.length,
      scrapedAt: new Date().toISOString(),
      fromCache: false
    };

    priceCache.set(storeName, zipCode, response);
    res.json(response);

  } catch (error) {
    console.error('❌ Error scraping prices:', error);
    res.status(500).json({ error: 'Failed to scrape prices' });
  }
});

// ============================================
// PHASE 3: Generate Meal Plan Endpoint
// ============================================
app.post('/api/generate-meals', async (req, res) => {
  console.log('\n========================================');
  console.log('🔵 MEAL GENERATION REQUEST RECEIVED');
  console.log('Time:', new Date().toISOString());
  console.log('User authenticated:', req.isAuthenticated());
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('========================================\n');

  try {
    if (!req.isAuthenticated()) {
      console.log('❌ User not authenticated');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { cuisines, people, meals, zipCode, groceryStore } = req.body;
    
    console.log('🔵 Building prompt...');
    
    const prompt = `Generate a 7-day meal plan with detailed recipes.

Preferences:
- Cuisines: ${cuisines?.join(', ') || 'Any'}
- People: ${people || 2}
- Meals per day: ${meals || 3}
${groceryStore ? `- Store: ${groceryStore.name}` : ''}

CRITICAL: Return valid JSON only. Use double quotes, escape special chars.

Recipe Format:
- Ingredients: Include quantities (e.g. "2 cups flour", "1 lb chicken")
- Instructions: 5-6 clear steps

Example:
{
  "mealPlan": {
    "Monday": { 
      "breakfast": {
        "name": "Scrambled Eggs with Toast",
        "prepTime": "5 mins",
        "cookTime": "10 mins",
        "servings": ${people || 2},
        "ingredients": ["4 large eggs", "2 tbsp butter", "1/4 cup milk", "Salt to taste", "2 bread slices"],
        "instructions": ["Whisk eggs with milk and salt", "Heat butter in pan over medium heat", "Pour eggs into pan", "Stir gently as eggs set", "Cook until softly set", "Serve with toasted bread"],
        "estimatedCost": "$4"
      },
      "lunch": {"name": "...", "prepTime": "...", "cookTime": "...", "servings": ${people || 2}, "ingredients": ["..."], "instructions": ["..."], "estimatedCost": "$..."},
      "dinner": {"name": "...", "prepTime": "...", "cookTime": "...", "servings": ${people || 2}, "ingredients": ["..."], "instructions": ["..."], "estimatedCost": "$..."}
    },
    "Tuesday": {"breakfast": {...}, "lunch": {...}, "dinner": {...}},
    "Wednesday": {"breakfast": {...}, "lunch": {...}, "dinner": {...}},
    "Thursday": {"breakfast": {...}, "lunch": {...}, "dinner": {...}},
    "Friday": {"breakfast": {...}, "lunch": {...}, "dinner": {...}},
    "Saturday": {"breakfast": {...}, "lunch": {...}, "dinner": {...}},
    "Sunday": {"breakfast": {...}, "lunch": {...}, "dinner": {...}}
  },
  "shoppingList": {
    "Produce": [{"item": "Tomatoes", "quantity": "3 lbs", "estimatedPrice": "$5"}],
    "Meat & Seafood": [{"item": "Chicken", "quantity": "2 lbs", "estimatedPrice": "$9"}],
    "Dairy": [{"item": "Milk", "quantity": "1 gallon", "estimatedPrice": "$4"}],
    "Pantry": [{"item": "Flour", "quantity": "5 lbs", "estimatedPrice": "$4"}],
    "Other": []
  },
  "totalEstimatedCost": "$120"
}

All 7 days required. Use proper JSON formatting.`;

    console.log('🔵 Calling OpenAI API...');
    const startTime = Date.now();
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a professional meal planner and chef. Return only valid JSON with detailed, practical recipes that include specific ingredient quantities and clear cooking instructions.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 16000
    });
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ OpenAI responded in ${elapsed}s`);
    console.log('🔵 Finish reason:', completion.choices[0].finish_reason);
    
    if (completion.choices[0].finish_reason === 'length') {
      throw new Error('Response cut off - recipes too detailed');
    }
    
    let responseText = completion.choices[0].message.content.trim();
    console.log('🔵 Response length:', responseText.length, 'chars');
    
    responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }
    
    console.log('🔵 Parsing JSON...');
    
    let mealData;
    try {
      mealData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Parse error:', parseError.message);
      const pos = parseInt(parseError.message.match(/position (\d+)/)?.[1] || 0);
      console.error('Problem area:', responseText.substring(Math.max(0, pos - 200), pos + 200));
      throw new Error('Invalid JSON from AI. Try again.');
    }
    
    console.log('✅ Parsed successfully');
    console.log('Days:', Object.keys(mealData.mealPlan || {}).length);
    
    res.json(mealData);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate meal plan',
      details: error.message 
    });
  }
});

// ============================================
// Regenerate Single Meal Endpoint
// ============================================
app.post('/api/regenerate-meal', async (req, res) => {
  console.log('\n========================================');
  console.log('🔄 REGENERATE MEAL REQUEST');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('========================================\n');

  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { cuisines, people, mealType, groceryStore, currentMeal } = req.body;
    
    const prompt = `Generate ONE replacement ${mealType} meal.

Requirements:
- Cuisines: ${cuisines?.join(', ') || 'Any'}
- People: ${people || 2}
- Different from: "${currentMeal}"
${groceryStore ? `- Store: ${groceryStore.name}` : ''}

Include quantities and detailed steps.

Return ONLY this JSON (no markdown):
{
  "meal": {
    "name": "Meal Name",
    "prepTime": "10 mins",
    "cookTime": "20 mins",
    "servings": ${people || 2},
    "ingredients": ["2 cups flour", "1 lb chicken", "..."],
    "instructions": ["Step 1", "Step 2", "..."],
    "estimatedCost": "$12"
  }
}`;

    console.log('🔵 Calling OpenAI for meal regeneration...');
    const startTime = Date.now();
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a professional chef. Return only valid JSON with one detailed recipe.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 1500
    });
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ OpenAI responded in ${elapsed}s`);
    
    let responseText = completion.choices[0].message.content.trim();
    responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }
    
    const mealData = JSON.parse(responseText);
    console.log('✅ New meal generated:', mealData.meal.name);
    
    res.json(mealData);

  } catch (error) {
    console.error('❌ Error regenerating meal:', error.message);
    res.status(500).json({ 
      error: 'Failed to regenerate meal',
      details: error.message 
    });
  }
});

// ============================================
// Start Server
// ============================================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});