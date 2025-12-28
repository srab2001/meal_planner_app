# Workout SMS Feature

**Feature:** "Text Me My Workout"
**Module:** Fitness Coach
**Status:** Implemented

---

## Overview

Allows users to receive their workout via SMS with a secure link to check off exercises as they complete them. The check-off page is public (no auth required) but protected by a secure, time-limited token.

---

## User Flow

```
1. User generates workout via AI Coach
2. User clicks "Text me my workout"
3. Modal prompts for phone number (saved for next time)
4. SMS sent with secure link
5. User opens link on phone
6. User checks off exercises as they complete them
7. Progress persists and syncs back to main app
```

---

## Database Schema

### user_phones
Stores user phone numbers for SMS.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User reference |
| phone_number | VARCHAR(20) | E.164 format |
| is_verified | BOOLEAN | Verification status |
| verified_at | TIMESTAMP | When verified |

### workout_items
Individual exercises with completion tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| workout_id | UUID | Parent workout |
| exercise_name | VARCHAR(255) | Exercise name |
| section | VARCHAR(50) | warm_up, main, cool_down |
| item_order | INT | Display order |
| sets | INT | Number of sets |
| reps | VARCHAR(50) | Reps or duration |
| is_completed | BOOLEAN | Completion status |
| completed_at | TIMESTAMP | When completed |

### workout_share_tokens
Secure tokens for public workout access.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| workout_id | UUID | Workout reference |
| user_id | UUID | Owner reference |
| token | VARCHAR(64) | Secure random token |
| expires_at | TIMESTAMP | Expiration (24 hours) |
| is_used | BOOLEAN | Single-use tracking |

### sms_log
SMS delivery tracking for debugging and rate limiting.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Sender |
| phone_number | VARCHAR(20) | Recipient |
| message_type | VARCHAR(50) | workout_link, etc. |
| status | VARCHAR(20) | sent, delivered, failed |
| twilio_sid | VARCHAR(50) | Twilio message ID |

---

## API Endpoints

### Phone Management

**GET /api/fitness/sms/phone**
Get user's saved phone number (masked).

**POST /api/fitness/sms/phone**
Save/update user's phone number.
```json
{ "phone": "+11234567890" }
```

### Send Workout SMS

**POST /api/fitness/sms/send/:workoutId**
Generate share token and send SMS with workout link.

Response:
```json
{
  "success": true,
  "message": "Workout link sent to your phone!",
  "expiresAt": "2025-12-29T12:00:00Z",
  "expiresInHours": 24
}
```

### Public Check-Off (No Auth)

**GET /api/fitness/sms/workout/check-off/:token**
Get workout items for check-off.

Response:
```json
{
  "workoutId": "uuid",
  "date": "2025-12-28",
  "type": "strength",
  "sections": {
    "warm up": [
      { "id": "uuid", "name": "Jumping Jacks", "sets": 1, "reps": "30 seconds", "completed": false }
    ],
    "main": [...],
    "cool down": [...]
  },
  "totalItems": 12,
  "completedItems": 5,
  "isOwner": true
}
```

**POST /api/fitness/sms/workout/check-off/:token**
Toggle item completion.

Request:
```json
{ "itemId": "uuid", "completed": true }
```

Response:
```json
{
  "success": true,
  "item": { "id": "uuid", "completed": true, "completedAt": "2025-12-28T10:30:00Z" },
  "progress": { "total": 12, "completed": 6 }
}
```

**POST /api/fitness/sms/workout/check-off/:token/bulk**
Bulk operations (owner only).

Request:
```json
{ "action": "mark_all_done" }  // or "clear_all"
```

Response:
```json
{
  "success": true,
  "action": "mark_all_done",
  "progress": { "total": 12, "completed": 12 }
}
```

---

## Environment Variables

```env
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# Optional: Enable SMS in development
ENABLE_SMS_DEV=false

# Frontend URL for share links
FRONTEND_URL=https://frontend-six-topaz-27.vercel.app
```

---

## Security Considerations

1. **Token Security**
   - 32-byte random tokens (256-bit entropy)
   - Tokens stored as-is (not hashed) for quick lookup
   - 24-hour expiration by default
   - Single workout scope (token only works for one workout)

2. **Rate Limiting**
   - Max 5 SMS per user per hour
   - Prevents SMS abuse

3. **Phone Privacy**
   - Phone numbers masked in API responses (show last 4 digits only)
   - Phone numbers not logged in production

4. **Token Validation**
   - Check expiration before allowing access
   - Verify workout exists
   - No auth bypass for other data

---

## Frontend Pages

### WorkoutCheckOff (/workout/check-off/:token)
- Mobile-first design
- No authentication required
- Shows workout sections with exercises
- Tap to toggle completion
- Real-time progress bar
- Success animation when all complete

---

## Implementation Files

### Backend
- `fitness/prisma/schema.prisma` - Database schema
- `fitness/backend/lib/workoutToken.js` - Token generation/validation
- `fitness/backend/lib/sms.js` - Twilio wrapper + rate limiting
- `fitness/backend/routes/sms.js` - API routes

### Frontend
- `fitness/frontend/src/components/WorkoutCheckOff.jsx` - Check-off page
- `fitness/frontend/src/components/WorkoutCheckOff.css` - Styles
- `fitness/frontend/src/components/WorkoutPlanResult.jsx` - SMS toggle UI
- `fitness/frontend/src/App.jsx` - Route registration

---

## Event Logging

Events are logged without exposing sensitive data (tokens, phone numbers):

| Event | When Logged |
|-------|-------------|
| `workout_link_created` | Share token generated |
| `sms_requested` | SMS send initiated |
| `sms_sent` | SMS delivered successfully |
| `sms_failed` | SMS delivery failed |
| `item_checked` | Exercise marked complete |
| `item_unchecked` | Exercise marked incomplete |
| `bulk_mark_complete` | Owner marked all done |
| `bulk_clear_all` | Owner cleared all |
| `token_validated` | Valid token access |
| `token_expired` | Expired token rejected |
| `token_invalid` | Invalid token rejected |

---

## Testing

### Unit Tests
Located in `fitness/backend/__tests__/`:
- `workoutToken.test.js` - Token validation, URL generation
- `sms.test.js` - Phone validation, formatting, rate limits

Run tests: `cd fitness/backend && npm test`

---

## Future Enhancements

1. **Phone Verification** - Send OTP to verify phone ownership
2. **Push Notifications** - Web push as SMS alternative
3. **Workout Reminders** - Scheduled SMS reminders
4. **Share with Others** - Send workout to friends/family
5. **Offline Support** - Cache workout for offline check-off

---

**Version:** 1.1
**Created:** December 28, 2025
**Updated:** December 28, 2025 - Added owner controls, bulk operations, event logging, tests
