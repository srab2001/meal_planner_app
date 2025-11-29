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
