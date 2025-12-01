# Discount Code Usage Tracking

The system now automatically tracks which users use which discount codes, including their email addresses.

## What's Tracked

Every time a user validates or applies a discount code, the system logs:
- **User email address** (from Google OAuth)
- **Discount code used** (e.g., TESTFREE, BETA50)
- **Percentage off** (100%, 50%, 25%, etc.)
- **Usage type**:
  - `validated` - User entered code and it was validated
  - `applied_free` - User applied a 100% off code (free access)
  - `applied_paid` - User applied a partial discount code and went to Stripe checkout
- **Timestamp** (ISO format)
- **Formatted date** (Eastern Time)

## Data Storage

All tracking data is stored in: `discount-code-usage.json`

**Important:** This file is automatically added to `.gitignore` to protect user privacy. It will NOT be committed to your git repository.

Example entry:
```json
{
  "email": "user@example.com",
  "code": "TESTFREE",
  "percentOff": 100,
  "usageType": "applied_free",
  "timestamp": "2025-12-01T12:30:45.123Z",
  "date": "12/1/2025, 7:30:45 AM"
}
```

## Viewing Statistics

### Option 1: Via API Endpoint (Recommended)

Access the statistics endpoint in your browser or via curl:

**Local:**
```
http://localhost:5000/api/discount-usage-stats
```

**Production:**
```
https://meal-planner-app-mve2.onrender.com/api/discount-usage-stats
```

This returns:
- **totalRecords**: Total number of tracking entries
- **usageByCode**: Statistics for each discount code
  - Total uses
  - Unique users who used it
  - Breakdown by usage type
- **usageByEmail**: Which codes each user has used
- **recentUsage**: Last 20 discount code uses
- **summary**: Quick overview (most used code, total users, etc.)

### Option 2: Direct File Access

On your Render server, you can view the raw JSON file:

```bash
cat discount-code-usage.json
```

Or download it for analysis in Excel/Google Sheets.

## Example Usage Analysis

To see which email used TESTFREE:
1. Go to `https://meal-planner-app-mve2.onrender.com/api/discount-usage-stats`
2. Look at the `usageByCode.TESTFREE.users` array
3. You'll see all email addresses that used that code

To see all codes a specific user tried:
1. Go to the same URL
2. Look at `usageByEmail["user@example.com"].codesUsed`

## Common Use Cases

**Track beta tester usage:**
- Check `usageByCode.BETA50.users` to see who's using your beta discount

**Find your most popular code:**
- Look at `summary.mostUsedCode`

**See recent activity:**
- Check `recentUsage` array for last 20 code uses with timestamps

**Verify someone used their code:**
- Search for their email in the `usageByEmail` object

## Privacy & Security

- ⚠️ This file contains personal email addresses
- ✅ Automatically excluded from git commits
- ✅ Only accessible on your backend server
- ⚠️ The `/api/discount-usage-stats` endpoint is public (no auth required)
  - Consider adding authentication if this is a concern
  - Or download the file manually and remove the endpoint

## Tips

1. **Regular backups**: Download `discount-code-usage.json` periodically for your records
2. **Spreadsheet analysis**: Import the JSON into Excel/Google Sheets for deeper analysis
3. **Monitor usage**: Check the stats endpoint regularly to see which codes are popular
4. **Marketing insights**: See which codes convert to actual applications vs just validations

## Disabling Tracking

If you want to disable tracking, comment out or remove the `trackDiscountCodeUsage()` calls in `server.js`:
- Line ~637 (validate endpoint)
- Line ~680 (free access endpoint)
- Line ~753 (paid checkout endpoint)
