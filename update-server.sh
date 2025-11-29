#!/bin/bash

# ============================================
# Update server.js Script - IMPROVED
# Adds endpoints and handles existing imports
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

if [ -z "$1" ]; then
    echo "Usage: ./update-server.sh /path/to/mealsapp"
    exit 1
fi

PROJECT_DIR="$1"
SERVER_FILE="$PROJECT_DIR/server.js"

if [ ! -f "$SERVER_FILE" ]; then
    print_error "server.js not found at: $SERVER_FILE"
    exit 1
fi

cd "$PROJECT_DIR"

echo "=============================================="
echo "   Updating server.js"
echo "=============================================="
echo ""

# ============================================
# STEP 1: Backup
# ============================================
print_step "Step 1: Backing up server.js..."

cp server.js "server.js.backup.$(date +%Y%m%d_%H%M%S)"
print_success "Backup created"
echo ""

# ============================================
# STEP 2: Check what's already there
# ============================================
print_step "Step 2: Checking existing code..."

HAS_IMPORTS=false
HAS_FIND_STORES=false
HAS_SCRAPE_PRICES=false

if grep -q "priceCache.*require.*scrapers/price-cache" server.js; then
    HAS_IMPORTS=true
    print_info "✓ Already has price scraping imports"
fi

if grep -q "'/api/find-stores'" server.js; then
    HAS_FIND_STORES=true
    print_info "✓ Already has /api/find-stores endpoint"
fi

if grep -q "'/api/scrape-store-prices'" server.js; then
    HAS_SCRAPE_PRICES=true
    print_info "✓ Already has /api/scrape-store-prices endpoint"
fi

echo ""

# ============================================
# STEP 3: Add missing imports if needed
# ============================================
if [ "$HAS_IMPORTS" = false ]; then
    print_step "Step 3: Adding imports..."
    
    # Find a good place to add imports - after OpenAI initialization or after require statements
    if grep -n "const openai = new OpenAI" server.js > /dev/null; then
        INSERT_LINE=$(grep -n "const openai = new OpenAI" server.js | tail -1 | cut -d: -f1)
        INSERT_LINE=$((INSERT_LINE + 4))
    elif grep -n "require('dotenv').config()" server.js > /dev/null; then
        INSERT_LINE=$(grep -n "require('dotenv').config()" server.js | tail -1 | cut -d: -f1)
        INSERT_LINE=$((INSERT_LINE + 2))
    else
        # Find line with "const app = express()"
        INSERT_LINE=$(grep -n "const app = express" server.js | head -1 | cut -d: -f1)
    fi
    
    if [ -z "$INSERT_LINE" ]; then
        print_error "Could not find where to insert imports"
        print_info "Please add these lines manually after your require statements:"
        echo ""
        cat << 'IMPORTS'
// Phase 1-3: Price Scraping System
const priceCache = require('./scrapers/price-cache');
const HarrisTeeterScraper = require('./scrapers/harris-teeter-scraper');

function getScraper(storeName) {
  const storeNameLower = storeName.toLowerCase();
  if (storeNameLower.includes('harris') && storeNameLower.includes('teeter')) {
    return new HarrisTeeterScraper();
  }
  return new HarrisTeeterScraper();
}
IMPORTS
        echo ""
    else
        # Insert the imports
        {
            head -n $INSERT_LINE server.js
            cat << 'IMPORTS'

// ============================================
// Phase 1-3: Price Scraping System
// ============================================
const priceCache = require('./scrapers/price-cache');
const HarrisTeeterScraper = require('./scrapers/harris-teeter-scraper');

function getScraper(storeName) {
  const storeNameLower = storeName.toLowerCase();
  if (storeNameLower.includes('harris') && storeNameLower.includes('teeter')) {
    return new HarrisTeeterScraper();
  }
  return new HarrisTeeterScraper();
}
IMPORTS
            tail -n +$((INSERT_LINE + 1)) server.js
        } > server.js.tmp
        
        mv server.js.tmp server.js
        print_success "Added imports and getScraper function"
    fi
else
    print_info "Step 3: Skipping imports (already present)"
fi

echo ""

# ============================================
# STEP 4: Add endpoints
# ============================================
print_step "Step 4: Adding endpoints..."

# Find app.listen
if ! grep -n "app.listen" server.js > /dev/null; then
    print_error "Could not find app.listen() in server.js"
    print_info "Please add the endpoints manually before app.listen()"
    exit 1
fi

LISTEN_LINE=$(grep -n "app.listen" server.js | head -1 | cut -d: -f1)
INSERT_LINE=$((LISTEN_LINE - 1))

# Prepare endpoints to add
ENDPOINTS_TO_ADD=""

if [ "$HAS_FIND_STORES" = false ]; then
    ENDPOINTS_TO_ADD="${ENDPOINTS_TO_ADD}
// ============================================
// PHASE 1: Store Finder Endpoint
// ============================================
app.post('/api/find-stores', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { zipCode } = req.body;

    if (!zipCode || !/^\d{5}(-\d{4})?$/.test(zipCode)) {
      return res.status(400).json({ error: 'Invalid ZIP code' });
    }

    const prompt = \`Given the ZIP code \${zipCode}, list major grocery stores commonly found in this area of the United States.

For each store, provide:
- name: Official store name
- type: \"Organic\", \"Discount\", \"Conventional\", or \"Specialty\"
- typical_distance: Realistic range like \"1-3 miles\"

List 6-8 major chains realistic for this area.

Return ONLY valid JSON:
{
  \"stores\": [
    {
      \"name\": \"Store Name\",
      \"address\": \"Typical location within 5 miles\",
      \"distance\": \"2-4 miles\",
      \"type\": \"Conventional\"
    }
  ]
}\`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that provides grocery store information. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    });

    let responseText = completion.choices[0].message.content.trim();
    responseText = responseText.replace(/\`\`\`json\\n?/g, '').replace(/\`\`\`\\n?/g, '').trim();
    
    const storeData = JSON.parse(responseText);
    res.json(storeData);

  } catch (error) {
    console.error('Error finding stores:', error);
    res.status(500).json({ error: 'Failed to find stores' });
  }
});
"
fi

if [ "$HAS_SCRAPE_PRICES" = false ]; then
    ENDPOINTS_TO_ADD="${ENDPOINTS_TO_ADD}
// ============================================
// PHASE 2: Price Scraping Endpoint
// ============================================
app.post('/api/scrape-store-prices', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { storeName, zipCode } = req.body;

    if (!storeName || !zipCode) {
      return res.status(400).json({ error: 'Store name and ZIP code required' });
    }

    if (priceCache.has(storeName, zipCode)) {
      const cachedData = priceCache.get(storeName, zipCode);
      console.log(\`Returning cached prices for \${storeName} (\${zipCode})\`);
      return res.json({
        ...cachedData,
        fromCache: true
      });
    }

    console.log(\`Scraping prices for \${storeName} (\${zipCode})\`);
    const scraper = getScraper(storeName);
    const items = await scraper.scrape(zipCode);

    const response = {
      store: storeName,
      zipCode,
      items,
      itemCount: items.length,
      scrapedAt: new Date().toISOString(),
      fromCache: false
    };

    priceCache.set(storeName, zipCode, response);

    res.json(response);

  } catch (error) {
    console.error('Error scraping prices:', error);
    res.status(500).json({ error: 'Failed to scrape prices' });
  }
});
"
fi

if [ -z "$ENDPOINTS_TO_ADD" ]; then
    print_info "All endpoints already present, nothing to add"
else
    # Add the endpoints
    {
        head -n $INSERT_LINE server.js
        echo "$ENDPOINTS_TO_ADD"
        tail -n +$LISTEN_LINE server.js
    } > server.js.tmp
    
    mv server.js.tmp server.js
    
    if [ "$HAS_FIND_STORES" = false ]; then
        print_success "Added /api/find-stores endpoint"
    fi
    
    if [ "$HAS_SCRAPE_PRICES" = false ]; then
        print_success "Added /api/scrape-store-prices endpoint"
    fi
fi

echo ""

# ============================================
# SUMMARY
# ============================================
echo "=============================================="
print_success "✨ server.js Updated Successfully!"
echo "=============================================="
echo ""

echo "Status:"
if [ "$HAS_IMPORTS" = true ]; then
    echo "  • Imports: Already present ✓"
else
    echo "  • Imports: Added ✓"
fi

if [ "$HAS_FIND_STORES" = true ]; then
    echo "  • /api/find-stores: Already present ✓"
else
    echo "  • /api/find-stores: Added ✓"
fi

if [ "$HAS_SCRAPE_PRICES" = true ]; then
    echo "  • /api/scrape-store-prices: Already present ✓"
else
    echo "  • /api/scrape-store-prices: Added ✓"
fi

echo ""
echo "Backup saved as:"
ls -1 server.js.backup.* | tail -1
echo ""

print_info "Test with: npm start"
echo ""
