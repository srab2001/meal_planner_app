# 🍽️ Cuisine & Dietary Options Setup

## Problem
Getting "failed to create" error when trying to add cuisines in the admin panel.

## Solution
The `cuisine_options` and `dietary_options` tables need to be created in your database.

## How to Fix (3 Simple Steps)

### Step 1: Open TablePlus
1. Open TablePlus on your computer
2. Connect to your PostgreSQL database

### Step 2: Run the Setup Script
1. In TablePlus, click the "SQL" button (or press ⌘+E / Ctrl+E)
2. Open the file: `migrations/SETUP_CUISINES.sql`
3. Copy ALL the contents
4. Paste into TablePlus SQL window
5. Click "Run" or press ⌘+Enter / Ctrl+Enter

### Step 3: Verify Success
You should see output like:
```
✅ Cuisines Created: 18
✅ Dietary Options Created: 10
✅ Setup complete! You can now add cuisines from the admin panel.
```

## What This Does

Creates two new tables:
- **cuisine_options**: Stores cuisine types (Italian, Mexican, etc.)
- **dietary_options**: Stores dietary preferences (Vegan, Gluten-Free, etc.)

Populates them with default values:
- 18 popular cuisines
- 10 common dietary options

## After Running the Migration

1. Refresh your admin panel page
2. Go to the "🍽️ Options" tab
3. You should see the existing cuisines listed
4. You can now add new cuisines successfully!

## Adding a New Cuisine

Example:
- **Cuisine Name**: Ethiopian
- **Display Order**: 19 (or leave blank for default)
- Click "Add Cuisine"

The new cuisine will appear in:
- Questionnaire dropdown
- Profile settings
- Anywhere cuisines are shown in the app

## Troubleshooting

**Still seeing errors?**
1. Check browser console (F12) for specific error messages
2. Verify you're connected to the correct database
3. Make sure your database user has CREATE TABLE permissions
4. Check that the migrations ran without errors

**Need help?**
Check the browser console logs - they now include detailed error messages.
