# Advertising & Monetization Strategy
## AI Meal Planner Application

**Version:** 1.0
**Last Updated:** December 2, 2025
**Purpose:** Generate revenue to offset OpenAI API costs and infrastructure expenses

---

## Table of Contents

1. [Revenue Goals & Cost Analysis](#revenue-goals--cost-analysis)
2. [Advertising Options Overview](#advertising-options-overview)
3. [Recommended Strategy](#recommended-strategy)
4. [Implementation Plans](#implementation-plans)
5. [Platform Integrations](#platform-integrations)
6. [Legal & Compliance](#legal--compliance)

---

## Revenue Goals & Cost Analysis

### Current Monthly Costs (Estimated)

| Service | Cost | Notes |
|---------|------|-------|
| Render (Backend) | $7-25/mo | Depends on plan |
| Vercel (Frontend) | $0-20/mo | Free tier available |
| OpenAI API | $50-500/mo | Highly variable - **biggest cost** |
| PostgreSQL (future) | $7-25/mo | When migrated from files |
| Redis (future) | $10-25/mo | When migrated from in-memory |
| **Total** | **$74-595/mo** | Depends on user volume |

### OpenAI Cost Breakdown
- **GPT-4o-mini:** ~$0.015-0.05 per meal plan generation
- **100 users/day:** ~$45-150/month
- **500 users/day:** ~$225-750/month
- **1000 users/day:** ~$450-1500/month

**Goal:** Generate $100-500/month in ad revenue to cover costs

---

## Advertising Options Overview

### Option 1: Display Advertising (CPM Model)

**Best for:** High traffic volume

#### **Google AdSense**
- **Revenue:** $1-5 CPM (per 1000 impressions)
- **Minimum Traffic:** 100+ daily active users
- **Payment:** $100 minimum payout
- **Integration:** Simple script tag

**Pros:**
✅ Easy to implement
✅ No minimum traffic requirement
✅ Auto-optimized ad placement
✅ Google's advertiser network

**Cons:**
❌ Low CPM for food apps ($1-3 typically)
❌ User experience impact
❌ Ad blockers reduce revenue 20-30%

**Revenue Estimate:**
- 500 daily users × 10 page views = 5,000 impressions/day
- 5,000 × 30 days = 150,000 impressions/month
- 150,000 × $2 CPM = **$300/month**

---

### Option 2: Affiliate Marketing (CPA/CPS Model)

**Best for:** High conversion rates, targeted audience

#### **A. Grocery Delivery Services**

**Instacart Affiliate Program**
- **Commission:** 3-7% of order value
- **Cookie Duration:** 7-14 days
- **Average Order:** $60-150
- **Commission per Sale:** $2-10

**Platform:** Impact Radius, ShareASale
**Integration:** Track links with UTM parameters

**Implementation:**
```javascript
// Add "Order via Instacart" button in shopping list
<a href="https://inst.cr/t/YOUR_AFFILIATE_ID?items=milk,eggs,bread"
   target="_blank" rel="noopener">
  🛒 Order These Items via Instacart
</a>
```

**Revenue Estimate:**
- 500 users/month × 10% conversion = 50 orders
- 50 orders × $5 avg commission = **$250/month**

---

**Amazon Fresh / Whole Foods Affiliate**
- **Commission:** 1-4% of order value
- **Cookie Duration:** 24 hours
- **Average Order:** $50-100
- **Commission per Sale:** $0.50-4.00

**Platform:** Amazon Associates
**Integration:** Product links, banners, widgets

---

**Walmart Grocery Affiliate**
- **Commission:** 1-4%
- **Cookie Duration:** 3 days
- **Average Order:** $40-80
- **Commission per Sale:** $0.40-3.20

---

#### **B. Meal Kit Services**

**HelloFresh Affiliate Program**
- **Commission:** $10-25 per new customer
- **Cookie Duration:** 30 days
- **High conversion:** 5-15% for food apps

**Blue Apron Affiliate**
- **Commission:** $15-30 per new customer
- **Cookie Duration:** 30 days

**Home Chef Affiliate**
- **Commission:** $20 per new customer
- **Cookie Duration:** 30 days

**Implementation:**
```javascript
// Add meal kit option in meal plan view
<div className="meal-kit-offer">
  <h4>Too busy to cook? Try HelloFresh!</h4>
  <p>Get $100 off your first order</p>
  <a href="https://hellofresh.com?c=YOUR_AFFILIATE_CODE">
    Claim Offer →
  </a>
</div>
```

**Revenue Estimate:**
- 500 users/month × 2% conversion = 10 sign-ups
- 10 sign-ups × $20 avg commission = **$200/month**

---

#### **C. Kitchen Products & Cookware**

**Amazon Associates (Kitchen Category)**
- **Commission:** 3-5% on kitchen items
- **Products:** Cookware, appliances, utensils
- **Cookie Duration:** 24 hours

**Implementation:**
- Recommend products based on recipes
- "Tools needed for this recipe" section
- Affiliate links to specific products

**Example:**
```javascript
// In recipe instructions
<div className="recommended-tools">
  <h5>Recommended Tools:</h5>
  <ul>
    <li>
      <a href="https://amazon.com/dp/B000000?tag=YOUR_TAG">
        Non-stick Skillet - $29.99
      </a>
    </li>
  </ul>
</div>
```

**Revenue Estimate:**
- 500 users/month × 3% conversion × $30 avg order × 4% commission
- = **$18/month** (supplemental)

---

### Option 3: Sponsored Content (CPM/Flat Fee)

**Best for:** Established audience, brand partnerships

#### **Branded Recipe Placements**

Partner with food brands to feature their products in meal plans:

**Examples:**
- **Barilla Pasta:** Featured in Italian recipes
- **Beyond Meat:** Featured in vegetarian meal plans
- **Organic Valley:** Featured in dairy-based recipes
- **Bob's Red Mill:** Featured in gluten-free options

**Pricing Models:**
- **CPM:** $5-15 per 1000 impressions
- **Flat Monthly Fee:** $200-1000/month per brand
- **Performance-based:** $0.50-2.00 per click

**Implementation:**
```javascript
// Add "Sponsored by" tag to recipes
<div className="meal-card sponsored">
  <span className="sponsor-badge">Sponsored by Barilla</span>
  <h3>Classic Spaghetti Carbonara</h3>
  <p>Made with Barilla Pasta</p>
</div>
```

**Revenue Estimate:**
- 2-3 brand partnerships × $300/month = **$600-900/month**

---

### Option 4: Native Advertising (Seamless Integration)

**Best for:** User experience, higher engagement

#### **A. Promoted Stores in Store Finder**

**Model:** Grocery stores pay for top placement in store search results

**Pricing:**
- **CPC (Cost Per Click):** $0.25-1.00 per click
- **Monthly Sponsorship:** $100-500 per store for featured placement

**Implementation:**
```javascript
// In StoreSelector.js
<div className="store-results">
  {sponsoredStores.map(store => (
    <div className="store-card sponsored">
      <span className="badge">Sponsored</span>
      <h4>{store.name}</h4>
      <p>{store.address}</p>
      <span className="special-offer">
        🎁 New customers get 10% off!
      </span>
    </div>
  ))}
  {regularStores.map(store => (
    // Regular stores
  ))}
</div>
```

**Revenue Estimate:**
- 3 sponsored stores × $250/month = **$750/month**

---

#### **B. Promoted Ingredients in Shopping List**

**Model:** Brands pay to have their specific products recommended

**Example:**
- User adds "yogurt" to list
- Show "Greek Gods Yogurt - $4.99" as sponsored option

**Pricing:**
- **CPC:** $0.10-0.50 per product click
- **CPM:** $3-8 per 1000 impressions

**Implementation:**
```javascript
// In ShoppingList.js
{shoppingList.Dairy.map(item => (
  <div className="shopping-item">
    <input type="checkbox" />
    <span>{item.quantity} {item.item}</span>
    {item.sponsored && (
      <div className="sponsored-alternative">
        <span className="ad-badge">Ad</span>
        Try {item.sponsoredBrand} - {item.sponsoredPrice}
        <a href={item.affiliateLink}>View Product</a>
      </div>
    )}
  </div>
))}
```

**Revenue Estimate:**
- 1000 impressions/day × 30 days × $5 CPM = **$150/month**

---

### Option 5: Referral Programs (Direct Partnerships)

**Best for:** Building long-term revenue streams

#### **Grocery Store Loyalty Programs**

**Kroger Precision Marketing**
- **Model:** Revenue share on purchases made by referred users
- **Commission:** 1-3% of total purchases
- **Integration:** API-based tracking

**Safeway Just for U**
- **Model:** Commission on coupon redemptions
- **Commission:** $0.05-0.50 per coupon

**Target Circle**
- **Model:** Affiliate commission on purchases
- **Commission:** 1-5% of order value

**Implementation:**
```javascript
// Link user accounts to store loyalty programs
<div className="loyalty-integration">
  <h4>Connect Your Kroger Card</h4>
  <p>Automatically save on ingredients in your meal plan</p>
  <button onClick={connectKrogerAccount}>
    Connect Account
  </button>
</div>
```

**Revenue Estimate:**
- 100 connected users × $50 avg monthly spend × 2% commission
- = **$100/month** (grows with user base)

---

### Option 6: Premium Ad-Free Tier (Subscription)

**Best for:** Sustainable revenue, predictable income

**Model:** Freemium with paid ad-free option

**Pricing:**
- **Free Plan:** Includes ads, basic features
- **Premium Plan:** $4.99-9.99/month, no ads, extra features

**Premium Features:**
- Ad-free experience
- Unlimited meal plan generations (no rate limits)
- Export to calendar/email
- Advanced dietary filters
- Recipe scaling (2x, 3x portions)
- Meal prep mode

**Implementation:**
```javascript
// Stripe subscription integration
const handleUpgradeToPremium = async () => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price: 'price_premium_monthly',
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: `${FRONTEND_BASE}/success`,
    cancel_url: `${FRONTEND_BASE}/pricing`,
  });
  window.location.href = session.url;
};
```

**Revenue Estimate:**
- 500 monthly users × 5% conversion = 25 subscribers
- 25 × $6.99/month = **$175/month**
- **Grows with user base, highly scalable**

---

## Recommended Strategy

### **Phase 1: Quick Wins (Month 1)**
**Goal:** $200-400/month with minimal development

1. **Google AdSense** (1-2 hours setup)
   - Add to meal plan view and shopping list
   - Expected: $100-200/month

2. **Instacart Affiliate** (2-3 hours setup)
   - "Order via Instacart" button on shopping list
   - Expected: $100-200/month

**Total Phase 1:** $200-400/month
**Development Time:** 4-6 hours

---

### **Phase 2: High-Value Partnerships (Month 2-3)**
**Goal:** $500-1000/month

3. **Meal Kit Affiliates** (4-6 hours setup)
   - HelloFresh, Blue Apron integration
   - Banner on meal plan view
   - Expected: $200-400/month

4. **Promoted Stores** (1 week development)
   - Partner with 2-3 local grocery chains
   - Featured placement in store finder
   - Expected: $300-600/month

**Total Phase 2:** $500-1000/month
**Development Time:** 2 weeks

---

### **Phase 3: Premium Features (Month 4+)**
**Goal:** $500-2000/month (scalable)

5. **Premium Subscription** (2 weeks development)
   - Stripe integration
   - Feature gating
   - Expected: $175-500/month (grows with users)

6. **Sponsored Content** (ongoing)
   - Brand partnerships for recipe placements
   - Expected: $300-900/month

**Total Phase 3:** $475-1400/month
**Development Time:** 3-4 weeks

---

### **Combined Revenue Projection**

| Phase | Monthly Revenue | Cumulative | Development Time |
|-------|----------------|------------|------------------|
| Phase 1 | $200-400 | $200-400 | 4-6 hours |
| Phase 2 | $500-1000 | $700-1400 | +2 weeks |
| Phase 3 | $475-1400 | $1175-2800 | +3-4 weeks |

**Conservative Estimate:** $700-1000/month after 3 months
**Optimistic Estimate:** $1500-2500/month after 6 months

**Cost Coverage:**
- Current costs: $74-595/month
- ✅ **Profitable after Phase 2 implementation**

---

## Implementation Plans

### Phase 1A: Google AdSense Integration

**Timeline:** 2 hours
**Difficulty:** Easy
**Revenue:** $100-200/month

#### Step 1: Create AdSense Account
1. Sign up at https://adsense.google.com
2. Verify domain ownership
3. Get approval (1-3 days)
4. Create ad units

#### Step 2: Integration Code

**In `client/src/components/MealPlanView.js`:**
```javascript
import { useEffect } from 'react';

const AdBanner = ({ adSlot }) => {
  useEffect(() => {
    // Load AdSense script
    if (window.adsbygoogle) {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    }
  }, []);

  return (
    <div className="ad-container">
      <ins className="adsbygoogle"
           style={{ display: 'block' }}
           data-ad-client="ca-pub-YOUR_PUBLISHER_ID"
           data-ad-slot={adSlot}
           data-ad-format="auto"
           data-full-width-responsive="true">
      </ins>
    </div>
  );
};

// In MealPlanView component
<div className="meal-plan-content">
  <AdBanner adSlot="1234567890" />
  {/* Meal plan content */}
</div>
```

**In `client/public/index.html`:**
```html
<head>
  <!-- AdSense Script -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_PUBLISHER_ID"
     crossorigin="anonymous"></script>
</head>
```

#### Step 3: Ad Placement Strategy

**Recommended Placements:**
1. **Top of Meal Plan View** - 728×90 leaderboard
2. **Between Days** - 336×280 medium rectangle
3. **Shopping List Sidebar** - 300×600 half-page ad
4. **Bottom of Page** - 728×90 leaderboard

**Best Practices:**
- Don't place ads above the fold (first screen)
- Maximum 3 ad units per page
- Use auto-sizing responsive ads
- A/B test placement locations

---

### Phase 1B: Instacart Affiliate Integration

**Timeline:** 3 hours
**Difficulty:** Medium
**Revenue:** $100-200/month

#### Step 1: Join Affiliate Program
1. Apply at https://www.instacart.com/partnerships
2. Get accepted to Impact Radius platform
3. Obtain affiliate tracking links

#### Step 2: Integration Code

**In `client/src/components/ShoppingList.js`:**
```javascript
// Add state for affiliate tracking
const [instacartUrl, setInstacartUrl] = useState('');

// Generate Instacart URL with items
const generateInstacartLink = () => {
  const items = [];

  // Extract items from shopping list
  Object.entries(shoppingList).forEach(([category, categoryItems]) => {
    categoryItems.forEach(item => {
      items.push(encodeURIComponent(item.item));
    });
  });

  const baseUrl = 'https://www.instacart.com/store/';
  const storeName = selectedStores.primaryStore.name.toLowerCase().replace(/\s/g, '-');
  const affiliateId = 'YOUR_AFFILIATE_ID';

  // Build URL with UTM tracking
  const url = `${baseUrl}${storeName}?aff_id=${affiliateId}&items=${items.join(',')}`;

  setInstacartUrl(url);
};

// Add button to UI
<div className="shopping-list-actions">
  <button onClick={handlePrint} className="print-btn">
    🖨️ Print List
  </button>

  <a
    href={instacartUrl || '#'}
    onClick={generateInstacartLink}
    target="_blank"
    rel="noopener noreferrer"
    className="instacart-btn"
  >
    🛒 Order via Instacart
  </a>
</div>
```

**In `client/src/components/ShoppingList.css`:**
```css
.instacart-btn {
  background: #43B02A; /* Instacart green */
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  display: inline-block;
  margin-left: 10px;
}

.instacart-btn:hover {
  background: #369620;
}
```

#### Step 3: Track Conversions

**Backend tracking endpoint:**
```javascript
// In server.js
app.post('/api/track-affiliate-click', requireAuth, async (req, res) => {
  const { affiliate, items, estimatedValue } = req.body;

  // Log to analytics
  console.log(`Affiliate click: ${affiliate}, items: ${items.length}, value: $${estimatedValue}`);

  // Store in database for reporting
  // (future: track actual conversions via API)

  res.json({ success: true });
});
```

---

### Phase 2A: Meal Kit Affiliate Integration

**Timeline:** 6 hours
**Difficulty:** Medium
**Revenue:** $200-400/month

#### Step 1: Join Affiliate Programs
1. **HelloFresh:** Apply at https://hellofresh.com/affiliates
2. **Blue Apron:** Apply via ShareASale
3. **Home Chef:** Apply via CJ Affiliate

#### Step 2: Create Promotional Component

**Create `client/src/components/MealKitPromo.js`:**
```javascript
import React, { useState } from 'react';
import './MealKitPromo.css';

const MealKitPromo = ({ mealPlan }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const mealKits = [
    {
      name: 'HelloFresh',
      logo: '/assets/hellofresh-logo.png',
      offer: '$100 off your first order',
      link: 'https://hellofresh.com?c=YOUR_CODE',
      color: '#91C13E'
    },
    {
      name: 'Blue Apron',
      logo: '/assets/blueapron-logo.png',
      offer: '$60 off + free shipping',
      link: 'https://blueapron.com?cvosrc=affiliate.YOUR_ID',
      color: '#3E4F8C'
    }
  ];

  const randomKit = mealKits[Math.floor(Math.random() * mealKits.length)];

  return (
    <div className="meal-kit-promo" style={{ borderColor: randomKit.color }}>
      <button className="dismiss-btn" onClick={() => setDismissed(true)}>×</button>

      <div className="promo-content">
        <img src={randomKit.logo} alt={randomKit.name} />
        <div className="promo-text">
          <h4>No time to cook this week?</h4>
          <p>Try {randomKit.name} and get <strong>{randomKit.offer}</strong></p>
        </div>
        <a
          href={randomKit.link}
          target="_blank"
          rel="noopener noreferrer"
          className="promo-cta"
          style={{ background: randomKit.color }}
          onClick={() => trackAffiliateClick(randomKit.name)}
        >
          Claim Offer →
        </a>
      </div>
    </div>
  );
};

const trackAffiliateClick = async (partner) => {
  await fetch('/api/track-affiliate-click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ affiliate: partner, type: 'meal-kit' })
  });
};

export default MealKitPromo;
```

**In `client/src/components/MealPlanView.js`:**
```javascript
import MealKitPromo from './MealKitPromo';

// Add after meal plan display
<div className="meal-plan-container">
  {/* Meal plan content */}

  <MealKitPromo mealPlan={localMealPlan} />
</div>
```

---

### Phase 3A: Premium Subscription Model

**Timeline:** 2 weeks
**Difficulty:** High
**Revenue:** $175-500/month (scalable)

#### Architecture

```
User Tiers:
├── Free (with ads)
│   ├── 10 meal plans per month
│   ├── Display ads in UI
│   ├── Basic features
│   └── Rate limited
│
└── Premium ($6.99/month)
    ├── Unlimited meal plans
    ├── No ads
    ├── Export to PDF/Email
    ├── Advanced filters
    ├── Recipe scaling
    └── Priority support
```

#### Step 1: Database Schema Update

**Add to PostgreSQL migration:**
```sql
-- User subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  plan_type VARCHAR(50) NOT NULL, -- 'free' or 'premium'
  status VARCHAR(50) NOT NULL, -- 'active', 'cancelled', 'past_due'
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usage tracking
CREATE TABLE usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(100), -- 'meal_plan_generated', 'meal_regenerated'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usage_user_month ON usage_stats(user_id, date_trunc('month', created_at));
```

#### Step 2: Backend Subscription Endpoints

**In `server.js`:**
```javascript
// Stripe webhook handler
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle subscription events
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      await updateUserSubscription(subscription);
      break;

    case 'customer.subscription.deleted':
      const canceledSub = event.data.object;
      await cancelUserSubscription(canceledSub);
      break;
  }

  res.json({ received: true });
});

// Create checkout session
app.post('/api/create-checkout-session', requireAuth, async (req, res) => {
  const { priceId } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: req.user.email,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${FRONTEND_BASE}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_BASE}/pricing`,
      metadata: {
        userId: req.user.id
      }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check user subscription status
app.get('/api/subscription/status', requireAuth, async (req, res) => {
  // Query database for user subscription
  const subscription = await getUserSubscription(req.user.id);

  res.json({
    plan: subscription?.plan_type || 'free',
    status: subscription?.status || 'none',
    periodEnd: subscription?.current_period_end
  });
});
```

#### Step 3: Frontend Pricing Page

**Create `client/src/components/PricingPage.js`:**
```javascript
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const PricingPage = () => {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);

    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        priceId: 'price_YOUR_STRIPE_PRICE_ID'
      })
    });

    const { sessionId } = await response.json();
    const stripe = await stripePromise;

    await stripe.redirectToCheckout({ sessionId });
  };

  return (
    <div className="pricing-container">
      <h1>Choose Your Plan</h1>

      <div className="pricing-cards">
        {/* Free Plan */}
        <div className="pricing-card">
          <h3>Free</h3>
          <div className="price">$0<span>/month</span></div>
          <ul className="features">
            <li>✓ 10 meal plans per month</li>
            <li>✓ Basic dietary filters</li>
            <li>✓ Shopping list generation</li>
            <li>✓ Store price comparison</li>
            <li>⚠️ Includes ads</li>
          </ul>
          <button className="btn-secondary" disabled>Current Plan</button>
        </div>

        {/* Premium Plan */}
        <div className="pricing-card featured">
          <span className="badge">Most Popular</span>
          <h3>Premium</h3>
          <div className="price">$6.99<span>/month</span></div>
          <ul className="features">
            <li>✓ Unlimited meal plans</li>
            <li>✓ No advertisements</li>
            <li>✓ Export to PDF/Email</li>
            <li>✓ Advanced dietary filters</li>
            <li>✓ Recipe scaling (2x, 3x)</li>
            <li>✓ Meal prep mode</li>
            <li>✓ Priority support</li>
          </ul>
          <button
            className="btn-primary"
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Upgrade to Premium'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
```

#### Step 4: Feature Gating

**Create `client/src/utils/featureGating.js`:**
```javascript
export const canGenerateMealPlan = async (user) => {
  const subscription = await fetch('/api/subscription/status', {
    credentials: 'include'
  }).then(r => r.json());

  if (subscription.plan === 'premium') {
    return { allowed: true };
  }

  // Check usage for free tier
  const usage = await fetch('/api/usage/meal-plans', {
    credentials: 'include'
  }).then(r => r.json());

  if (usage.count >= 10) {
    return {
      allowed: false,
      reason: 'You have reached the 10 meal plan limit for free users. Upgrade to Premium for unlimited access.'
    };
  }

  return { allowed: true };
};
```

**In `client/src/components/Questionnaire.js`:**
```javascript
import { canGenerateMealPlan } from '../utils/featureGating';

const handleSubmit = async () => {
  // Check if user can generate meal plan
  const { allowed, reason } = await canGenerateMealPlan(user);

  if (!allowed) {
    alert(reason);
    // Show upgrade modal
    return;
  }

  // Proceed with meal plan generation
  generateMealPlan();
};
```

---

## Platform Integrations

### Affiliate Network Setup

#### Impact Radius (Instacart, Uber Eats)
1. Apply at https://impact.com
2. Search for "Instacart" in advertiser directory
3. Apply to program (approval: 1-3 days)
4. Get tracking links and postback URLs

#### ShareASale (HelloFresh, Blue Apron)
1. Sign up at https://shareasale.com
2. Apply to individual merchant programs
3. Get affiliate ID and tracking links
4. Set up conversion tracking

#### Amazon Associates (Grocery, Kitchen Products)
1. Sign up at https://affiliate-program.amazon.com
2. Add your website for review
3. Get approval (1-2 days)
4. Generate product links via SiteStripe

---

## Legal & Compliance

### Required Disclosures

#### 1. FTC Affiliate Disclosure
**Requirement:** Must disclose affiliate relationships

**Implementation:**
```javascript
// Add to footer and affiliate links
<div className="affiliate-disclosure">
  <p>
    <small>
      Disclosure: We may earn a commission when you purchase through
      our affiliate links. This helps us keep the service free.
      <a href="/disclosure">Learn more</a>
    </small>
  </p>
</div>
```

#### 2. Privacy Policy Update
Add section about advertising:
- Data collection by ad partners
- Cookie usage for tracking
- Opt-out options
- Third-party data sharing

#### 3. Terms of Service Update
- Subscription terms and billing
- Cancellation policy
- Refund policy (if any)
- Premium feature descriptions

---

## Metrics & Tracking

### Key Performance Indicators (KPIs)

**Advertising Metrics:**
- **CTR (Click-Through Rate):** 1-3% target for display ads
- **CPM (Cost Per Mille):** $2-5 target
- **Conversion Rate:** 3-10% for affiliate links
- **EPC (Earnings Per Click):** $0.10-1.00 target

**Subscription Metrics:**
- **Conversion Rate:** 3-7% free → premium
- **Churn Rate:** < 5% monthly target
- **LTV (Lifetime Value):** $50-200 per subscriber
- **CAC (Customer Acquisition Cost):** < $10 target

### Tracking Implementation

**Google Analytics 4:**
```javascript
// Track affiliate clicks
gtag('event', 'affiliate_click', {
  'affiliate_name': 'Instacart',
  'item_count': 15,
  'estimated_value': 75.00
});

// Track ad impressions
gtag('event', 'ad_impression', {
  'ad_unit': 'meal_plan_banner',
  'ad_network': 'Google AdSense'
});

// Track premium conversion
gtag('event', 'purchase', {
  'transaction_id': 'sub_123456',
  'value': 6.99,
  'currency': 'USD',
  'items': [{
    'item_name': 'Premium Subscription',
    'item_category': 'Subscription'
  }]
});
```

---

## Summary & Recommendations

### Quick Start (Week 1)
1. ✅ **Google AdSense** - Easiest, $100-200/month
2. ✅ **Instacart Affiliate** - High conversion, $100-200/month

**Expected:** $200-400/month with 4-6 hours work

### High Impact (Month 2-3)
3. ✅ **Meal Kit Affiliates** - High commissions, $200-400/month
4. ✅ **Premium Subscription** - Scalable, $175-500/month

**Expected:** $700-1400/month total

### Long-Term Strategy
- Focus on premium subscription (most scalable)
- Build brand partnerships for sponsored content
- Optimize ad placements based on metrics
- A/B test pricing and features

**Target:** $1500-2500/month within 6 months

---

**Document Version:** 1.0
**Last Updated:** December 2, 2025
**Next Review:** March 2025
