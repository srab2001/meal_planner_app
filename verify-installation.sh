#!/bin/bash

# ============================================
# Installation Verification Script
# Checks what's installed and what's missing
# ============================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

DEFAULT_PATH="/Users/stuartrabinowitz/Library/Mobile Documents/com~apple~CloudDocs/mealsapp"

if [ -z "$1" ]; then
    PROJECT_DIR="$DEFAULT_PATH"
else
    PROJECT_DIR="$1"
fi

echo "=============================================="
echo "   Installation Verification"
echo "=============================================="
echo ""
echo "Checking: $PROJECT_DIR"
echo ""

# Check if directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Directory not found: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  BACKEND FILES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check scrapers directory
if [ -d "scrapers" ]; then
    print_success "scrapers/ directory exists"
    
    # Check each file
    FILES=("price-cache.js" "base-scraper.js" "harris-teeter-scraper.js" "pdf-parser.js")
    for file in "${FILES[@]}"; do
        if [ -f "scrapers/$file" ]; then
            SIZE=$(ls -lh "scrapers/$file" | awk '{print $5}')
            if [ "$SIZE" = "0B" ]; then
                print_warning "scrapers/$file exists but is EMPTY"
            else
                print_success "scrapers/$file exists ($SIZE)"
            fi
        else
            print_error "scrapers/$file MISSING"
        fi
    done
else
    print_error "scrapers/ directory MISSING"
fi

echo ""

# Check server.js
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  SERVER.JS UPDATES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "server.js" ]; then
    # Check for imports
    if grep -q "priceCache.*require.*scrapers/price-cache" server.js; then
        print_success "Has priceCache import"
    else
        print_warning "Missing priceCache import"
    fi
    
    if grep -q "HarrisTeeterScraper.*require.*harris-teeter-scraper" server.js; then
        print_success "Has HarrisTeeterScraper import"
    else
        print_warning "Missing HarrisTeeterScraper import"
    fi
    
    if grep -q "function getScraper" server.js; then
        print_success "Has getScraper function"
    else
        print_warning "Missing getScraper function"
    fi
    
    # Check for endpoints
    if grep -q "'/api/find-stores'" server.js; then
        print_success "Has /api/find-stores endpoint"
    else
        print_error "Missing /api/find-stores endpoint"
    fi
    
    if grep -q "'/api/scrape-store-prices'" server.js; then
        print_success "Has /api/scrape-store-prices endpoint"
    else
        print_error "Missing /api/scrape-store-prices endpoint"
    fi
else
    print_error "server.js NOT FOUND"
fi

echo ""

# Check .env
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CONFIGURATION (.env)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f ".env" ]; then
    # Check PORT
    if grep -q "^PORT=" .env; then
        PORT_VALUE=$(grep "^PORT=" .env | cut -d= -f2)
        if [ "$PORT_VALUE" = "5000" ]; then
            print_success "PORT=5000 (correct)"
        else
            print_warning "PORT=$PORT_VALUE (should be 5000)"
        fi
    else
        print_warning "PORT not set in .env"
    fi
    
    # Check new variables
    if grep -q "PRICE_CACHE_TTL" .env; then
        print_success "Has PRICE_CACHE_TTL"
    else
        print_warning "Missing PRICE_CACHE_TTL"
    fi
    
    if grep -q "ENABLE_PRICE_SCRAPING" .env; then
        print_success "Has ENABLE_PRICE_SCRAPING"
    else
        print_warning "Missing ENABLE_PRICE_SCRAPING"
    fi
else
    print_error ".env NOT FOUND"
fi

echo ""

# Check frontend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  FRONTEND COMPONENTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -d "client/src/components" ]; then
    FILES=("ZIPCodeInput.js" "ZIPCodeInput.css" "StoreSelection.js" "StoreSelection.css")
    for file in "${FILES[@]}"; do
        if [ -f "client/src/components/$file" ]; then
            SIZE=$(ls -lh "client/src/components/$file" | awk '{print $5}')
            if [ "$SIZE" = "0B" ]; then
                print_warning "client/src/components/$file exists but is EMPTY"
            else
                print_success "client/src/components/$file exists ($SIZE)"
            fi
        else
            print_error "client/src/components/$file MISSING"
        fi
    done
else
    print_error "client/src/components/ directory NOT FOUND"
fi

echo ""

# Check App.js
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  APP.JS UPDATES (Manual)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "client/src/App.js" ]; then
    # Check for imports
    if grep -q "import.*ZIPCodeInput" client/src/App.js; then
        print_success "Has ZIPCodeInput import"
    else
        print_warning "Missing ZIPCodeInput import - UPDATE NEEDED"
    fi
    
    if grep -q "import.*StoreSelection" client/src/App.js; then
        print_success "Has StoreSelection import"
    else
        print_warning "Missing StoreSelection import - UPDATE NEEDED"
    fi
    
    # Check for state variables
    if grep -q "useState.*zipCode" client/src/App.js; then
        print_success "Has zipCode state"
    else
        print_warning "Missing zipCode state - UPDATE NEEDED"
    fi
    
    if grep -q "useState.*stores" client/src/App.js; then
        print_success "Has stores state"
    else
        print_warning "Missing stores state - UPDATE NEEDED"
    fi
    
    if grep -q "useState.*selectedStore" client/src/App.js; then
        print_success "Has selectedStore state"
    else
        print_warning "Missing selectedStore state - UPDATE NEEDED"
    fi
else
    print_error "client/src/App.js NOT FOUND"
fi

echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check what needs to be done
NEEDS_BACKEND=false
NEEDS_FRONTEND=false
NEEDS_SERVER=false
NEEDS_APP=false

if [ ! -f "scrapers/price-cache.js" ] || [ ! -s "scrapers/price-cache.js" ]; then
    NEEDS_BACKEND=true
fi

if [ ! -f "client/src/components/ZIPCodeInput.js" ] || [ ! -s "client/src/components/ZIPCodeInput.js" ]; then
    NEEDS_FRONTEND=true
fi

if ! grep -q "'/api/find-stores'" server.js 2>/dev/null; then
    NEEDS_SERVER=true
fi

if ! grep -q "import.*ZIPCodeInput" client/src/App.js 2>/dev/null; then
    NEEDS_APP=true
fi

if [ "$NEEDS_BACKEND" = true ]; then
    echo "⚠️  Need to run: ./create-backend-files.sh"
fi

if [ "$NEEDS_FRONTEND" = true ]; then
    echo "⚠️  Need to run: ./create-frontend-files.sh"
fi

if [ "$NEEDS_SERVER" = true ]; then
    echo "⚠️  Need to run: ./update-server.sh"
fi

if [ "$NEEDS_APP" = true ]; then
    echo "⚠️  Need to manually update: client/src/App.js"
    echo "   See: UPDATE_APP_JS_GUIDE.md"
fi

if [ "$NEEDS_BACKEND" = false ] && [ "$NEEDS_FRONTEND" = false ] && [ "$NEEDS_SERVER" = false ] && [ "$NEEDS_APP" = false ]; then
    echo "✨ Installation appears complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Make sure .env has PORT=5000"
    echo "  2. Start backend: npm start"
    echo "  3. Start frontend: cd client && npm start"
    echo "  4. Test the app!"
fi

echo ""
