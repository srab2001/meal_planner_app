# AdSense Implementation Guide

## Step 1: Apply for Google AdSense

1. Go to https://www.google.com/adsense
2. Sign up with your Google account
3. Submit your website URL: https://meal-planner-app-chi.vercel.app
4. Wait 1-3 days for approval

## Step 2: Install AdSense Code

### A. Add AdSense Script to HTML

**File:** `client/public/index.html`

```html
<head>
  <!-- Existing head content -->

  <!-- Google AdSense -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
       crossorigin="anonymous"></script>
</head>
```

### B. Create Reusable Ad Component

**File:** `client/src/components/AdSense.js`

```javascript
import React, { useEffect } from 'react';
import './AdSense.css';

function AdSense({
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  style = {},
  className = ''
}) {
  useEffect(() => {
    try {
      // Only load ads in production
      if (process.env.NODE_ENV === 'production') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  // Don't show ads in development
  if (process.env.NODE_ENV !== 'production') {
    return (
      <div className={`ad-placeholder ${className}`} style={style}>
        <p>📢 Ad Space (Development Mode)</p>
      </div>
    );
  }

  return (
    <div className={`ad-container ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive}
      ></ins>
    </div>
  );
}

export default AdSense;
```

**File:** `client/src/components/AdSense.css`

```css
.ad-container {
  margin: 20px 0;
  text-align: center;
  min-height: 100px;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
}

.ad-placeholder {
  padding: 30px;
  background: #e0e0e0;
  border: 2px dashed #999;
  border-radius: 8px;
  color: #666;
  font-style: italic;
}

/* Mobile optimization */
@media (max-width: 768px) {
  .ad-container {
    margin: 15px 0;
  }
}
```

## Step 3: Add Ads to Components

### A. Banner Ad in Meal Plan View

**File:** `client/src/components/MealPlanView.js`

```javascript
import AdSense from './AdSense';

function MealPlanView({ mealPlan, preferences, user, ... }) {
  // Check if user has premium (no ads)
  const showAds = !user?.isPremium;

  return (
    <div className="meal-plan-container">
      {/* Existing header */}

      {/* Top Banner Ad */}
      {showAds && (
        <AdSense
          adSlot="1234567890"
          adFormat="horizontal"
          className="top-banner-ad"
        />
      )}

      {/* Tabs */}
      <div className="meal-plan-tabs">
        {/* ... */}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'meals' && (
          <div className="meals-view">
            {/* Day selector */}
            {/* Meals grid */}

            {/* Ad between meals and preferences */}
            {showAds && (
              <AdSense
                adSlot="0987654321"
                adFormat="rectangle"
                style={{ margin: '30px 0' }}
              />
            )}

            {/* Preferences summary */}
          </div>
        )}
      </div>

      {/* Bottom Banner Ad (Mobile) */}
      {showAds && (
        <div className="mobile-bottom-ad">
          <AdSense
            adSlot="1122334455"
            adFormat="horizontal"
          />
        </div>
      )}
    </div>
  );
}
```

### B. Loading Screen Ad

**File:** `client/src/App.js`

```javascript
{currentView === 'loading' && (
  <div className="loading-screen">
    <div className="loading-content">
      <div className="spinner-large"></div>
      <h2>Creating your meal plan</h2>
      <p>This can take up to 30 seconds</p>

      {/* Ad during loading */}
      {!user?.isPremium && (
        <div style={{ marginTop: '40px', maxWidth: '600px', margin: '40px auto' }}>
          <AdSense
            adSlot="5544332211"
            adFormat="rectangle"
          />
        </div>
      )}
    </div>
  </div>
)}
```

### C. Recipe Modal Ad

**File:** `client/src/components/MealPlanView.js` (Recipe Modal)

```javascript
{selectedMeal && (
  <div className="modal-overlay" onClick={closeModal}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <button className="modal-close" onClick={closeModal}>✕</button>

      <h2 className="recipe-title">{selectedMeal.name}</h2>

      {/* Recipe content */}

      {/* Ad at bottom of recipe */}
      {!user?.isPremium && (
        <AdSense
          adSlot="6677889900"
          adFormat="rectangle"
          style={{ marginTop: '30px' }}
        />
      )}

      {/* Modal actions */}
    </div>
  </div>
)}
```

## Step 4: Ad Unit Types & Sizes

Create these ad units in AdSense dashboard:

1. **Top Banner** (728x90 Leaderboard)
   - Desktop: Full width
   - Mobile: 320x50 or 320x100

2. **Rectangle** (300x250 Medium Rectangle)
   - Works everywhere
   - Best performance

3. **Mobile Banner** (320x50 Mobile Banner)
   - Bottom of mobile screen
   - Fixed position

4. **Large Rectangle** (336x280)
   - Higher CPM
   - Desktop only

5. **Responsive** (Auto-sizing)
   - Adapts to container
   - Recommended for most placements

## Step 5: Check User Premium Status

Update user subscription check to control ads:

**File:** `server.js`

```javascript
// Add isPremium flag to user object
app.get('/auth/user', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check subscription
    const subscription = await db.query(
      'SELECT plan_type FROM subscriptions WHERE user_id = $1',
      [decoded.userId]
    );

    const isPremium = subscription.rows[0]?.plan_type === 'premium';

    res.json({
      user: {
        ...decoded,
        isPremium
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});
```

## Step 6: Revenue Optimization

### A. Ad Placement Testing

Track which placements perform best:

```javascript
// Track ad impressions
const logAdImpression = (adSlot, adLocation) => {
  fetch(`${API_BASE}/api/analytics/ad-impression`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      adSlot,
      location: adLocation,
      timestamp: new Date()
    })
  });
};
```

### B. Frequency Capping

Limit ad impressions per user per session:

```javascript
const [adImpressions, setAdImpressions] = useState(0);
const MAX_ADS_PER_SESSION = 5;

const shouldShowAd = () => {
  return !user?.isPremium && adImpressions < MAX_ADS_PER_SESSION;
};
```

## Step 7: Best Practices

### Do's:
- ✅ Place ads naturally in content flow
- ✅ Use responsive ad units
- ✅ Test different placements
- ✅ Offer premium ad-free option
- ✅ Label ads clearly (if required)
- ✅ Monitor ad performance in AdSense dashboard

### Don'ts:
- ❌ Don't place ads too close together
- ❌ Don't use more than 3 ads per page
- ❌ Don't hide or disguise ads
- ❌ Don't click your own ads (instant ban)
- ❌ Don't use misleading ad labels
- ❌ Don't place ads on error pages

## Step 8: Expected Revenue

**Estimate for your app:**

Assuming:
- 10,000 monthly users
- 3 page views per user = 30,000 pageviews
- 3 ad impressions per pageview = 90,000 ad impressions
- $2 CPM (conservative for food content)
- 1% CTR = 900 clicks @ $0.50 CPC

**Monthly Revenue:**
- CPM: 90,000 impressions × ($2/1000) = $180
- CPC: 900 clicks × $0.50 = $450
- **Total: ~$630/month**

With 50k users: **~$3,150/month**
With 100k users: **~$6,300/month**

Food content typically gets $5-10 CPM with premium ad networks (Mediavine/AdThrive) once you hit traffic thresholds.

## Step 9: Alternatives to Consider

**Higher Revenue Options:**

1. **Affiliate Marketing** (Build yourself)
   - Amazon Associates: 3-5% commission on kitchen products
   - HelloFresh: $10-40 per referral
   - Instacart: Ongoing commission on orders
   - Potential: $1,000-5,000/month with same traffic

2. **Sponsored Content**
   - Brands pay for featured recipes
   - $500-2,000 per sponsored meal
   - Potential: $2,000-10,000/month

3. **Premium Subscription** (You have this!)
   - $4.99/month × 500 premium users = $2,495/month
   - No ads needed
   - Better UX

## Recommended Strategy

**Phase 1: Start with AdSense** (Immediate)
- Easy approval
- Quick implementation
- Test ad placements
- Gather data

**Phase 2: Add Affiliate Links** (Month 2)
- Amazon kitchen products in recipes
- Grocery delivery referrals
- Better revenue per user

**Phase 3: Apply to Premium Networks** (After 50k visitors)
- Mediavine or AdThrive
- 3-5x revenue increase
- Professional ad management

**Phase 4: Sponsored Content** (After 100k visitors)
- Direct brand partnerships
- Highest revenue potential
- Maintain editorial control

## Next Steps

1. Apply for AdSense (today)
2. Implement ad component (1 hour)
3. Add 2-3 ad placements (30 min)
4. Test in production (1 day)
5. Monitor performance (ongoing)
6. Optimize based on data (weekly)

Would you like me to implement the AdSense component for you?
