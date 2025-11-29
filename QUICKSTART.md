# 🚀 Quick Start Guide - AI Meal Planner Installation

## ⚡ Installation in 3 Minutes

### 📥 Step 1: Download Files (30 seconds)

Download these 5 files to your `~/Downloads` folder:

1. ✅ **complete-install.sh**
2. ✅ **create-backend-files.sh**
3. ✅ **create-frontend-files.sh**
4. ✅ **update-server.sh**
5. ✅ **UPDATE_APP_JS_GUIDE.md**

### 🔧 Step 2: Run Installation (2 minutes)

```bash
cd ~/Downloads
chmod +x *.sh
./complete-install.sh
```

Press **Y** when asked to confirm path.

### ✏️ Step 3: Update App.js (2 minutes)

```bash
open ~/Downloads/UPDATE_APP_JS_GUIDE.md
code ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp/client/src/App.js
```

Make 5 changes listed in the guide.

### ✅ Step 4: Fix Port (30 seconds)

```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp
nano .env
```

Change `PORT=3000` to `PORT=5000`
Save with: Ctrl+X, Y, Enter

### 🎉 Step 5: Test It! (1 minute)

**Terminal 1:**
```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp
npm start
```

**Terminal 2 (NEW window):**
```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp/client
npm start
```

Browser opens → Login → Enter ZIP → Select Store → Generate Meal Plan!

---

## 🎯 Expected Results

### ✅ Success Indicators:

**Terminal 1:**
```
Server running on port 5000
```

**Terminal 2:**
```
Compiled successfully!
webpack compiled successfully
```

**Browser:**
- Opens to `http://localhost:3000`
- Shows login page
- After login: ZIP code page appears ✨
- After ZIP: Store selection appears ✨
- After store: Questionnaire appears
- After questionnaire: Meal plan generates

---

## 🐛 Quick Fixes

### "Cannot find module './scrapers/price-cache'"

```bash
cd ~/Downloads
./create-backend-files.sh "/Users/stuartrabinowitz/Library/Mobile Documents/com~apple~CloudDocs/mealsapp"
```

### "Port 5000 already in use"

```bash
killall node
npm start
```

### "ZIPCodeInput is not defined"

Make sure you:
1. Ran `./create-frontend-files.sh`
2. Updated App.js to import ZIPCodeInput (see UPDATE_APP_JS_GUIDE.md)

### Backend runs on port 3000

```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp
echo "PORT=5000" > .env.port
cat .env | grep -v "^PORT=" > .env.temp
cat .env.port >> .env.temp
mv .env.temp .env
rm .env.port
npm start
```

---

## 📋 What Gets Installed

### Backend (4 files):
- `scrapers/price-cache.js` - Caching system
- `scrapers/base-scraper.js` - Base class
- `scrapers/harris-teeter-scraper.js` - Mock data (20 grocery items)
- `scrapers/pdf-parser.js` - PDF parsing

### Frontend (4 files):
- `client/src/components/ZIPCodeInput.js` - ZIP entry
- `client/src/components/ZIPCodeInput.css` - Styling
- `client/src/components/StoreSelection.js` - Store picker
- `client/src/components/StoreSelection.css` - Styling

### Updated:
- `server.js` - New endpoints: /api/find-stores, /api/scrape-store-prices
- `.env` - New variables: PRICE_CACHE_TTL, ENABLE_PRICE_SCRAPING

### Manual:
- `client/src/App.js` - You add new flow (5 changes)

---

## 💡 One-Command Installation

For experienced users, run everything at once:

```bash
cd ~/Downloads && \
chmod +x *.sh && \
./complete-install.sh && \
echo "Now update App.js using UPDATE_APP_JS_GUIDE.md"
```

Then manually:
1. Update App.js (see guide)
2. Fix .env PORT to 5000
3. Test!

---

## 🎓 App.js Changes Summary

Need to add:

**Imports:**
```javascript
import ZIPCodeInput from './components/ZIPCodeInput';
import StoreSelection from './components/StoreSelection';
```

**State:**
```javascript
const [zipCode, setZipCode] = useState('');
const [stores, setStores] = useState([]);
const [selectedStore, setSelectedStore] = useState(null);
```

**Handlers:**
```javascript
const handleZIPSubmit = ({ zipCode, stores }) => { ... };
const handleStoreSelect = (store) => { ... };
const handleBackToZIP = () => { ... };
```

**JSX:**
```javascript
{currentStep === 'zip' && <ZIPCodeInput ... />}
{currentStep === 'store' && <StoreSelection ... />}
```

**See UPDATE_APP_JS_GUIDE.md for complete code!**

---

## ✅ Verification Commands

```bash
# Check backend files
ls -lh ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp/scrapers/

# Check frontend files
ls -lh ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp/client/src/components/ | grep -E "ZIP|Store"

# Check server.js updated
grep "priceCache" ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp/server.js

# Check port setting
cat ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp/.env | grep PORT
```

---

## 🚀 Daily Usage

**Start:**
```bash
# Terminal 1
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp && npm start

# Terminal 2 (new window)
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/mealsapp/client && npm start
```

**Stop:**
- Press Ctrl+C in both terminals

---

## 📖 Full Documentation

For complete details, see:
- **README_INSTALLATION.md** - Full installation guide
- **UPDATE_APP_JS_GUIDE.md** - Detailed App.js instructions
- **PHASE_1_IMPLEMENTATION.md** - Technical details

---

## 🎉 That's It!

**Total time: ~5 minutes**

Questions? Check README_INSTALLATION.md for troubleshooting!
