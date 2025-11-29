#!/bin/bash

# ============================================
# FRESH INSTALLATION SCRIPT
# Creates ALL directories and files from scratch
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ $1${NC}"; }
print_step() { echo -e "${BLUE}▶ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

echo "=============================================="
echo "   FRESH INSTALLATION"
echo "   Complete Directory Structure Setup"
echo "=============================================="
echo ""

# Default path
DEFAULT_PATH="/Users/stuartrabinowitz/Library/Mobile Documents/com~apple~CloudDocs/mealsapp/mealsapp"

if [ -z "$1" ]; then
    print_info "Using default path:"
    echo "  $DEFAULT_PATH"
    echo ""
    read -p "Is this correct? (Y/n): " confirm
    if [[ "$confirm" =~ ^[Nn]$ ]]; then
        echo ""
        echo "Enter the path to your mealsapp project:"
        read -p "Path: " PROJECT_DIR
    else
        PROJECT_DIR="$DEFAULT_PATH"
    fi
else
    PROJECT_DIR="$1"
fi

echo ""
print_info "Installing to: $PROJECT_DIR"
echo ""

# Check if directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Directory not found: $PROJECT_DIR"
    echo ""
    read -p "Create it? (y/N): " create_dir
    if [[ "$create_dir" =~ ^[Yy]$ ]]; then
        mkdir -p "$PROJECT_DIR"
        print_success "Created directory"
    else
        echo "Aborting."
        exit 1
    fi
fi

cd "$PROJECT_DIR"

# Create backup
BACKUP_DIR="backup_fresh_install_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup important files if they exist
if [ -f "server.js" ]; then
    cp server.js "$BACKUP_DIR/"
    print_info "Backed up server.js"
fi

if [ -f ".env" ]; then
    cp .env "$BACKUP_DIR/"
    print_info "Backed up .env"
fi

if [ -f "client/src/App.js" ]; then
    mkdir -p "$BACKUP_DIR/client/src"
    cp client/src/App.js "$BACKUP_DIR/client/src/"
    print_info "Backed up App.js"
fi

echo ""

# ============================================
# STEP 1: Create Directory Structure
# ============================================
print_step "Step 1: Creating directory structure..."
echo ""

# Backend directories
mkdir -p scrapers
mkdir -p temp
print_success "Created backend directories"

# Frontend directories
mkdir -p client/src/components
mkdir -p client/public
print_success "Created frontend directories"

echo ""

# ============================================
# STEP 2: Create Backend Files
# ============================================
print_step "Step 2: Creating backend files..."
echo ""

# Check if create-backend-files.sh exists
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -f "$SCRIPT_DIR/create-backend-files.sh" ]; then
    print_info "Running create-backend-files.sh..."
    "$SCRIPT_DIR/create-backend-files.sh" "$PROJECT_DIR"
else
    print_info "create-backend-files.sh not found, creating files manually..."
    
    # Create price-cache.js inline
    cat > scrapers/price-cache.js << 'PRICECACHE'
const NodeCache = require('node-cache');

class PriceCache {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: 86400,
      checkperiod: 600,
      useClones: false
    });
  }

  generateKey(storeName, zipCode) {
    return `${storeName.toLowerCase().replace(/\s+/g, '-')}-${zipCode}`;
  }

  get(storeName, zipCode) {
    const key = this.generateKey(storeName, zipCode);
    return this.cache.get(key);
  }

  set(storeName, zipCode, data) {
    const key = this.generateKey(storeName, zipCode);
    const valueToCache = {
      ...data,
      cachedAt: new Date().toISOString()
    };
    return this.cache.set(key, valueToCache);
  }

  has(storeName, zipCode) {
    const key = this.generateKey(storeName, zipCode);
    return this.cache.has(key);
  }

  delete(storeName, zipCode) {
    const key = this.generateKey(storeName, zipCode);
    return this.cache.del(key);
  }

  flush() {
    return this.cache.flushAll();
  }

  getStats() {
    return this.cache.getStats();
  }
}

module.exports = new PriceCache();
PRICECACHE
    print_success "Created scrapers/price-cache.js"
    
    # Create base-scraper.js
    cat > scrapers/base-scraper.js << 'BASESCRAPER'
class BaseScraper {
  async scrape(zipCode) {
    throw new Error('scrape() must be implemented by subclass');
  }

  formatPrice(priceString) {
    if (typeof priceString === 'number') {
      return priceString;
    }
    const cleanPrice = priceString.replace(/[^0-9.]/g, '');
    return parseFloat(cleanPrice) || 0;
  }

  formatItem(rawItem) {
    return {
      name: rawItem.name || 'Unknown Item',
      price: this.formatPrice(rawItem.price || 0),
      regularPrice: rawItem.regularPrice ? this.formatPrice(rawItem.regularPrice) : null,
      unit: rawItem.unit || 'each',
      category: rawItem.category || 'General',
      onSale: rawItem.onSale || false,
      description: rawItem.description || '',
      brand: rawItem.brand || ''
    };
  }

  calculateSavings(items) {
    return items.reduce((total, item) => {
      if (item.onSale && item.regularPrice) {
        return total + (item.regularPrice - item.price);
      }
      return total;
    }, 0);
  }
}

module.exports = BaseScraper;
BASESCRAPER
    print_success "Created scrapers/base-scraper.js"
    
    # Create harris-teeter-scraper.js with mock data
    cat > scrapers/harris-teeter-scraper.js << 'HTSCRAPER'
const BaseScraper = require('./base-scraper');

class HarrisTeeterScraper extends BaseScraper {
  async scrape(zipCode) {
    console.log(`Fetching Harris Teeter prices for ZIP: ${zipCode}`);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockItems = [
      { name: 'Boneless Chicken Breast', price: 8.99, regularPrice: 12.99, unit: 'lb', category: 'Meat', onSale: true, brand: 'Fresh' },
      { name: 'Ground Beef 85/15', price: 6.99, regularPrice: 8.99, unit: 'lb', category: 'Meat', onSale: true, brand: 'Fresh' },
      { name: 'Salmon Fillet', price: 12.99, regularPrice: 15.99, unit: 'lb', category: 'Seafood', onSale: true, brand: 'Fresh Atlantic' },
      { name: 'Organic Strawberries', price: 3.99, regularPrice: 5.99, unit: '16 oz', category: 'Produce', onSale: true, brand: 'Organic' },
      { name: 'Broccoli Crowns', price: 2.99, unit: 'lb', category: 'Produce', onSale: false, brand: 'Fresh' },
      { name: 'Roma Tomatoes', price: 2.49, regularPrice: 3.49, unit: 'lb', category: 'Produce', onSale: true, brand: 'Fresh' },
      { name: 'Red Bell Peppers', price: 1.99, unit: 'each', category: 'Produce', onSale: false, brand: 'Fresh' },
      { name: 'Yellow Onions', price: 1.49, unit: 'lb', category: 'Produce', onSale: false, brand: 'Fresh' },
      { name: 'Garlic', price: 0.79, unit: 'each', category: 'Produce', onSale: false, brand: 'Fresh' },
      { name: 'Baby Carrots', price: 1.99, unit: '1 lb bag', category: 'Produce', onSale: false, brand: 'Fresh' },
      { name: 'Russet Potatoes', price: 3.49, unit: '5 lb bag', category: 'Produce', onSale: false, brand: 'Fresh' },
      { name: 'Pasta Penne', price: 1.49, regularPrice: 2.29, unit: '16 oz', category: 'Pantry', onSale: true, brand: 'Barilla' },
      { name: 'Extra Virgin Olive Oil', price: 7.99, regularPrice: 10.99, unit: '500 ml', category: 'Pantry', onSale: true, brand: 'Filippo Berio' },
      { name: 'Jasmine Rice', price: 3.99, unit: '2 lb bag', category: 'Pantry', onSale: false, brand: 'Mahatma' },
      { name: 'Large Eggs', price: 3.49, regularPrice: 4.99, unit: 'dozen', category: 'Dairy', onSale: true, brand: 'Grade A' },
      { name: 'Whole Milk', price: 3.99, unit: 'gallon', category: 'Dairy', onSale: false, brand: 'Fresh' },
      { name: 'Sharp Cheddar Cheese', price: 4.99, regularPrice: 6.49, unit: '8 oz', category: 'Dairy', onSale: true, brand: 'Cabot' },
      { name: 'Greek Yogurt', price: 1.29, regularPrice: 1.79, unit: '5.3 oz', category: 'Dairy', onSale: true, brand: 'Chobani' },
      { name: 'Whole Wheat Bread', price: 2.99, unit: '20 oz', category: 'Bakery', onSale: false, brand: 'Nature\'s Own' },
      { name: 'Unsalted Butter', price: 4.99, regularPrice: 5.99, unit: '1 lb', category: 'Dairy', onSale: true, brand: 'Land O Lakes' }
    ];
    
    return mockItems.map(item => this.formatItem(item));
  }
}

module.exports = HarrisTeeterScraper;
HTSCRAPER
    print_success "Created scrapers/harris-teeter-scraper.js"
    
    # Create pdf-parser.js
    cat > scrapers/pdf-parser.js << 'PDFPARSER'
const { spawn } = require('child_process');
const path = require('path');

class PDFParser {
  async parsePDF(pdfPath) {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(__dirname, 'harris_teeter_pdf_parser.py');
      const python = spawn('python3', [pythonScript, pdfPath]);
      
      let output = '';
      let errorOutput = '';
      
      python.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script exited with code ${code}: ${errorOutput}`));
          return;
        }
        
        try {
          const result = JSON.parse(output);
          resolve(result.items || []);
        } catch (error) {
          reject(new Error(`Failed to parse Python output: ${error.message}`));
        }
      });
    });
  }

  async parseFromURL(pdfURL, downloadPath) {
    throw new Error('parseFromURL not implemented yet');
  }
}

module.exports = PDFParser;
PDFPARSER
    print_success "Created scrapers/pdf-parser.js"
fi

echo ""

# ============================================
# STEP 3: Create Frontend Files
# ============================================
print_step "Step 3: Creating frontend components..."
echo ""

if [ -f "$SCRIPT_DIR/create-frontend-files.sh" ]; then
    print_info "Running create-frontend-files.sh..."
    "$SCRIPT_DIR/create-frontend-files.sh" "$PROJECT_DIR"
else
    print_info "Creating frontend files manually..."
    print_warning "This is a simplified version. Download create-frontend-files.sh for full version."
    
    # Create placeholder files
    touch client/src/components/ZIPCodeInput.js
    touch client/src/components/ZIPCodeInput.css
    touch client/src/components/StoreSelection.js
    touch client/src/components/StoreSelection.css
    
    print_info "Created placeholder frontend files"
    print_warning "You need to copy content from PHASE_1_IMPLEMENTATION.md"
fi

echo ""

# ============================================
# STEP 4: Update/Check server.js
# ============================================
print_step "Step 4: Checking server.js..."
echo ""

if [ ! -f "server.js" ]; then
    print_warning "server.js not found - you need to create your base server.js first"
else
    if [ -f "$SCRIPT_DIR/update-server.sh" ]; then
        print_info "Running update-server.sh..."
        "$SCRIPT_DIR/update-server.sh" "$PROJECT_DIR"
    else
        print_info "server.js exists but update-server.sh not found"
        print_warning "You'll need to manually add the endpoints"
    fi
fi

echo ""

# ============================================
# STEP 5: Check/Create .env
# ============================================
print_step "Step 5: Checking .env..."
echo ""

if [ ! -f ".env" ]; then
    print_warning ".env not found - creating template..."
    cat > .env << 'ENVFILE'
PORT=5000
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
SESSION_SECRET=your_session_secret_here
PRICE_CACHE_TTL=86400000
ENABLE_PRICE_SCRAPING=true
ENVFILE
    print_success "Created .env template"
    print_warning "You need to add your actual API keys!"
else
    # Check if it has the new variables
    if ! grep -q "PRICE_CACHE_TTL" .env; then
        echo "" >> .env
        echo "PRICE_CACHE_TTL=86400000" >> .env
        echo "ENABLE_PRICE_SCRAPING=true" >> .env
        print_success "Added new variables to .env"
    else
        print_info ".env already has new variables"
    fi
    
    # Check PORT
    if grep -q "^PORT=3000" .env; then
        print_warning "PORT is set to 3000, should be 5000"
        print_info "Updating PORT to 5000..."
        sed -i.bak 's/^PORT=3000/PORT=5000/' .env
        print_success "Updated PORT to 5000"
    fi
fi

echo ""

# ============================================
# STEP 6: Install Dependencies
# ============================================
print_step "Step 6: Installing dependencies..."
echo ""

if [ -f "package.json" ]; then
    print_info "Installing backend dependencies..."
    npm install --silent
    
    # Make sure node-cache is installed
    if ! npm list node-cache > /dev/null 2>&1; then
        print_info "Installing node-cache..."
        npm install node-cache --save
    fi
    
    print_success "Backend dependencies installed"
else
    print_warning "No package.json found - skipping dependency installation"
fi

if [ -f "client/package.json" ]; then
    print_info "Installing frontend dependencies..."
    cd client
    npm install --silent
    cd ..
    print_success "Frontend dependencies installed"
else
    print_warning "No client/package.json found - skipping frontend dependencies"
fi

echo ""

# ============================================
# SUMMARY
# ============================================
echo "=============================================="
print_success "✨ Fresh Installation Complete!"
echo "=============================================="
echo ""

echo "📦 What was created:"
echo "  Backend:"
echo "    • scrapers/ directory with 4 files"
echo "    • temp/ directory"
if [ -f ".env" ]; then
    echo "    • .env file $([ -f "$BACKUP_DIR/.env" ] && echo "(updated)" || echo "(created)")"
fi
echo ""
echo "  Frontend:"
echo "    • client/src/components/ directory"
echo "    • Component files (may need content added)"
echo ""

if [ -d "$BACKUP_DIR" ]; then
    echo "💾 Backups saved in: $BACKUP_DIR"
    echo ""
fi

echo "⚠️  MANUAL STEPS REQUIRED:"
echo ""
echo "1. Update .env with your actual API keys"
echo "   cd $PROJECT_DIR"
echo "   nano .env"
echo ""
echo "2. Add frontend component content"
echo "   See: PHASE_1_IMPLEMENTATION.md"
echo "   Or run: create-frontend-files.sh"
echo ""
echo "3. Update App.js"
echo "   See: UPDATE_APP_JS_GUIDE.md"
echo ""
echo "4. Test installation:"
echo "   Terminal 1: npm start"
echo "   Terminal 2: cd client && npm start"
echo ""

print_info "Run verify-installation.sh to check what's missing"
echo ""