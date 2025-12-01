# Paywall and Payment Setup Guide

## Overview

The meal planner app includes a paywall with Stripe integration and discount code support. Users must pay ($9.99) or use a valid discount code before generating meal plans.

## Features

- ✅ Stripe payment integration
- ✅ Discount code system with configurable codes
- ✅ Free access codes for testers
- ✅ Session-based payment verification
- ✅ Payment status persistence

## Setup Instructions

### 1. Create Stripe Account

1. Go to https://stripe.com
2. Create an account (or login)
3. Get your API keys from the Dashboard

### 2. Get Stripe API Keys

**Test Mode (for development):**
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

**Live Mode (for production):**
1. Complete Stripe account verification
2. Go to https://dashboard.stripe.com/apikeys
3. Copy your **Publishable key** (starts with `pk_live_`)
4. Copy your **Secret key** (starts with `sk_live_`)

### 3. Configure Environment Variables

**Backend (.env):**
```bash
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

**Render Dashboard:**
1. Go to your service settings
2. Add environment variables:
   - `STRIPE_SECRET_KEY` = your secret key
   - `STRIPE_PUBLISHABLE_KEY` = your publishable key

### 4. Configure Discount Codes

Edit `server.js` to add/modify discount codes:

```javascript
const DISCOUNT_CODES = {
  'TESTFREE': { percentOff: 100, description: 'Free access for testers' },
  'BETA50': { percentOff: 50, description: '50% off for beta testers' },
  'WELCOME25': { percentOff: 25, description: '25% off welcome discount' },
};
```

**Adding a new code:**
```javascript
'YOURCODEHERE': { percentOff: 100, description: 'Your description' },
```

### 5. Default Discount Codes

| Code | Discount | Purpose |
|------|----------|---------|
| `TESTFREE` | 100% (FREE) | Testing access |
| `BETA50` | 50% OFF | Beta testers |
| `WELCOME25` | 25% OFF | New users |

## User Flow

### With Payment:
1. Login with Google
2. Enter ZIP code
3. Select grocery store
4. Fill out questionnaire
5. **Payment page** → Pay $9.99 via Stripe
6. Generate meal plan

### With Discount Code:
1. Login with Google
2. Enter ZIP code
3. Select grocery store
4. Fill out questionnaire
5. **Payment page** → Enter code (e.g., `TESTFREE`)
6. If 100% off: Skip payment, generate meal plan
7. If partial discount: Pay reduced amount via Stripe

### Returning User:
- If user already paid in current session, payment page is skipped
- Payment status stored in session
- Lost on logout or session expiration

## Testing

### Test with Free Code:
1. Complete questionnaire
2. On payment page, enter: `TESTFREE`
3. Click "Apply"
4. Should show "FREE" badge
5. Click "Get Free Meal Plan"
6. Meal plan should generate

### Test with Stripe (Test Mode):
1. Complete questionnaire
2. On payment page, leave code blank or use `BETA50`
3. Click "Pay $X.XX - Get Meal Plan"
4. Redirects to Stripe checkout
5. Use test card: `4242 4242 4242 4242`
6. Use any future expiry date and any CVC
7. Complete payment
8. Redirects back to app
9. Meal plan should generate

### Stripe Test Cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0027 6000 3184`

Any future expiry, any CVC, any ZIP code.

## Price Configuration

To change the price, edit `server.js` and `PaymentPage.js`:

**Backend (server.js):**
```javascript
const basePrice = 999; // $9.99 in cents
```

**Frontend (PaymentPage.js):**
```javascript
const PRICE = 9.99; // Base price in dollars
```

## API Endpoints

### POST /api/validate-discount
Validates a discount code.

**Request:**
```json
{
  "code": "TESTFREE"
}
```

**Response (valid):**
```json
{
  "valid": true,
  "code": "TESTFREE",
  "percentOff": 100,
  "description": "Free access for testers"
}
```

### POST /api/apply-free-access
Applies 100% discount code (no payment needed).

**Request:**
```json
{
  "code": "TESTFREE"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Free access granted"
}
```

### POST /api/create-checkout-session
Creates a Stripe checkout session.

**Request:**
```json
{
  "discountCode": "BETA50" // optional
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_..."
}
```

### POST /api/verify-payment
Verifies payment completion after Stripe redirect.

**Request:**
```json
{
  "sessionId": "cs_test_..."
}
```

**Response:**
```json
{
  "success": true,
  "verified": true
}
```

### GET /api/payment-status
Checks if user has paid access.

**Response:**
```json
{
  "hasPaidAccess": true
}
```

## Security Notes

- ✅ All payment endpoints require authentication (`requireAuth`)
- ✅ Stripe Secret Key never exposed to frontend
- ✅ Payment verification done server-side
- ✅ Session-based access control
- ⚠️ Discount codes are hardcoded (consider database for production)
- ⚠️ Session data lost on logout (consider database for persistent access)

## Production Checklist

- [ ] Switch to Stripe Live API keys
- [ ] Test payment flow end-to-end
- [ ] Set up Stripe webhook for payment verification
- [ ] Consider database for payment records
- [ ] Consider database for discount codes
- [ ] Set up proper session store (not MemoryStore)
- [ ] Configure proper success/cancel URLs
- [ ] Test all discount codes
- [ ] Review Stripe dashboard for test transactions
- [ ] Set up email receipts via Stripe

## Troubleshooting

### Payment page not showing:
- Check that `PaymentPage` is imported in `App.js`
- Check browser console for errors
- Verify payment status API is reachable

### Stripe checkout fails:
- Verify `STRIPE_SECRET_KEY` is set correctly
- Check Render logs for Stripe initialization
- Ensure `FRONTEND_BASE` is set for success/cancel URLs

### Discount code not working:
- Codes are case-sensitive (auto-uppercased)
- Check `DISCOUNT_CODES` object in `server.js`
- Check backend logs for validation errors

### "Payment system not configured" error:
- `STRIPE_SECRET_KEY` not set in environment
- Restart server after adding the key

## Support

For issues with:
- **Stripe setup**: https://stripe.com/docs
- **Test cards**: https://stripe.com/docs/testing
- **Webhooks**: https://stripe.com/docs/webhooks

---

**Ready to test?** Use discount code `TESTFREE` for free access!
