#!/bin/bash

# ============================================
# Create Backend Files Script
# Generates all backend files with full content
# ============================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_step() { echo -e "${BLUE}▶ $1${NC}"; }

if [ -z "$1" ]; then
    echo "Usage: ./create-backend-files.sh /path/to/mealsapp"
    exit 1
fi

PROJECT_DIR="$1"
cd "$PROJECT_DIR"

echo "=============================================="
echo "   Creating Backend Files"
echo "=============================================="
echo ""

# ============================================
# File 1: price-cache.js
# ============================================
print_step "Creating scrapers/price-cache.js..."

cat > scrapers/price-cache.js << 'FILECONTENT'
const NodeCache = require('node-cache');

class PriceCache {
  constructor(ttlSeconds = 86400) { // 24 hours default
    this.cache = new NodeCache({ 
      stdTTL: ttlSeconds,
      checkperiod: 600
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
    return this.cache.set(key, {
      ...data,
      cachedAt: new Date().toISOString()
    });
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
FILECONTENT

print_success "Created price-cache.js"

# ============================================
# File 2: base-scraper.js  
# ============================================
print_step "Creating scrapers/base-scraper.js..."

cat > scrapers/base-scraper.js << 'FILECONTENT'
class BaseScraper {
  constructor(storeName) {
    this.storeName = storeName;
  }

  async scrape(zipCode) {
    throw new Error('scrape() must be implemented by subclass');
  }

  formatPrice(priceString) {
    if (typeof priceString === 'number') return priceString;
    const match = String(priceString).match(/\$?(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : null;
  }

  formatItem(rawItem) {
    return {
      name: rawItem.name || rawItem.product_name || '',
      price: this.formatPrice(rawItem.price || rawItem.sale_price),
      regularPrice: this.formatPrice(rawItem.regularPrice || rawItem.regular_price),
      unit: rawItem.unit || 'each',
      category: rawItem.category || 'General',
      onSale: rawItem.onSale || (rawItem.regularPrice > rawItem.price),
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
FILECONTENT

print_success "Created base-scraper.js"

# ============================================
# File 3: harris-teeter-scraper.js
# ============================================
print_step "Creating scrapers/harris-teeter-scraper.js..."

cat > scrapers/harris-teeter-scraper.js << 'FILECONTENT'
const BaseScraper = require('./base-scraper');

class HarrisTeeterScraper extends BaseScraper {
  constructor() {
    super('Harris Teeter');
  }

  async scrape(zipCode) {
    try {
      console.log(`Scraping Harris Teeter for ZIP: ${zipCode}`);
      // For MVP: Return mock data
      // TODO: Implement PDF parsing
      return this.getMockData();
    } catch (error) {
      console.error('Harris Teeter scraping error:', error);
      return this.getMockData();
    }
  }

  getMockData() {
    return [
      { name: 'Chicken Breast', price: 8.99, regularPrice: 12.99, unit: 'lb', category: 'Meat', onSale: true, description: 'Boneless, skinless', brand: '' },
      { name: 'Ground Beef', price: 6.99, regularPrice: 8.99, unit: 'lb', category: 'Meat', onSale: true, description: '80% lean', brand: '' },
      { name: 'Salmon Fillet', price: 12.99, regularPrice: 15.99, unit: 'lb', category: 'Seafood', onSale: true, description: 'Atlantic, fresh', brand: '' },
      { name: 'Organic Strawberries', price: 3.99, regularPrice: 5.99, unit: '16 oz', category: 'Produce', onSale: true, description: 'Fresh berries', brand: '' },
      { name: 'Broccoli', price: 2.99, regularPrice: null, unit: 'bunch', category: 'Produce', onSale: false, description: 'Fresh crown', brand: '' },
      { name: 'Roma Tomatoes', price: 2.49, regularPrice: 3.49, unit: 'lb', category: 'Produce', onSale: true, description: 'Ripe, fresh', brand: '' },
      { name: 'Bell Peppers', price: 1.99, regularPrice: null, unit: 'each', category: 'Produce', onSale: false, description: 'Assorted colors', brand: '' },
      { name: 'Pasta', price: 1.49, regularPrice: 2.29, unit: '16 oz', category: 'Pantry', onSale: true, description: 'Various shapes', brand: 'Barilla' },
      { name: 'Olive Oil', price: 7.99, regularPrice: 10.99, unit: '750ml', category: 'Pantry', onSale: true, description: 'Extra virgin', brand: '' },
      { name: 'Rice', price: 3.99, regularPrice: null, unit: '2 lb', category: 'Pantry', onSale: false, description: 'Long grain white', brand: '' },
      { name: 'Eggs', price: 3.49, regularPrice: 4.99, unit: 'dozen', category: 'Dairy', onSale: true, description: 'Large, Grade A', brand: '' },
      { name: 'Milk', price: 3.99, regularPrice: null, unit: 'gallon', category: 'Dairy', onSale: false, description: 'Whole milk', brand: '' },
      { name: 'Cheddar Cheese', price: 4.99, regularPrice: 6.49, unit: '8 oz', category: 'Dairy', onSale: true, description: 'Sharp cheddar', brand: '' },
      { name: 'Greek Yogurt', price: 1.29, regularPrice: 1.79, unit: '5.3 oz', category: 'Dairy', onSale: true, description: 'Plain, nonfat', brand: 'Chobani' },
      { name: 'Bread', price: 2.99, regularPrice: null, unit: '20 oz', category: 'Bakery', onSale: false, description: 'Whole wheat', brand: '' },
      { name: 'Onions', price: 1.49, regularPrice: null, unit: 'lb', category: 'Produce', onSale: false, description: 'Yellow onions', brand: '' },
      { name: 'Garlic', price: 0.79, regularPrice: null, unit: 'bulb', category: 'Produce', onSale: false, description: 'Fresh garlic', brand: '' },
      { name: 'Carrots', price: 1.99, regularPrice: null, unit: '2 lb bag', category: 'Produce', onSale: false, description: 'Baby carrots', brand: '' },
      { name: 'Potatoes', price: 3.49, regularPrice: null, unit: '5 lb bag', category: 'Produce', onSale: false, description: 'Russet potatoes', brand: '' },
      { name: 'Butter', price: 4.99, regularPrice: 5.99, unit: '1 lb', category: 'Dairy', onSale: true, description: 'Salted butter', brand: '' }
    ];
  }
}

module.exports = HarrisTeeterScraper;
FILECONTENT

print_success "Created harris-teeter-scraper.js"

# ============================================
# File 4: pdf-parser.js
# ============================================
print_step "Creating scrapers/pdf-parser.js..."

cat > scrapers/pdf-parser.js << 'FILECONTENT'
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class PDFParser {
  constructor() {
    this.pythonScript = path.join(__dirname, 'harris_teeter_pdf_parser.py');
  }

  async parsePDF(pdfPath) {
    try {
      const { stdout, stderr } = await execPromise(
        `python3 ${this.pythonScript} "${pdfPath}"`
      );

      if (stderr) {
        console.error('PDF Parser stderr:', stderr);
      }

      const result = JSON.parse(stdout);
      return result.items || [];

    } catch (error) {
      console.error('Error parsing PDF:', error);
      return [];
    }
  }

  async parseFromURL(pdfURL, downloadPath) {
    try {
      const response = await fetch(pdfURL);
      const buffer = await response.arrayBuffer();
      
      fs.writeFileSync(downloadPath, Buffer.from(buffer));
      
      return await this.parsePDF(downloadPath);
    } catch (error) {
      console.error('Error downloading/parsing PDF:', error);
      return [];
    }
  }
}

module.exports = PDFParser;
FILECONTENT

print_success "Created pdf-parser.js"

echo ""
echo "=============================================="
print_success "✨ All backend files created!"
echo "=============================================="
echo ""
echo "Files created:"
echo "  ✓ scrapers/price-cache.js"
echo "  ✓ scrapers/base-scraper.js"
echo "  ✓ scrapers/harris-teeter-scraper.js"
echo "  ✓ scrapers/pdf-parser.js"
echo ""
echo "Next: Run ./create-frontend-files.sh to create React components"
