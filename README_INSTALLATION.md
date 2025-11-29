# 🍽️ AI Meal Planner - Complete Installation Guide

## 📋 What This Installs

This package installs **Phases 1-3** of the AI Meal Planner enhancement:

### ✨ New Features:
- **Phase 1:** ZIP code entry + AI-powered store finder (using GPT)
- **Phase 2:** Price scraping system with caching (mock data for Harris Teeter)
- **Phase 3:** Enhanced meal generation with price awareness

### 🎯 User Flow:
1. Login with Google
2. Enter ZIP code
3. AI suggests nearby grocery stores
4. Select preferred store
5. Fill out meal preferences
6. Generate personalized meal plan with pricing

---

## 📥 Installation Files

Download these 5 files to your `~/Downloads` folder:

1. **complete-install.sh** - Master installation script (run this!)
2. **create-backend-files.sh** - Creates backend scraper files
3. **create-frontend-files.sh** - Creates React components
4. **update-server.sh** - Updates server.js with new endpoints
5. **UPDATE_APP_JS_GUIDE.md** - Guide for updating App.js

---

## ⚡ Quick Start (3 Commands)

```bash
# 1. Navigate to Downloads
cd ~/Downloads

# 2. Make scripts executable
chmod +x *.sh

# 3. Run installation
./complete-install.sh
```

That's it! The script will guide you through the rest.

---

## 📖 Detailed Installation Steps

### Step 1: Download All Files

Save all 5 files listed above to your `~/Downloads` folder.

### Step 2: Open Terminal

- Press `Command + Space`
- Type "Terminal"
- Press Enter

### Step 3: Navigate to Downloads

```bash
cd ~/Downloads
```

### Step 4: Make Scripts Executable

```bash
chmod +x complete-install.sh create-backend-files.sh create-frontend-files.sh update-server.sh
```

### Step 5: Run Master Installation Script

```bash
./complete-install.sh
```

**The script will:**
- Auto-detect your mealsapp directory
- Confirm the path with you
- Create all backend files
- Update server.js
- Create all frontend components
- Backup your existing files
- Show you next steps

### Step 6: Update App.js (Manual)

Open the guide:
```bash
open ~/Downloads/UPDATE_APP_JS_GUIDE.md
```

Then edit your App.js:
```bash
code ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp/client/src/App.js
```

Follow the instructions in UPDATE_APP_JS_GUIDE.md to make 5 changes.

### Step 7: Update .env (Important!)

```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp
nano .env
```

Make sure you have:
```
PORT=5000
OPENAI_API_KEY=sk-...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SESSION_SECRET=...
PRICE_CACHE_TTL=86400000
ENABLE_PRICE_SCRAPING=true
```

**CRITICAL:** Make sure `PORT=5000` (not 3000!)

### Step 8: Test the Installation

**Terminal 1 - Start Backend:**
```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp
npm start
```

You should see: `Server running on port 5000`

**Terminal 2 - Start Frontend (NEW terminal window):**
```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp/client
npm start
```

Browser should open to: `http://localhost:3000`

---

## 🎯 What Gets Installed

### Backend Files Created:
```
mealsapp/
├── scrapers/
│   ├── price-cache.js           (Caching system)
│   ├── base-scraper.js          (Base scraper class)
│   ├── harris-teeter-scraper.js (Mock price data - 20 items)
│   └── pdf-parser.js            (PDF parsing utility)
└── temp/                        (Temporary files)
```

### Frontend Files Created:
```
mealsapp/client/src/components/
├── ZIPCodeInput.js              (ZIP code entry page)
├── ZIPCodeInput.css             (Styling)
├── StoreSelection.js            (Store selection page)
└── StoreSelection.css           (Styling)
```

### Files Updated:
```
mealsapp/
├── server.js                    (New endpoints added)
├── .env                         (New variables added)
└── .gitignore                   (Updated)
```

### Files You Update Manually:
```
mealsapp/client/src/
└── App.js                       (Add new flow)
```

---

## 🔍 Verification

After installation, verify everything is in place:

```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp

# Check backend files exist
ls -lh scrapers/
# Should show 4 files with content (not 0 bytes)

# Check frontend files exist
ls -lh client/src/components/ | grep -E "ZIP|Store"
# Should show 4 files

# Check server.js was updated
grep "priceCache" server.js
# Should see: const priceCache = require('./scrapers/price-cache');

# Check .env has new variables
cat .env | grep PRICE_CACHE_TTL
# Should see: PRICE_CACHE_TTL=86400000
```

---

## 🧪 Testing the New Features

1. **Start both servers** (backend on 5000, frontend on 3000)
2. **Login** with Google
3. **Enter ZIP code** (e.g., 27617)
4. **See store list** - AI-generated stores for your area
5. **Select a store** (e.g., Harris Teeter)
6. **Fill questionnaire** - Should show selected store
7. **Generate meal plan** - Should complete successfully

---

## 🐛 Troubleshooting

### Issue: "Cannot find module './scrapers/price-cache'"

**Fix:**
```bash
cd ~/Downloads
./create-backend-files.sh "/Users/stuartrabinowitz/Library/Mobile Documents/com~apple~CloudDocs/mealsapp"
```

### Issue: "Port 5000 already in use"

**Fix:**
```bash
killall node
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp
npm start
```

### Issue: "ZIPCodeInput is not defined"

**Fix:**
```bash
cd ~/Downloads
./create-frontend-files.sh "/Users/stuartrabinowitz/Library/Mobile Documents/com~apple~CloudDocs/mealsapp"
```

Then make sure you updated App.js to import it.

### Issue: Backend runs on port 3000 instead of 5000

**Fix:**
```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp
nano .env
# Change PORT=3000 to PORT=5000
# Save and restart backend
```

### Issue: Frontend can't connect to backend

**Check:**
1. Backend is running on port 5000
2. Frontend is running on port 3000
3. `client/package.json` has: `"proxy": "http://localhost:5000"`

---

## 📚 Documentation Files

All documentation available in `~/Downloads`:

- **README_INSTALLATION.md** (this file) - Complete installation guide
- **UPDATE_APP_JS_GUIDE.md** - Detailed App.js update instructions
- **PHASE_1_IMPLEMENTATION.md** - Technical implementation details
- **COMPLETE_INSTALLATION_README.md** - Full reference documentation

---

## 🚀 Running the App (Daily Use)

### Starting the App:

**Terminal 1 - Backend:**
```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp
npm start
```

**Terminal 2 - Frontend (NEW terminal):**
```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp/client
npm start
```

Browser opens automatically to: `http://localhost:3000`

### Stopping the App:

Press `Control + C` in both terminals.

---

## 💡 Pro Tips

### Create Aliases for Easy Starting

Add to your `~/.zshrc` or `~/.bash_profile`:

```bash
alias mealsapp-backend='cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp && npm start'
alias mealsapp-frontend='cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp/client && npm start'
```

Then use:
```bash
mealsapp-backend    # Start backend
mealsapp-frontend   # Start frontend (in new terminal)
```

### Create Startup Script

Save this as `~/start-mealsapp.sh`:

```bash
#!/bin/bash
osascript -e 'tell app "Terminal"
    do script "cd ~/Library/Mobile\\ Documents/com~apple~CloudDocs/mealsapp && npm start"
end tell'
sleep 3
osascript -e 'tell app "Terminal"
    do script "cd ~/Library/Mobile\\ Documents/com~apple~CloudDocs/mealsapp/client && npm start"
end tell'
```

Make executable:
```bash
chmod +x ~/start-mealsapp.sh
```

Run with:
```bash
~/start-mealsapp.sh
```

---

## 🔄 Restore from Backup

If something goes wrong, restore from automatic backups:

```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp

# List backups
ls -d backup_*

# Restore from most recent backup
cp backup_YYYYMMDD_HHMMSS/server.js ./
cp backup_YYYYMMDD_HHMMSS/App.js client/src/
cp backup_YYYYMMDD_HHMMSS/.env ./
```

---

## 📞 Support

### Common Commands

```bash
# Check what's running
lsof -i :5000  # Backend
lsof -i :3000  # Frontend

# Kill all node processes
killall node

# View backend logs
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp
npm start 2>&1 | tee backend.log

# Reinstall dependencies
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp
npm install
cd client && npm install
```

### File Locations

- **Backend:** `~/Library/Mobile Documents/com~apple~CloudDocs/mealsapp/`
- **Frontend:** `~/Library/Mobile Documents/com~apple~CloudDocs/mealsapp/client/`
- **Installation Scripts:** `~/Downloads/`
- **Backups:** `~/Library/Mobile Documents/com~apple~CloudDocs/mealsapp/backup_*/`

---

## ✅ Installation Checklist

- [ ] Downloaded all 5 installation files
- [ ] Made scripts executable (`chmod +x *.sh`)
- [ ] Ran `./complete-install.sh`
- [ ] Backend files created (4 files in scrapers/)
- [ ] Frontend components created (4 files)
- [ ] server.js updated with new endpoints
- [ ] Updated App.js manually (see UPDATE_APP_JS_GUIDE.md)
- [ ] Verified .env has PORT=5000
- [ ] Started backend on port 5000
- [ ] Started frontend on port 3000
- [ ] Tested complete flow (login → ZIP → store → questionnaire → meal plan)

---

## 🎉 Success!

If you can:
1. Login with Google
2. Enter a ZIP code
3. See a list of stores
4. Select a store
5. Generate a meal plan

**You're all set! Enjoy your AI Meal Planner!** 🍽️

---

**Questions? Check UPDATE_APP_JS_GUIDE.md for detailed App.js instructions.**
