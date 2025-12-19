# Referral System Rules

## Overview

The ASR Health Portal referral system allows users to invite friends and earn rewards. This document outlines the rules, limits, and anti-abuse measures.

## How It Works

### For Referrers
1. Log in to your account
2. Go to Progress → Referrals tab
3. Find your unique referral code (e.g., `JOHN123`)
4. Share the code with friends

### For New Users
1. Sign up for ASR Health Portal
2. Go to Progress → Referrals tab
3. Enter the referral code in the "Have a referral code?" section
4. Click "Apply Code"

## Rewards

| Action | Reward |
|--------|--------|
| Referrer: Each successful referral | 1 month free premium |
| New User: Using a referral code | 2 weeks free premium |

## Rules & Limits

### Referral Code Rules
1. **One Code Per User** - Each user gets exactly one referral code
2. **Persistent Code** - Your code never changes
3. **Maximum 10 Uses** - Each code can be used by up to 10 people

### Redemption Rules
1. **One-Time Use** - Each new user can only redeem ONE referral code, ever
2. **No Self-Referral** - You cannot use your own referral code
3. **Immediate Application** - Rewards are applied instantly upon successful redemption

### Limits
| Limit | Value | Reason |
|-------|-------|--------|
| Max redemptions per code | 10 | Prevents reward farming |
| Codes per user | 1 | Simplifies tracking |
| Redemptions per new user | 1 | Prevents double-dipping |

## Anti-Abuse Measures

### 1. Self-Referral Prevention
**What**: Users cannot redeem their own referral code

**How**: System compares the redeeming user's ID against the code owner's ID

**Error Message**: "You cannot use your own referral code"

### 2. Duplicate Redemption Prevention
**What**: Users who already used a referral code cannot use another

**How**: System checks if user has any prior referral redemption

**Error Message**: "You have already used a referral code"

### 3. Code Usage Limits
**What**: Each code can only be redeemed 10 times

**How**: Counter tracks redemptions per code

**Error Message**: "This referral code has reached its maximum uses"

### 4. Invalid Code Handling
**What**: System validates code existence before processing

**How**: Lookup against referral codes registry

**Error Message**: "Invalid referral code"

## Code Format

Referral codes follow this pattern:
```
{FIRSTNAME}{RANDOM_4_DIGITS}
```

Examples:
- `JOHN1234`
- `SARAH9876`
- `MIKE5432`

## Data Storage

### Current Implementation (LocalStorage)
```javascript
// User's referral data
{
  "code": "JOHN1234",
  "createdAt": "2024-01-15T10:30:00Z",
  "referrals": [
    {
      "userId": "user_456",
      "redeemedAt": "2024-01-20T14:22:00Z",
      "rewardClaimed": true
    }
  ],
  "wasReferred": false,
  "referredBy": null
}

// Global referral codes index
{
  "JOHN1234": { "ownerId": "user_123", "timesUsed": 3 }
}
```

## FAQ

### Q: What if my referral code isn't working?
A: Check that:
1. The code is entered correctly (case-insensitive)
2. The code hasn't reached its 10-use limit
3. You haven't already used a different referral code

### Q: Can I get a new referral code?
A: No, each user has one permanent code. This prevents gaming the system.

### Q: What happens to pending referrals if my code hits the limit?
A: The code immediately becomes inactive. Users will see "code has reached maximum uses."

### Q: Do referral rewards expire?
A: Currently, rewards are applied immediately and do not expire.

### Q: Can I refer someone who already has an account?
A: Referral codes can only be used by users who haven't already redeemed a code.

## Edge Cases

### User Deletes Account
- Referral code becomes invalid
- Existing referrals retain their rewards
- Referred users keep their status

### Multiple Attempts
- Rate limiting prevents rapid submission
- Each failed attempt is logged

### Code Collision
- Extremely unlikely with random 4-digit suffix
- System would regenerate if collision detected

## Future Enhancements

1. **Tiered Rewards** - Better rewards for more referrals
2. **Time-Limited Codes** - Promotional codes with expiration
3. **Admin Override** - Reset code limits for special cases
4. **Referral Tracking** - See which referrals converted to paid users

## Support

If you experience issues with the referral system:
1. Check this document for rules
2. Contact support with your username and referral code
3. Include any error messages received
