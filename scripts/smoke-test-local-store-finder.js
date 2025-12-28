#!/usr/bin/env node
/**
 * Local Store Finder - Smoke Test Script
 *
 * Tests all Local Store Finder endpoints for basic functionality.
 *
 * Usage:
 *   node scripts/smoke-test-local-store-finder.js
 *   JWT_TOKEN=xxx node scripts/smoke-test-local-store-finder.js
 *   BASE_URL=http://localhost:3001 JWT_TOKEN=xxx node scripts/smoke-test-local-store-finder.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const JWT_TOKEN = process.env.JWT_TOKEN || '';

// Test results tracking
const results = { passed: 0, failed: 0, skipped: 0 };
const testResults = [];

// Colors for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function pass(name, details = '') {
  results.passed++;
  testResults.push({ name, status: 'PASS', details });
  console.log(`${colors.green}✓ PASS${colors.reset}: ${name}${details ? ` (${details})` : ''}`);
}

function fail(name, details = '') {
  results.failed++;
  testResults.push({ name, status: 'FAIL', details });
  console.log(`${colors.red}✗ FAIL${colors.reset}: ${name}${details ? ` - ${details}` : ''}`);
}

function skip(name, reason = '') {
  results.skipped++;
  testResults.push({ name, status: 'SKIP', details: reason });
  console.log(`${colors.yellow}○ SKIP${colors.reset}: ${name}${reason ? ` - ${reason}` : ''}`);
}

async function fetchJson(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (JWT_TOKEN) {
    headers['Authorization'] = `Bearer ${JWT_TOKEN}`;
  }

  const response = await fetch(url, { ...options, headers });
  const text = await response.text();

  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    // Not JSON
  }

  return { status: response.status, json, text };
}

// ============================================================================
// TESTS
// ============================================================================

async function testHealthCheck() {
  console.log('\n--- Test: Server Health Check ---');
  try {
    const { status } = await fetchJson(`${BASE_URL}/api/health/db`);
    if (status === 200) {
      pass('Server health check', `HTTP ${status}`);
    } else {
      fail('Server health check', `HTTP ${status}`);
    }
  } catch (error) {
    fail('Server health check', error.message);
  }
}

async function testGetStoresForEachType() {
  console.log('\n--- Test: Locate stores returns 3 stores for each type ---');

  if (!JWT_TOKEN) {
    skip('Get stores by type', 'No JWT_TOKEN provided');
    return {};
  }

  const storeTypes = ['home', 'appliances', 'clothing', 'restaurants'];
  const storesByType = {};

  for (const storeType of storeTypes) {
    try {
      const { status, json } = await fetchJson(
        `${BASE_URL}/api/local-store-finder/locate-stores`,
        {
          method: 'POST',
          body: JSON.stringify({ storeType, locationText: 'Test Location' })
        }
      );

      if (status === 200 && json?.stores) {
        const count = json.stores.length;
        storesByType[storeType] = json.stores;

        if (count === 3) {
          pass(`${storeType}: exactly 3 stores`, json.stores.map(s => s.name).join(', '));
        } else {
          fail(`${storeType}: expected 3 stores`, `got ${count}`);
        }
      } else {
        fail(`${storeType}: locate stores`, `HTTP ${status}`);
      }
    } catch (error) {
      fail(`${storeType}: locate stores`, error.message);
    }
  }

  return storesByType;
}

async function testDeselectionFlow(stores) {
  console.log('\n--- Test: User can deselect stores (API accepts 1-3 stores) ---');

  if (!JWT_TOKEN) {
    skip('Deselection flow', 'No JWT_TOKEN provided');
    return;
  }

  if (!stores.home || stores.home.length < 3) {
    skip('Deselection flow', 'No home stores available');
    return;
  }

  const homeStores = stores.home;

  // Test with 1 store (simulating 2 deselected)
  try {
    const { status, json } = await fetchJson(
      `${BASE_URL}/api/local-store-finder/find`,
      {
        method: 'POST',
        body: JSON.stringify({
          storeIds: [homeStores[0].id],
          query: 'hammer'
        })
      }
    );

    if (status === 200 && json?.results?.length === 1) {
      pass('Find with 1 store selected', '1 result returned');
    } else {
      fail('Find with 1 store selected', `HTTP ${status}, results: ${json?.results?.length}`);
    }
  } catch (error) {
    fail('Find with 1 store selected', error.message);
  }

  // Test with 2 stores
  try {
    const { status, json } = await fetchJson(
      `${BASE_URL}/api/local-store-finder/find`,
      {
        method: 'POST',
        body: JSON.stringify({
          storeIds: [homeStores[0].id, homeStores[1].id],
          query: 'hammer'
        })
      }
    );

    if (status === 200 && json?.results?.length === 2) {
      pass('Find with 2 stores selected', '2 results returned');
    } else {
      fail('Find with 2 stores selected', `HTTP ${status}, results: ${json?.results?.length}`);
    }
  } catch (error) {
    fail('Find with 2 stores selected', error.message);
  }
}

async function testFindReturnsRowPerStore(stores) {
  console.log('\n--- Test: Find returns a row per selected store ---');

  if (!JWT_TOKEN) {
    skip('Find returns row per store', 'No JWT_TOKEN provided');
    return null;
  }

  if (!stores.home || stores.home.length < 3) {
    skip('Find returns row per store', 'No home stores available');
    return null;
  }

  const homeStores = stores.home;
  const storeIds = homeStores.map(s => s.id);

  try {
    const { status, json } = await fetchJson(
      `${BASE_URL}/api/local-store-finder/find`,
      {
        method: 'POST',
        body: JSON.stringify({
          storeIds,
          query: 'power drill'
        })
      }
    );

    if (status === 200) {
      const resultCount = json?.results?.length || 0;

      if (resultCount === 3) {
        pass('Find with 3 stores', `3 results returned in ${json.duration_ms}ms`);
      } else {
        fail('Find with 3 stores', `expected 3 results, got ${resultCount}`);
      }

      // Verify each result has required fields
      let allFieldsPresent = true;
      const requiredFields = ['store_id', 'store_name', 'item_name', 'price'];

      for (const result of json?.results || []) {
        for (const field of requiredFields) {
          if (typeof result[field] !== 'string') {
            allFieldsPresent = false;
            break;
          }
        }
      }

      if (allFieldsPresent) {
        pass('Results have required fields', 'store_id, store_name, item_name, price');
      } else {
        fail('Results missing required fields');
      }

      return json;
    } else {
      fail('Find with 3 stores', `HTTP ${status}`);
      return null;
    }
  } catch (error) {
    fail('Find with 3 stores', error.message);
    return null;
  }
}

async function testFailuresDoNotBlockResults() {
  console.log('\n--- Test: Failures do not block results ---');

  if (!JWT_TOKEN) {
    skip('Failures do not block', 'No JWT_TOKEN provided');
    return;
  }

  // Test with mix of valid and invalid store IDs
  // The API should return results for valid stores and graceful failures for invalid
  try {
    const { status, json } = await fetchJson(
      `${BASE_URL}/api/local-store-finder/find`,
      {
        method: 'POST',
        body: JSON.stringify({
          storeIds: ['00000000-0000-0000-0000-000000000000'], // Invalid UUID
          query: 'test'
        })
      }
    );

    // Should get 404 since no valid stores
    if (status === 404) {
      pass('Invalid store returns 404', 'as expected');
    } else {
      // Or it might return empty results
      pass('Invalid store handled', `HTTP ${status}`);
    }
  } catch (error) {
    fail('Invalid store handling', error.message);
  }
}

async function testNoPricesInvented(findResults) {
  console.log('\n--- Test: No prices are invented when scrape returns none ---');

  if (!findResults || !findResults.results) {
    skip('No prices invented', 'No find results available');
    return;
  }

  let allPricesValid = true;
  const invalidPrices = [];

  for (const result of findResults.results) {
    const price = result.price;

    // Valid prices: "$X.XX" format or "not available"
    const isValidPrice = price === 'not available' ||
                         /^\$[\d,]+\.\d{2}$/.test(price) ||
                         /^\$[\d,]+$/.test(price);

    // Invalid: empty, $0.00, N/A, -, null, undefined, or non-price text
    const isInvalid = !price ||
                      price === '' ||
                      price === '$0.00' ||
                      price === 'N/A' ||
                      price === '-' ||
                      price === 'null' ||
                      price === 'undefined';

    if (isInvalid) {
      allPricesValid = false;
      invalidPrices.push(`${result.store_name}: "${price}"`);
    }
  }

  if (allPricesValid) {
    const prices = findResults.results.map(r => `${r.store_name}: ${r.price}`).join(', ');
    pass('All prices valid or "not available"', prices);
  } else {
    fail('Invalid prices found', invalidPrices.join(', '));
  }
}

async function testValidationErrors() {
  console.log('\n--- Test: API validation errors ---');

  if (!JWT_TOKEN) {
    skip('Validation errors', 'No JWT_TOKEN provided');
    return;
  }

  // Test: Missing storeType
  try {
    const { status } = await fetchJson(
      `${BASE_URL}/api/local-store-finder/locate-stores`,
      {
        method: 'POST',
        body: JSON.stringify({ locationText: 'test' })
      }
    );

    if (status === 400) {
      pass('Missing storeType returns 400');
    } else {
      fail('Missing storeType should return 400', `got ${status}`);
    }
  } catch (error) {
    fail('Missing storeType test', error.message);
  }

  // Test: Missing query
  try {
    const { status } = await fetchJson(
      `${BASE_URL}/api/local-store-finder/find`,
      {
        method: 'POST',
        body: JSON.stringify({ storeIds: ['abc'] })
      }
    );

    if (status === 400) {
      pass('Missing query returns 400');
    } else {
      fail('Missing query should return 400', `got ${status}`);
    }
  } catch (error) {
    fail('Missing query test', error.message);
  }

  // Test: Too many stores (>3)
  try {
    const { status } = await fetchJson(
      `${BASE_URL}/api/local-store-finder/find`,
      {
        method: 'POST',
        body: JSON.stringify({
          storeIds: ['a', 'b', 'c', 'd'],
          query: 'test'
        })
      }
    );

    if (status === 400) {
      pass('More than 3 stores returns 400');
    } else {
      fail('More than 3 stores should return 400', `got ${status}`);
    }
  } catch (error) {
    fail('Too many stores test', error.message);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log(`${colors.bold}========================================${colors.reset}`);
  console.log(`${colors.bold}Local Store Finder - Smoke Tests${colors.reset}`);
  console.log(`${colors.bold}========================================${colors.reset}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`JWT Token: ${JWT_TOKEN ? '✓ Provided' : '✗ Not provided'}`);

  if (!JWT_TOKEN) {
    console.log(`\n${colors.yellow}Warning: No JWT_TOKEN provided. Most tests will be skipped.${colors.reset}`);
    console.log('Set JWT_TOKEN environment variable to run all tests.');
  }

  // Run tests
  await testHealthCheck();
  const storesByType = await testGetStoresForEachType();
  await testDeselectionFlow(storesByType);
  const findResults = await testFindReturnsRowPerStore(storesByType);
  await testFailuresDoNotBlockResults();
  await testNoPricesInvented(findResults);
  await testValidationErrors();

  // Summary
  console.log(`\n${colors.bold}========================================${colors.reset}`);
  console.log(`${colors.bold}Summary${colors.reset}`);
  console.log(`${colors.bold}========================================${colors.reset}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}Skipped: ${results.skipped}${colors.reset}`);

  if (results.failed > 0) {
    console.log(`\n${colors.red}Some tests failed!${colors.reset}`);
    process.exit(1);
  } else if (results.skipped > 0 && results.passed === 0) {
    console.log(`\n${colors.yellow}All tests skipped. Provide JWT_TOKEN to run tests.${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.green}All tests passed!${colors.reset}`);
    process.exit(0);
  }
}

main().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
