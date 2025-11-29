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
