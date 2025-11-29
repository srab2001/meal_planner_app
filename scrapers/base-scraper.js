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
