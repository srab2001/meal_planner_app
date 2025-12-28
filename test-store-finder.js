#!/usr/bin/env node
/**
 * Integration Test for Local Store Finder
 *
 * Tests the /api/local-store-finder/find endpoint with mocked Python scraper output.
 *
 * Usage:
 *   node test-store-finder.js
 *
 * Prerequisites:
 *   - Server must be running (or set TEST_API_URL)
 *   - Database must have stores table populated
 *   - Valid auth token required
 */

require('dotenv').config();
const https = require('https');
const http = require('http');

const API_BASE = process.env.TEST_API_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || 'demo-token-test';

// Helper to make HTTP requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const isHttps = url.protocol === 'https:';
    const transport = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    };

    const req = transport.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Test cases
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('🧪 Local Store Finder Integration Tests\n');
  console.log(`API Base: ${API_BASE}`);
  console.log('─'.repeat(50));

  for (const t of tests) {
    try {
      await t.fn();
      console.log(`✅ ${t.name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${t.name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
  }

  console.log('─'.repeat(50));
  console.log(`\nResults: ${passed} passed, ${failed} failed`);

  process.exit(failed > 0 ? 1 : 0);
}

// ============================================================================
// TEST CASES
// ============================================================================

test('GET /api/local-store-finder/stores returns store list', async () => {
  const res = await makeRequest('GET', '/api/local-store-finder/stores');

  if (res.status === 401) {
    throw new Error('Authentication required - set TEST_AUTH_TOKEN');
  }

  if (res.status !== 200) {
    throw new Error(`Expected status 200, got ${res.status}`);
  }

  if (!res.data.stores || !Array.isArray(res.data.stores)) {
    throw new Error('Response should have stores array');
  }
});

test('GET /api/local-store-finder/stores?type=home filters by type', async () => {
  const res = await makeRequest('GET', '/api/local-store-finder/stores?type=home');

  if (res.status !== 200) {
    throw new Error(`Expected status 200, got ${res.status}`);
  }

  if (!res.data.stores) {
    throw new Error('Response should have stores array');
  }

  // All stores should be of type 'home'
  const nonHomeStores = res.data.stores.filter(s => s.store_type !== 'home');
  if (nonHomeStores.length > 0) {
    throw new Error('Response should only contain home stores');
  }
});

test('POST /api/local-store-finder/find requires storeIds', async () => {
  const res = await makeRequest('POST', '/api/local-store-finder/find', {
    itemQuery: 'test item'
  });

  if (res.status !== 400) {
    throw new Error(`Expected status 400, got ${res.status}`);
  }

  if (!res.data.error || !res.data.error.includes('store')) {
    throw new Error('Error should mention store IDs');
  }
});

test('POST /api/local-store-finder/find requires itemQuery', async () => {
  const res = await makeRequest('POST', '/api/local-store-finder/find', {
    storeIds: ['some-id']
  });

  if (res.status !== 400) {
    throw new Error(`Expected status 400, got ${res.status}`);
  }

  if (!res.data.error || !res.data.error.includes('query')) {
    throw new Error('Error should mention item query');
  }
});

test('POST /api/local-store-finder/find limits to 3 stores', async () => {
  const res = await makeRequest('POST', '/api/local-store-finder/find', {
    storeIds: ['id1', 'id2', 'id3', 'id4'],
    itemQuery: 'test item'
  });

  if (res.status !== 400) {
    throw new Error(`Expected status 400, got ${res.status}`);
  }

  if (!res.data.error || !res.data.error.includes('3')) {
    throw new Error('Error should mention maximum 3 stores');
  }
});

test('POST /api/local-store-finder/find returns results for valid request', async () => {
  // First get actual store IDs from the database
  const storesRes = await makeRequest('GET', '/api/local-store-finder/stores?type=home');

  if (storesRes.status !== 200 || !storesRes.data.stores || storesRes.data.stores.length === 0) {
    throw new Error('Need at least one store in database to test find endpoint');
  }

  const storeIds = storesRes.data.stores.slice(0, 2).map(s => s.id);

  const res = await makeRequest('POST', '/api/local-store-finder/find', {
    storeIds: storeIds,
    itemQuery: 'power drill'
  });

  if (res.status === 404) {
    throw new Error('Stores not found - run migrations and seed script first');
  }

  if (res.status !== 200) {
    throw new Error(`Expected status 200, got ${res.status}: ${JSON.stringify(res.data)}`);
  }

  if (!res.data.results || !Array.isArray(res.data.results)) {
    throw new Error('Response should have results array');
  }

  // Each result should have required fields
  for (const result of res.data.results) {
    if (!result.store) throw new Error('Result missing store field');
    if (!result.item) throw new Error('Result missing item field');
    if (!result.price) throw new Error('Result missing price field');
    if (!result.collectedAt) throw new Error('Result missing collectedAt field');
  }
});

test('POST /api/local-store-finder/find handles invalid store IDs gracefully', async () => {
  const res = await makeRequest('POST', '/api/local-store-finder/find', {
    storeIds: ['00000000-0000-0000-0000-000000000000'],
    itemQuery: 'test item'
  });

  // Should return 404 for invalid store IDs
  if (res.status !== 404) {
    throw new Error(`Expected status 404 for invalid store ID, got ${res.status}`);
  }
});

test('POST /api/local-store-finder/find result has correct shape', async () => {
  const storesRes = await makeRequest('GET', '/api/local-store-finder/stores?type=appliances');

  if (storesRes.status !== 200 || !storesRes.data.stores || storesRes.data.stores.length === 0) {
    throw new Error('Need at least one appliance store in database');
  }

  const storeIds = [storesRes.data.stores[0].id];

  const res = await makeRequest('POST', '/api/local-store-finder/find', {
    storeIds: storeIds,
    itemQuery: 'refrigerator'
  });

  if (res.status !== 200) {
    throw new Error(`Expected status 200, got ${res.status}`);
  }

  // Check response shape
  if (typeof res.data.query !== 'string') {
    throw new Error('Response should include query string');
  }

  if (typeof res.data.storeCount !== 'number') {
    throw new Error('Response should include storeCount number');
  }

  if (res.data.query !== 'refrigerator') {
    throw new Error('Response query should match input');
  }
});

// Mock Python scraper test
test('Python scraper mock mode returns valid JSON', async () => {
  const { spawn } = require('child_process');
  const path = require('path');

  const scraperPath = path.join(__dirname, 'scrapers', 'store-finder', 'scraper.py');

  return new Promise((resolve, reject) => {
    const python = spawn('python3', [
      scraperPath,
      '--store-name', 'Test Store',
      '--search-url', 'https://example.com/search?q=test',
      '--query', 'test item',
      '--mock'
    ]);

    let output = '';
    let error = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    python.on('close', (code) => {
      try {
        const result = JSON.parse(output);

        if (!result.success) {
          reject(new Error('Mock scraper should return success: true'));
          return;
        }

        if (!result.store || result.store !== 'Test Store') {
          reject(new Error('Mock scraper should return correct store name'));
          return;
        }

        if (!result.results || !Array.isArray(result.results)) {
          reject(new Error('Mock scraper should return results array'));
          return;
        }

        if (!result.collected_at) {
          reject(new Error('Mock scraper should return collected_at'));
          return;
        }

        resolve();
      } catch (e) {
        reject(new Error(`Failed to parse scraper output: ${e.message}\nOutput: ${output}\nError: ${error}`));
      }
    });

    python.on('error', (err) => {
      reject(new Error(`Failed to spawn Python: ${err.message}`));
    });
  });
});

// Run all tests
runTests();
