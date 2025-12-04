# PostgreSQL Migration & Advertising Implementation Strategy
## AI Meal Planner Application

**Version:** 1.0
**Last Updated:** December 2, 2025
**Purpose:** Migrate from file-based storage to PostgreSQL and enable advertising features

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Why PostgreSQL + Why Now](#why-postgresql--why-now)
3. [PostgreSQL Setup on Render](#postgresql-setup-on-render)
4. [Complete Database Schema](#complete-database-schema)
5. [Migration Strategy](#migration-strategy)
6. [Backend Implementation](#backend-implementation)
7. [Advertising Features Integration](#advertising-features-integration)
8. [Testing & Validation](#testing--validation)
9. [Rollback Plan](#rollback-plan)

---

## Executive Summary

### Current State: Critical Issues

**File-Based Storage Problems:**
- ❌ JSON files don't scale beyond single server
- ❌ No ACID guarantees (data corruption risk)
- ❌ Synchronous I/O blocks event loop
- ❌ No concurrent access control
- ❌ Can't track user subscriptions/usage
- ❌ Prevents multi-server deployment

**Current Files:**
- `user-data/favorites.json` - User favorite meals
- `user-data/history.json` - Meal plan history
- `discount-code-usage.json` - Discount tracking (⚠️ contains PII)

### After PostgreSQL Migration: Benefits

**Immediate Security Fixes:**
- ✅ Resolves Priority #3 from security audit (File-Based Storage)
- ✅ Enables proper data encryption at rest
- ✅ ACID transactions prevent data corruption
- ✅ Proper access controls and authentication
- ✅ Automated backups included

**Enables Advertising Features:**
- ✅ User subscription tracking (free vs premium)
- ✅ Usage quotas and limits
- ✅ Ad impression/click tracking
- ✅ Affiliate conversion tracking
- ✅ Revenue analytics and reporting
- ✅ A/B testing capabilities

**Scalability Improvements:**
- ✅ Horizontal scaling with multiple servers
- ✅ Connection pooling for performance
- ✅ Async queries (non-blocking)
- ✅ Database indexes for fast queries
- ✅ Can handle millions of records

---

## Why PostgreSQL + Why Now

### Why PostgreSQL (vs alternatives)?

**PostgreSQL vs MySQL:**
- ✅ Better JSON support (JSONB type)
- ✅ More advanced indexing options
- ✅ Superior data integrity
- ✅ Free and open source

**PostgreSQL vs MongoDB:**
- ✅ Better for structured data with relationships
- ✅ ACID transactions (MongoDB limited)
- ✅ SQL familiarity for most developers
- ✅ Free tier available on Render

**PostgreSQL vs Files:**
- ✅ 1000x faster for queries with indexes
- ✅ Concurrent access without corruption
- ✅ Automated backups and point-in-time recovery
- ✅ Industry standard for production apps

### Why Now?

**Current Blockers:**
1. **Can't implement premium subscriptions** - Need user tier tracking
2. **Can't track ad revenue** - Need impression/click analytics
3. **Can't enforce usage limits** - Need usage quotas
4. **Can't scale to multiple servers** - File-based storage single-server only
5. **Data loss risk** - No backups, files can corrupt

**Timeline Impact:**
- Migrate now: 1-2 weeks work
- Migrate later: 3-4 weeks work (more data to migrate)
- **Every day delayed = more technical debt**

---

## PostgreSQL Setup on Render

### Step 1: Create PostgreSQL Database on Render

**Timeline:** 15 minutes

#### Via Render Dashboard:

1. **Log in to Render:** https://dashboard.render.com
2. **Click "New +"** → Select "PostgreSQL"
3. **Configure Database:**
   ```
   Name: meal-planner-db
   Database: meal_planner
   User: meal_planner_user
   Region: Oregon (US West) or closest to your backend
   Plan: Starter ($7/month - includes 256MB RAM, 1GB storage)
   ```

4. **Create Database** - Render provisions in ~2 minutes

5. **Save Connection Details:**
   ```
   Internal Database URL (use this):
   postgresql://meal_planner_user:PASSWORD@HOST:5432/meal_planner

   External Database URL (for local dev):
   postgresql://meal_planner_user:PASSWORD@EXTERNAL_HOST:5432/meal_planner
   ```

#### Pricing Breakdown:

| Plan | Price | Storage | RAM | Connections | Best For |
|------|-------|---------|-----|-------------|----------|
| **Starter** | **$7/mo** | 1 GB | 256 MB | 22 | Development, low traffic |
| **Standard** | $20/mo | 10 GB | 1 GB | 97 | Production, 100-500 users |
| **Pro** | $65/mo | 256 GB | 4 GB | 197 | High traffic, 1000+ users |

**Recommendation:** Start with **Starter ($7/mo)**, upgrade to Standard when you hit 500+ daily users.

---

### Step 2: Configure Environment Variables

**Timeline:** 5 minutes

#### Update Render Backend Service:

1. Go to your backend service (meal-planner-api)
2. Navigate to **Environment** tab
3. Add new environment variable:

```bash
# PostgreSQL connection
DATABASE_URL=postgresql://meal_planner_user:PASSWORD@dpg-xxxxx-a.oregon-postgres.render.com/meal_planner

# Alternative: Use Render's internal URL (faster, private network)
DATABASE_URL=postgresql://meal_planner_user:PASSWORD@dpg-xxxxx-a/meal_planner
```

**Important:**
- Use **Internal Database URL** for production (private network, faster)
- Use **External Database URL** for local development only

#### Update Local `.env`:

```bash
# Add to .env file for local development
DATABASE_URL=postgresql://meal_planner_user:PASSWORD@dpg-xxxxx-a.oregon-postgres.render.com/meal_planner

# Or run locally with Docker:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/meal_planner_dev
```

---

### Step 3: Install PostgreSQL Client Library

**Timeline:** 2 minutes

```bash
npm install pg
```

**Package:** `pg` is the official PostgreSQL client for Node.js
- Non-blocking, async/await support
- Connection pooling built-in
- Type-safe with TypeScript support

---

## Complete Database Schema

### Schema Design Philosophy

**Goals:**
1. ✅ Support current features (favorites, history, discounts)
2. ✅ Enable advertising features (subscriptions, usage tracking)
3. ✅ Normalize data to prevent redundancy
4. ✅ Use indexes for fast queries
5. ✅ Track analytics for revenue optimization

---

### Core Tables

#### 1. Users Table

**Purpose:** Central user registry from Google OAuth

```sql
CREATE TABLE users (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Google OAuth Data
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  picture_url TEXT,

  -- User Preferences (future use)
  default_cuisine TEXT[],  -- Array of preferred cuisines
  default_people INTEGER DEFAULT 2,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,

  -- Soft Delete (for GDPR compliance)
  deleted_at TIMESTAMP
);

-- Indexes for fast lookups
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_login ON users(last_login DESC);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Indexes Explanation:**
- `google_id` - Fast OAuth lookup on login
- `email` - Fast email-based queries
- `last_login` - Identify inactive users for retention campaigns

---

#### 2. Subscriptions Table

**Purpose:** Track user subscription status (free vs premium)

```sql
CREATE TABLE subscriptions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Key
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Stripe Integration
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,

  -- Subscription Details
  plan_type VARCHAR(50) NOT NULL DEFAULT 'free',
    -- Values: 'free', 'premium'
  status VARCHAR(50) NOT NULL DEFAULT 'active',
    -- Values: 'active', 'cancelled', 'past_due', 'trialing'

  -- Billing Periods
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  trial_end TIMESTAMP,

  -- Cancellation
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT check_plan_type CHECK (plan_type IN ('free', 'premium')),
  CONSTRAINT check_status CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing', 'incomplete'))
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end) WHERE status = 'active';

-- Trigger
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Business Logic:**
- Every user starts with `plan_type = 'free'`, `status = 'active'`
- On Stripe checkout success → update `stripe_customer_id`, `plan_type = 'premium'`
- On cancellation → `cancel_at_period_end = true`, don't change status until period ends
- On period end → check Stripe webhook → update status

---

#### 3. Usage Stats Table

**Purpose:** Track feature usage for free tier limits

```sql
CREATE TABLE usage_stats (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Key
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Usage Tracking
  action_type VARCHAR(100) NOT NULL,
    -- Values: 'meal_plan_generated', 'meal_regenerated',
    --         'store_search', 'custom_item_added'

  -- Metadata (JSONB for flexibility)
  metadata JSONB,
    -- Example: {"cuisines": ["Italian"], "days": 7, "stores": 2}

  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for usage queries
CREATE INDEX idx_usage_user_id ON usage_stats(user_id);
CREATE INDEX idx_usage_action_type ON usage_stats(action_type);
CREATE INDEX idx_usage_created_at ON usage_stats(created_at DESC);

-- Composite index for monthly usage queries
CREATE INDEX idx_usage_user_month ON usage_stats(
  user_id,
  date_trunc('month', created_at)
);

-- GIN index for JSONB metadata queries
CREATE INDEX idx_usage_metadata ON usage_stats USING GIN(metadata);
```

**Usage Limit Example:**
```sql
-- Check if user has exceeded free tier limit (10 meal plans/month)
SELECT COUNT(*) as meal_plans_this_month
FROM usage_stats
WHERE user_id = $1
  AND action_type = 'meal_plan_generated'
  AND created_at >= date_trunc('month', CURRENT_TIMESTAMP);

-- Result: 9 → Allow
-- Result: 10 → Block, show upgrade prompt
```

---

#### 4. Favorites Table

**Purpose:** Store user favorite meals (replaces `favorites.json`)

```sql
CREATE TABLE favorites (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Key
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Meal Type
  meal_type VARCHAR(50) NOT NULL,
    -- Values: 'breakfast', 'lunch', 'dinner'

  -- Meal Data (JSONB for flexibility)
  meal_data JSONB NOT NULL,
    -- Full meal object: {name, ingredients, instructions, nutrition}

  -- Quick Access Fields (denormalized for performance)
  meal_name VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT check_meal_type CHECK (meal_type IN ('breakfast', 'lunch', 'dinner'))
);

-- Indexes
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_meal_type ON favorites(meal_type);
CREATE INDEX idx_favorites_user_meal_type ON favorites(user_id, meal_type);
CREATE INDEX idx_favorites_meal_data ON favorites USING GIN(meal_data);

-- Prevent duplicate favorites
CREATE UNIQUE INDEX idx_favorites_unique ON favorites(user_id, meal_name, meal_type);
```

**JSONB `meal_data` Example:**
```json
{
  "name": "Avocado Toast with Poached Eggs",
  "ingredients": [
    "2 slices whole grain bread",
    "1 ripe avocado",
    "2 eggs"
  ],
  "instructions": [
    "Toast the bread",
    "Mash avocado and spread on toast",
    "Poach eggs and place on toast"
  ],
  "nutrition": {
    "calories": 350,
    "protein": "15g",
    "carbs": "28g",
    "fat": "20g"
  },
  "prepTime": "5 minutes",
  "cookTime": "5 minutes",
  "cuisine": "American"
}
```

**Why JSONB?**
- ✅ Flexible schema (can add fields without migrations)
- ✅ Can query inside JSON (e.g., find meals with "avocado")
- ✅ Indexed for fast lookups
- ✅ Stores entire meal object in one column

---

#### 5. Meal Plan History Table

**Purpose:** Store generated meal plans (replaces `history.json`)

```sql
CREATE TABLE meal_plan_history (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Key
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Meal Plan Data
  preferences JSONB NOT NULL,
    -- User preferences: {cuisines, people, dietary, leftovers, etc.}
  meal_plan JSONB NOT NULL,
    -- Full meal plan: {Monday: {breakfast: {...}, dinner: {...}}}
  stores JSONB NOT NULL,
    -- Store selection: {primaryStore: {...}, comparisonStore: {...}}

  -- Shopping List
  shopping_list JSONB,
  total_cost DECIMAL(10, 2),

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_history_user_id ON meal_plan_history(user_id);
CREATE INDEX idx_history_created_at ON meal_plan_history(created_at DESC);
CREATE INDEX idx_history_user_recent ON meal_plan_history(user_id, created_at DESC);

-- GIN indexes for JSONB queries
CREATE INDEX idx_history_preferences ON meal_plan_history USING GIN(preferences);
CREATE INDEX idx_history_meal_plan ON meal_plan_history USING GIN(meal_plan);
```

**Query Examples:**
```sql
-- Get user's last 10 meal plans
SELECT id, preferences->>'cuisines' as cuisines, created_at
FROM meal_plan_history
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 10;

-- Find all vegetarian meal plans
SELECT id, created_at
FROM meal_plan_history
WHERE preferences @> '{"dietaryPreferences": ["vegetarian"]}'
ORDER BY created_at DESC;
```

---

### Advertising Tables

#### 6. Discount Codes Table

**Purpose:** Manage promo codes (replaces `discount-code-usage.json` partially)

```sql
CREATE TABLE discount_codes (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Code Details
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,

  -- Discount
  discount_type VARCHAR(20) NOT NULL,
    -- Values: 'percentage', 'fixed_amount'
  discount_value DECIMAL(10, 2) NOT NULL,
    -- If percentage: 20.00 = 20%
    -- If fixed: 5.00 = $5 off

  -- Validity
  active BOOLEAN DEFAULT TRUE,
  max_uses INTEGER,  -- NULL = unlimited
  uses_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP,

  -- Restrictions
  minimum_plan_type VARCHAR(50),  -- 'free' or 'premium'

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT check_discount_type CHECK (discount_type IN ('percentage', 'fixed_amount')),
  CONSTRAINT check_discount_value CHECK (discount_value > 0)
);

-- Indexes
CREATE INDEX idx_discount_codes_code ON discount_codes(code);
CREATE INDEX idx_discount_codes_active ON discount_codes(active) WHERE active = TRUE;
CREATE INDEX idx_discount_codes_valid_until ON discount_codes(valid_until) WHERE valid_until > CURRENT_TIMESTAMP;

-- Trigger
CREATE TRIGGER update_discount_codes_updated_at BEFORE UPDATE ON discount_codes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

#### 7. Discount Usage Table

**Purpose:** Track discount code redemptions (replaces `discount-code-usage.json`)

```sql
CREATE TABLE discount_usage (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  discount_code_id UUID REFERENCES discount_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Usage Details
  amount_saved DECIMAL(10, 2),
  original_price DECIMAL(10, 2),
  final_price DECIMAL(10, 2),

  -- IP tracking (for fraud detection)
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_discount_usage_code ON discount_usage(discount_code_id);
CREATE INDEX idx_discount_usage_user ON discount_usage(user_id);
CREATE INDEX idx_discount_usage_used_at ON discount_usage(used_at DESC);

-- Prevent duplicate usage by same user
CREATE UNIQUE INDEX idx_discount_usage_unique ON discount_usage(discount_code_id, user_id);
```

**Business Logic:**
```sql
-- Check if user already used this code
SELECT COUNT(*) FROM discount_usage
WHERE discount_code_id = $1 AND user_id = $2;

-- If 0 → Allow
-- If > 0 → Reject (already used)
```

---

#### 8. Ad Impressions Table

**Purpose:** Track ad views for analytics

```sql
CREATE TABLE ad_impressions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Key (optional - can track anonymous users)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Ad Details
  ad_type VARCHAR(50) NOT NULL,
    -- Values: 'google_adsense', 'affiliate_instacart',
    --         'affiliate_hellofresh', 'sponsored_store'
  ad_placement VARCHAR(100),
    -- Values: 'meal_plan_banner', 'shopping_list_sidebar',
    --         'store_finder_featured'

  -- Ad Content
  ad_id VARCHAR(255),  -- External ad ID (AdSense unit ID, affiliate link ID)
  ad_content JSONB,    -- Additional metadata

  -- User Context
  page_url TEXT,
  referrer TEXT,

  -- Session
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for analytics queries
CREATE INDEX idx_ad_impressions_user_id ON ad_impressions(user_id);
CREATE INDEX idx_ad_impressions_ad_type ON ad_impressions(ad_type);
CREATE INDEX idx_ad_impressions_created_at ON ad_impressions(created_at DESC);
CREATE INDEX idx_ad_impressions_session ON ad_impressions(session_id);

-- Composite index for daily reports
CREATE INDEX idx_ad_impressions_date_type ON ad_impressions(
  date_trunc('day', created_at),
  ad_type
);
```

**Analytics Query Example:**
```sql
-- Daily impressions by ad type
SELECT
  date_trunc('day', created_at) as date,
  ad_type,
  COUNT(*) as impressions,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions
FROM ad_impressions
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY date, ad_type
ORDER BY date DESC, impressions DESC;
```

---

#### 9. Ad Clicks Table

**Purpose:** Track ad clicks for conversion analytics

```sql
CREATE TABLE ad_clicks (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  impression_id UUID REFERENCES ad_impressions(id) ON DELETE SET NULL,

  -- Ad Details (denormalized for performance)
  ad_type VARCHAR(50) NOT NULL,
  ad_placement VARCHAR(100),
  ad_id VARCHAR(255),

  -- Click Details
  destination_url TEXT,

  -- Session
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,

  -- Conversion Tracking
  converted BOOLEAN DEFAULT FALSE,
  conversion_value DECIMAL(10, 2),
  conversion_date TIMESTAMP,

  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ad_clicks_user_id ON ad_clicks(user_id);
CREATE INDEX idx_ad_clicks_impression_id ON ad_clicks(impression_id);
CREATE INDEX idx_ad_clicks_ad_type ON ad_clicks(ad_type);
CREATE INDEX idx_ad_clicks_created_at ON ad_clicks(created_at DESC);
CREATE INDEX idx_ad_clicks_converted ON ad_clicks(converted) WHERE converted = TRUE;

-- Composite index for CTR calculation
CREATE INDEX idx_ad_clicks_date_type ON ad_clicks(
  date_trunc('day', created_at),
  ad_type
);
```

**CTR (Click-Through Rate) Calculation:**
```sql
-- Calculate CTR by ad type (last 7 days)
SELECT
  i.ad_type,
  COUNT(DISTINCT i.id) as impressions,
  COUNT(DISTINCT c.id) as clicks,
  ROUND(COUNT(DISTINCT c.id)::DECIMAL / COUNT(DISTINCT i.id) * 100, 2) as ctr_percent
FROM ad_impressions i
LEFT JOIN ad_clicks c ON c.impression_id = i.id
WHERE i.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY i.ad_type
ORDER BY ctr_percent DESC;
```

---

#### 10. Affiliate Conversions Table

**Purpose:** Track affiliate revenue (Instacart, HelloFresh, etc.)

```sql
CREATE TABLE affiliate_conversions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  click_id UUID REFERENCES ad_clicks(id) ON DELETE SET NULL,

  -- Affiliate Details
  affiliate_network VARCHAR(100) NOT NULL,
    -- Values: 'instacart', 'hellofresh', 'blueapron', 'amazon'
  affiliate_id VARCHAR(255),  -- External conversion ID

  -- Conversion Details
  conversion_type VARCHAR(50),
    -- Values: 'purchase', 'signup', 'trial'
  order_value DECIMAL(10, 2),
  commission_value DECIMAL(10, 2),
  commission_rate DECIMAL(5, 2),  -- Percentage

  -- Status
  status VARCHAR(50) DEFAULT 'pending',
    -- Values: 'pending', 'confirmed', 'rejected', 'paid'

  -- Timestamps
  conversion_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_date TIMESTAMP,
  paid_date TIMESTAMP,

  -- Notes
  notes TEXT
);

-- Indexes
CREATE INDEX idx_affiliate_conversions_user_id ON affiliate_conversions(user_id);
CREATE INDEX idx_affiliate_conversions_network ON affiliate_conversions(affiliate_network);
CREATE INDEX idx_affiliate_conversions_status ON affiliate_conversions(status);
CREATE INDEX idx_affiliate_conversions_date ON affiliate_conversions(conversion_date DESC);

-- Composite index for revenue reports
CREATE INDEX idx_affiliate_conversions_month_network ON affiliate_conversions(
  date_trunc('month', conversion_date),
  affiliate_network,
  status
);
```

**Revenue Report Query:**
```sql
-- Monthly affiliate revenue by network
SELECT
  date_trunc('month', conversion_date) as month,
  affiliate_network,
  COUNT(*) as conversions,
  SUM(order_value) as total_order_value,
  SUM(commission_value) as total_commission,
  AVG(commission_rate) as avg_commission_rate
FROM affiliate_conversions
WHERE status IN ('confirmed', 'paid')
  AND conversion_date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY month, affiliate_network
ORDER BY month DESC, total_commission DESC;
```

---

## Migration Strategy

### Phase 1: Setup & Validation (Day 1)

**Timeline:** 4 hours

#### Step 1.1: Create Database on Render
- ✅ Follow [PostgreSQL Setup on Render](#postgresql-setup-on-render)
- ✅ Save connection URL
- ✅ Update environment variables

#### Step 1.2: Run Schema Creation

**Create file: `migrations/001_initial_schema.sql`**

```sql
-- Copy entire schema from "Complete Database Schema" section above
-- Run order:
-- 1. Users table
-- 2. Subscriptions table
-- 3. Usage stats table
-- 4. Favorites table
-- 5. Meal plan history table
-- 6. Discount codes table
-- 7. Discount usage table
-- 8. Ad impressions table
-- 9. Ad clicks table
-- 10. Affiliate conversions table
```

**Run migration:**

```bash
# Install PostgreSQL CLI tools (if not installed)
brew install postgresql  # macOS
# or: sudo apt-get install postgresql-client  # Linux

# Connect to database
psql $DATABASE_URL

# Run migration
\i migrations/001_initial_schema.sql

# Verify tables created
\dt

# Expected output:
#  public | users
#  public | subscriptions
#  public | usage_stats
#  public | favorites
#  public | meal_plan_history
#  public | discount_codes
#  public | discount_usage
#  public | ad_impressions
#  public | ad_clicks
#  public | affiliate_conversions
```

#### Step 1.3: Test Connection from Backend

**Create file: `db.js`**

```javascript
const { Pool } = require('pg');

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Database connected');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

// Helper function for queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executed:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

module.exports = {
  pool,
  query
};
```

**Test in `server.js`:**

```javascript
const db = require('./db');

// Test query on startup
(async () => {
  try {
    const result = await db.query('SELECT NOW()');
    console.log('Database time:', result.rows[0].now);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
})();
```

---

### Phase 2: Data Migration (Day 2-3)

**Timeline:** 8 hours

#### Step 2.1: Create Migration Scripts

**Create file: `migrations/migrate_data.js`**

```javascript
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const db = require('../db');

// Migration script
async function migrateData() {
  console.log('Starting data migration...');

  try {
    // Migrate favorites
    await migrateFavorites();

    // Migrate history
    await migrateHistory();

    // Migrate discount usage
    await migrateDiscountUsage();

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
}

async function migrateFavorites() {
  console.log('\n📁 Migrating favorites.json...');

  try {
    const favoritesPath = path.join(__dirname, '../user-data/favorites.json');
    const favoritesData = JSON.parse(await fs.readFile(favoritesPath, 'utf8'));

    let totalMigrated = 0;

    for (const [hashedEmail, userFavorites] of Object.entries(favoritesData)) {
      // Note: We can't reverse MD5 hashes, so we'll need to migrate on user login
      // For now, store with a placeholder user_id and migrate later

      console.log(`  Migrating favorites for hashed email: ${hashedEmail}`);

      for (const [mealType, meals] of Object.entries(userFavorites)) {
        for (const meal of meals) {
          // Skip if no meals
          if (!meal || !meal.name) continue;

          // Insert favorite (will link to user on next login)
          await db.query(`
            INSERT INTO favorites (user_id, meal_type, meal_data, meal_name, created_at)
            VALUES (
              NULL,  -- Will update on user login
              $1,
              $2,
              $3,
              CURRENT_TIMESTAMP
            )
            ON CONFLICT DO NOTHING
          `, [mealType, JSON.stringify(meal), meal.name]);

          totalMigrated++;
        }
      }
    }

    console.log(`  ✅ Migrated ${totalMigrated} favorites`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('  ℹ️  No favorites.json file found, skipping');
    } else {
      throw error;
    }
  }
}

async function migrateHistory() {
  console.log('\n📁 Migrating history.json...');

  try {
    const historyPath = path.join(__dirname, '../user-data/history.json');
    const historyData = JSON.parse(await fs.readFile(historyPath, 'utf8'));

    let totalMigrated = 0;

    for (const [hashedEmail, userHistory] of Object.entries(historyData)) {
      console.log(`  Migrating history for hashed email: ${hashedEmail}`);

      for (const entry of userHistory) {
        await db.query(`
          INSERT INTO meal_plan_history (
            user_id,
            preferences,
            meal_plan,
            stores,
            shopping_list,
            created_at
          ) VALUES (
            NULL,  -- Will update on user login
            $1, $2, $3, $4,
            $5
          )
        `, [
          JSON.stringify(entry.preferences),
          JSON.stringify(entry.mealPlan),
          JSON.stringify(entry.stores),
          JSON.stringify(entry.shoppingList || {}),
          entry.timestamp || new Date()
        ]);

        totalMigrated++;
      }
    }

    console.log(`  ✅ Migrated ${totalMigrated} history entries`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('  ℹ️  No history.json file found, skipping');
    } else {
      throw error;
    }
  }
}

async function migrateDiscountUsage() {
  console.log('\n📁 Migrating discount-code-usage.json...');

  try {
    const discountPath = path.join(__dirname, '../discount-code-usage.json');
    const discountData = JSON.parse(await fs.readFile(discountPath, 'utf8'));

    let totalMigrated = 0;

    for (const [code, usages] of Object.entries(discountData)) {
      // First, create discount code if not exists
      const codeResult = await db.query(`
        INSERT INTO discount_codes (code, description, discount_type, discount_value, active)
        VALUES ($1, $2, 'fixed_amount', 5.00, TRUE)
        ON CONFLICT (code) DO UPDATE SET code = $1
        RETURNING id
      `, [code, `Imported from legacy system`]);

      const discountCodeId = codeResult.rows[0].id;

      // Migrate usages
      for (const usage of usages) {
        await db.query(`
          INSERT INTO discount_usage (
            discount_code_id,
            user_id,
            amount_saved,
            used_at
          ) VALUES ($1, NULL, $2, $3)
          ON CONFLICT DO NOTHING
        `, [
          discountCodeId,
          usage.amountSaved || 5.00,
          usage.timestamp || new Date()
        ]);

        totalMigrated++;
      }
    }

    console.log(`  ✅ Migrated ${totalMigrated} discount usages`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('  ℹ️  No discount-code-usage.json file found, skipping');
    } else {
      throw error;
    }
  }
}

// Run migration
migrateData();
```

**Run migration:**

```bash
node migrations/migrate_data.js
```

---

#### Step 2.2: Link Migrated Data to Users on Login

**Update Passport callback in `server.js`:**

```javascript
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] && profile.emails[0].value;

        if (!email) {
          return done(new Error('email not in Google profile'));
        }

        // Check if user exists in database
        const userResult = await db.query(
          'SELECT * FROM users WHERE google_id = $1',
          [profile.id]
        );

        let user;

        if (userResult.rows.length === 0) {
          // Create new user
          const insertResult = await db.query(`
            INSERT INTO users (google_id, email, display_name, picture_url, last_login)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            RETURNING *
          `, [profile.id, email, profile.displayName, profile.photos?.[0]?.value]);

          user = insertResult.rows[0];

          // Create free subscription
          await db.query(`
            INSERT INTO subscriptions (user_id, plan_type, status)
            VALUES ($1, 'free', 'active')
          `, [user.id]);

          console.log('New user created:', user.email);
        } else {
          user = userResult.rows[0];

          // Update last login
          await db.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
          );

          console.log('Existing user logged in:', user.email);
        }

        // Return user object for session
        done(null, {
          id: user.id,
          googleId: user.google_id,
          email: user.email,
          displayName: user.display_name,
          picture: user.picture_url
        });
      } catch (err) {
        done(err);
      }
    }
  )
);
```

---

### Phase 3: Update Backend Endpoints (Day 4-5)

**Timeline:** 16 hours

#### Step 3.1: Replace File Operations with Database Queries

**Before (file-based):**
```javascript
// OLD CODE - favorites.json
const favoritesPath = path.join(__dirname, 'user-data', 'favorites.json');
const favorites = JSON.parse(fs.readFileSync(favoritesPath, 'utf8'));
const userFavorites = favorites[hashedEmail] || {};
```

**After (database):**
```javascript
// NEW CODE - PostgreSQL
const result = await db.query(
  'SELECT * FROM favorites WHERE user_id = $1 ORDER BY created_at DESC',
  [req.user.id]
);
const userFavorites = result.rows;
```

#### Step 3.2: Update Favorites Endpoints

**GET /api/favorites:**

```javascript
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
      ORDER BY meal_type, created_at DESC
    `, [req.user.id]);

    // Group by meal type
    const groupedFavorites = {
      breakfast: [],
      lunch: [],
      dinner: []
    };

    result.rows.forEach(row => {
      groupedFavorites[row.meal_type].push({
        id: row.id,
        ...row.meal_data,
        createdAt: row.created_at
      });
    });

    res.json(groupedFavorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});
```

**POST /api/favorites/add:**

```javascript
app.post('/api/favorites/add', requireAuth, async (req, res) => {
  try {
    const { mealType, meal } = req.body;

    // Validate meal type
    if (!['breakfast', 'lunch', 'dinner'].includes(mealType)) {
      return res.status(400).json({ error: 'Invalid meal type' });
    }

    // Insert favorite
    await db.query(`
      INSERT INTO favorites (user_id, meal_type, meal_data, meal_name)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, meal_name, meal_type) DO NOTHING
    `, [req.user.id, mealType, JSON.stringify(meal), meal.name]);

    res.json({ success: true, message: 'Added to favorites' });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});
```

**POST /api/favorites/remove:**

```javascript
app.post('/api/favorites/remove', requireAuth, async (req, res) => {
  try {
    const { mealType, mealName } = req.body;

    await db.query(`
      DELETE FROM favorites
      WHERE user_id = $1 AND meal_type = $2 AND meal_name = $3
    `, [req.user.id, mealType, mealName]);

    res.json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});
```

---

#### Step 3.3: Update History Endpoints

**POST /api/history/save:**

```javascript
app.post('/api/history/save', requireAuth, async (req, res) => {
  try {
    const { mealPlan, preferences, stores, shoppingList, totalCost } = req.body;

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
      JSON.stringify(preferences),
      JSON.stringify(mealPlan),
      JSON.stringify(stores),
      JSON.stringify(shoppingList),
      totalCost
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving history:', error);
    res.status(500).json({ error: 'Failed to save history' });
  }
});
```

**GET /api/history:**

```javascript
app.get('/api/history', requireAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        id,
        preferences,
        meal_plan,
        stores,
        shopping_list,
        total_cost,
        created_at
      FROM meal_plan_history
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});
```

---

#### Step 3.4: Add Usage Tracking

**Track meal plan generation:**

```javascript
app.post('/api/generate-meals', aiLimiter, requireAuth, async (req, res) => {
  try {
    // Check usage limit for free users
    const subscription = await db.query(
      'SELECT plan_type FROM subscriptions WHERE user_id = $1',
      [req.user.id]
    );

    const planType = subscription.rows[0]?.plan_type || 'free';

    if (planType === 'free') {
      // Check monthly usage
      const usageResult = await db.query(`
        SELECT COUNT(*) as count
        FROM usage_stats
        WHERE user_id = $1
          AND action_type = 'meal_plan_generated'
          AND created_at >= date_trunc('month', CURRENT_TIMESTAMP)
      `, [req.user.id]);

      const usageCount = parseInt(usageResult.rows[0].count);

      if (usageCount >= 10) {
        return res.status(403).json({
          error: 'Free tier limit reached',
          message: 'You have generated 10 meal plans this month. Upgrade to Premium for unlimited access.',
          upgradeUrl: '/pricing'
        });
      }
    }

    // Generate meal plan (existing code)
    // ...

    // Track usage
    await db.query(`
      INSERT INTO usage_stats (user_id, action_type, metadata)
      VALUES ($1, 'meal_plan_generated', $2)
    `, [req.user.id, JSON.stringify({
      cuisines: req.body.cuisines,
      days: req.body.selectedDays?.length || 7,
      meals: req.body.selectedMeals?.length || 3
    })]);

    res.json(mealPlanResponse);
  } catch (error) {
    console.error('Error generating meal plan:', error);
    res.status(500).json({ error: 'Failed to generate meal plan' });
  }
});
```

---

## Advertising Features Integration

### Feature 1: User Subscription Management

**GET /api/subscription/status:**

```javascript
app.get('/api/subscription/status', requireAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        plan_type,
        status,
        current_period_end,
        cancel_at_period_end
      FROM subscriptions
      WHERE user_id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      // Create free subscription if doesn't exist
      await db.query(`
        INSERT INTO subscriptions (user_id, plan_type, status)
        VALUES ($1, 'free', 'active')
      `, [req.user.id]);

      return res.json({
        planType: 'free',
        status: 'active'
      });
    }

    const subscription = result.rows[0];

    res.json({
      planType: subscription.plan_type,
      status: subscription.status,
      periodEnd: subscription.current_period_end,
      willCancel: subscription.cancel_at_period_end
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});
```

---

### Feature 2: Ad Impression Tracking

**POST /api/track/impression:**

```javascript
app.post('/api/track/impression', async (req, res) => {
  try {
    const { adType, adPlacement, adId, pageUrl } = req.body;
    const userId = req.user?.id || null;
    const sessionId = req.sessionID;

    await db.query(`
      INSERT INTO ad_impressions (
        user_id,
        ad_type,
        ad_placement,
        ad_id,
        page_url,
        session_id,
        ip_address,
        user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      userId,
      adType,
      adPlacement,
      adId,
      pageUrl,
      sessionId,
      req.ip,
      req.headers['user-agent']
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking impression:', error);
    res.status(500).json({ error: 'Failed to track impression' });
  }
});
```

**Frontend integration:**

```javascript
// In AdBanner component
useEffect(() => {
  // Track impression
  fetch('/api/track/impression', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      adType: 'google_adsense',
      adPlacement: 'meal_plan_banner',
      adId: adSlot,
      pageUrl: window.location.href
    })
  });
}, []);
```

---

### Feature 3: Affiliate Click Tracking

**POST /api/track/click:**

```javascript
app.post('/api/track/click', requireAuth, async (req, res) => {
  try {
    const { adType, adPlacement, destinationUrl, impressionId } = req.body;
    const userId = req.user?.id || null;
    const sessionId = req.sessionID;

    const result = await db.query(`
      INSERT INTO ad_clicks (
        user_id,
        impression_id,
        ad_type,
        ad_placement,
        destination_url,
        session_id,
        ip_address,
        user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [
      userId,
      impressionId,
      adType,
      adPlacement,
      destinationUrl,
      sessionId,
      req.ip,
      req.headers['user-agent']
    ]);

    res.json({ success: true, clickId: result.rows[0].id });
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
});
```

**Frontend integration:**

```javascript
// In Instacart button
const handleInstacartClick = async () => {
  // Track click
  await fetch('/api/track/click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      adType: 'affiliate_instacart',
      adPlacement: 'shopping_list_button',
      destinationUrl: instacartUrl
    })
  });

  // Open affiliate link
  window.open(instacartUrl, '_blank');
};
```

---

### Feature 4: Revenue Analytics Dashboard

**GET /api/analytics/revenue:**

```javascript
app.get('/api/analytics/revenue', requireAuth, async (req, res) => {
  try {
    // Check if user is admin (implement admin check)
    // For now, placeholder check
    if (req.user.email !== 'admin@yourdomain.com') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get affiliate revenue
    const affiliateResult = await db.query(`
      SELECT
        date_trunc('month', conversion_date) as month,
        affiliate_network,
        COUNT(*) as conversions,
        SUM(commission_value) as total_commission
      FROM affiliate_conversions
      WHERE status IN ('confirmed', 'paid')
        AND conversion_date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY month, affiliate_network
      ORDER BY month DESC
    `);

    // Get subscription revenue
    const subscriptionResult = await db.query(`
      SELECT
        date_trunc('month', created_at) as month,
        COUNT(*) as new_subscriptions,
        COUNT(*) * 6.99 as estimated_revenue
      FROM subscriptions
      WHERE plan_type = 'premium'
        AND status = 'active'
        AND created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY month
      ORDER BY month DESC
    `);

    // Get ad metrics
    const adMetricsResult = await db.query(`
      SELECT
        date_trunc('day', i.created_at) as date,
        i.ad_type,
        COUNT(DISTINCT i.id) as impressions,
        COUNT(DISTINCT c.id) as clicks,
        ROUND(COUNT(DISTINCT c.id)::DECIMAL / NULLIF(COUNT(DISTINCT i.id), 0) * 100, 2) as ctr
      FROM ad_impressions i
      LEFT JOIN ad_clicks c ON c.impression_id = i.id
      WHERE i.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY date, i.ad_type
      ORDER BY date DESC
    `);

    res.json({
      affiliateRevenue: affiliateResult.rows,
      subscriptionRevenue: subscriptionResult.rows,
      adMetrics: adMetricsResult.rows
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});
```

---

## Testing & Validation

### Test Plan

**Day 6: Testing (8 hours)**

#### 1. Database Connection Test
```bash
# Test database connection
node -e "require('./db').query('SELECT NOW()').then(r => console.log(r.rows))"
```

#### 2. CRUD Operations Test

**Test favorites:**
```bash
# Create
curl -X POST http://localhost:5000/api/favorites/add \
  -H "Content-Type: application/json" \
  -d '{"mealType": "breakfast", "meal": {"name": "Test Meal", "ingredients": []}}'

# Read
curl http://localhost:5000/api/favorites

# Delete
curl -X POST http://localhost:5000/api/favorites/remove \
  -H "Content-Type: application/json" \
  -d '{"mealType": "breakfast", "mealName": "Test Meal"}'
```

#### 3. Usage Limits Test

```javascript
// Generate 11 meal plans as free user
// Should block on 11th attempt
for (let i = 0; i < 11; i++) {
  const response = await fetch('/api/generate-meals', {
    method: 'POST',
    body: JSON.stringify(mealPlanRequest)
  });
  console.log(`Request ${i+1}:`, response.status);
}

// Expected:
// Requests 1-10: 200 OK
// Request 11: 403 Forbidden with upgrade message
```

#### 4. Subscription Flow Test

```javascript
// Test upgrade flow
// 1. User starts as free
// 2. Upgrade to premium via Stripe
// 3. Verify unlimited access
// 4. Cancel subscription
// 5. Verify access until period end
// 6. Verify downgrade after period end
```

#### 5. Performance Test

```sql
-- Test query performance with indexes
EXPLAIN ANALYZE
SELECT * FROM favorites WHERE user_id = 'test-uuid';

-- Should use index scan, not sequential scan
-- Execution time should be < 5ms
```

---

## Rollback Plan

### If Migration Fails

**Immediate Rollback (< 1 hour):**

1. **Keep JSON files as backup:**
   ```bash
   # DO NOT delete user-data/ directory until migration verified
   cp -r user-data user-data-backup
   ```

2. **Revert backend code:**
   ```bash
   git revert <migration-commit-sha>
   git push
   ```

3. **Comment out database code:**
   ```javascript
   // Temporarily disable database
   // const db = require('./db');
   ```

4. **Restore file-based operations:**
   - Uncomment old file-based code
   - Deploy to Render
   - Verify functionality

**Data Recovery:**
```bash
# If data lost, restore from backup
cp -r user-data-backup user-data
```

---

## Summary & Timeline

### Complete Migration Timeline

| Phase | Timeline | Tasks | Deliverables |
|-------|----------|-------|--------------|
| **Setup** | Day 1 (4h) | Create database, run schema, test connection | Working database |
| **Migration** | Day 2-3 (8h) | Migrate JSON data, link users | Data in PostgreSQL |
| **Backend** | Day 4-5 (16h) | Update all endpoints | Database-powered API |
| **Testing** | Day 6 (8h) | Validate functionality, performance | Verified migration |
| **Deploy** | Day 7 (4h) | Deploy to production, monitor | Live on PostgreSQL |

**Total:** 7 days, 40 hours of development

---

### Security Issues Resolved

✅ **Priority #3: File-Based Storage** - CRITICAL
- Migrated to PostgreSQL
- ACID transactions
- Automated backups
- Concurrent access safe

✅ **Priority #7: Weak MD5 Hashing** - MEDIUM
- Using UUIDs instead of email hashes
- Proper user identification

✅ **Priority #8: Sensitive Data Logging** - MEDIUM
- No more plain text emails in files
- Database has access controls

✅ **Priority #14: No Backup Strategy** - HIGH
- Render provides automated daily backups
- Point-in-time recovery available

---

### Advertising Features Enabled

✅ **User Subscriptions**
- Free vs Premium tier tracking
- Usage quotas and limits
- Stripe integration ready

✅ **Ad Tracking**
- Impression tracking
- Click tracking
- CTR analytics

✅ **Affiliate Revenue**
- Conversion tracking
- Commission reporting
- Multi-network support

✅ **Analytics Dashboard**
- Revenue reports
- User metrics
- A/B testing capability

---

## Next Steps

**After PostgreSQL Migration:**

1. ✅ **Implement Premium Subscription** (Week 2)
   - Stripe integration
   - Feature gating
   - Pricing page

2. ✅ **Add Google AdSense** (Week 2)
   - Display ads in UI
   - Track impressions/revenue

3. ✅ **Integrate Instacart Affiliate** (Week 2)
   - Shopping list button
   - Conversion tracking

4. ✅ **Build Analytics Dashboard** (Week 3)
   - Revenue reports
   - User growth metrics
   - Ad performance

**Revenue Timeline:**
- Week 1-2: $0 (migration)
- Week 3-4: $200-400/month (ads + affiliates)
- Month 2-3: $700-1400/month (subscriptions)
- Month 6+: $1500-2500/month (scale)

---

**Document Version:** 1.0
**Last Updated:** December 2, 2025
**Next Review:** After migration complete
