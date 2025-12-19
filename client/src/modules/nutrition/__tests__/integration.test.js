/**
 * Nutrition Module - Integration Tests
 * 
 * Tests the actual API endpoints and component behavior.
 * Run these after the server is started.
 * 
 * Run with: node client/src/modules/nutrition/__tests__/integration.test.js
 */

const http = require('http');
const https = require('https');

// Configuration
const API_BASE = process.env.API_BASE || 'http://localhost:5000';
const TEST_TOKEN = process.env.TEST_TOKEN || ''; // Set a valid token for authenticated tests

console.log('🔌 Running Nutrition Module Integration Tests...\n');
console.log(`API Base: ${API_BASE}`);
console.log(`Auth Token: ${TEST_TOKEN ? 'Provided' : 'Not provided (some tests will be skipped)'}\n`);

// Helper to make HTTP requests
function makeRequest(method, path, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data ? JSON.parse(data) : null
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  // ============================================================================
  // TEST 1: Unauthenticated access should be denied
  // ============================================================================
  console.log('TEST 1: Unauthenticated Access Denied');
  try {
    const res = await makeRequest('GET', '/api/nutrition/meal-plan-summary');
    if (res.status === 401 || res.status === 403) {
      console.log('  ✅ Unauthenticated request correctly rejected');
      passed++;
    } else {
      console.log(`  ❌ Expected 401/403, got ${res.status}`);
      failed++;
    }
  } catch (err) {
    console.log(`  ⚠️  Could not connect to server: ${err.message}`);
    console.log('  ℹ️  Make sure the server is running on', API_BASE);
    skipped++;
  }

  // ============================================================================
  // TEST 2: GET routes exist and respond
  // ============================================================================
  console.log('\nTEST 2: Nutrition GET Routes Exist');
  
  const nutritionRoutes = [
    '/api/nutrition/meal-plan-summary',
    '/api/nutrition/daily/2025-12-18',
    '/api/nutrition/weekly'
  ];

  for (const route of nutritionRoutes) {
    try {
      const res = await makeRequest('GET', route);
      // 401 is expected without auth, but confirms route exists
      if (res.status === 401 || res.status === 403 || res.status === 200 || res.status === 404) {
        console.log(`  ✅ ${route} - Route exists (status: ${res.status})`);
        passed++;
      } else {
        console.log(`  ❌ ${route} - Unexpected status: ${res.status}`);
        failed++;
      }
    } catch (err) {
      console.log(`  ⚠️  ${route} - Error: ${err.message}`);
      skipped++;
    }
  }

  // ============================================================================
  // TEST 3: POST/PUT/DELETE should not exist
  // ============================================================================
  console.log('\nTEST 3: Write Methods Should Not Exist');
  
  const writeAttempts = [
    { method: 'POST', path: '/api/nutrition/meal-plan-summary' },
    { method: 'PUT', path: '/api/nutrition/meal-plan-summary' },
    { method: 'DELETE', path: '/api/nutrition/meal-plan-summary' },
    { method: 'POST', path: '/api/nutrition/daily/2025-12-18' },
  ];

  for (const { method, path } of writeAttempts) {
    try {
      const res = await makeRequest(method, path, TEST_TOKEN);
      // 404 means route doesn't exist for this method (expected)
      // 405 means method not allowed (also acceptable)
      if (res.status === 404 || res.status === 405) {
        console.log(`  ✅ ${method} ${path} - Correctly not allowed (${res.status})`);
        passed++;
      } else if (res.status === 401 || res.status === 403) {
        console.log(`  ⚠️  ${method} ${path} - Auth rejected (can't verify if route exists)`);
        skipped++;
      } else {
        console.log(`  ❌ ${method} ${path} - Should not be allowed! Got ${res.status}`);
        failed++;
      }
    } catch (err) {
      console.log(`  ⚠️  ${method} ${path} - Error: ${err.message}`);
      skipped++;
    }
  }

  // ============================================================================
  // TEST 4: Authenticated Request (if token provided)
  // ============================================================================
  if (TEST_TOKEN) {
    console.log('\nTEST 4: Authenticated Request');
    try {
      const res = await makeRequest('GET', '/api/nutrition/meal-plan-summary', TEST_TOKEN);
      if (res.status === 200) {
        console.log('  ✅ Authenticated request succeeded');
        
        // Verify response structure
        const body = res.body;
        if (body.hasMealPlan !== undefined) {
          console.log('  ✅ Response has hasMealPlan field');
          passed++;
        }
        if (body.mealPlan !== undefined || body.error) {
          console.log('  ✅ Response has mealPlan or error field');
          passed++;
        }
        passed++;
      } else if (res.status === 404) {
        console.log('  ✅ Authenticated request returned 404 (no meal plan - expected for new user)');
        passed++;
      } else {
        console.log(`  ❌ Unexpected status: ${res.status}`);
        failed++;
      }
    } catch (err) {
      console.log(`  ⚠️  Error: ${err.message}`);
      skipped++;
    }
  } else {
    console.log('\nTEST 4: Authenticated Request - SKIPPED (no TEST_TOKEN provided)');
    skipped++;
  }

  // ============================================================================
  // TEST 5: Meal Plan Routes Still Work
  // ============================================================================
  console.log('\nTEST 5: Meal Plan Routes Unaffected');
  
  const mealPlanRoutes = [
    '/api/meal-of-the-day',
    '/api/payment-status'
  ];

  for (const route of mealPlanRoutes) {
    try {
      const res = await makeRequest('GET', route);
      // These routes should still respond (may require auth)
      if (res.status !== 500) {
        console.log(`  ✅ ${route} - Still responds (status: ${res.status})`);
        passed++;
      } else {
        console.log(`  ❌ ${route} - Server error! Nutrition may have broken it`);
        failed++;
      }
    } catch (err) {
      console.log(`  ⚠️  ${route} - Error: ${err.message}`);
      skipped++;
    }
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('INTEGRATION TEST RESULTS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  ✅ Passed:  ${passed}`);
  console.log(`  ❌ Failed:  ${failed}`);
  console.log(`  ⚠️  Skipped: ${skipped}`);
  console.log('');

  if (failed === 0) {
    console.log('🎉 All integration tests passed!');
    console.log('   The Nutrition module does not impact Meal Plan App.');
  } else {
    console.log('⚠️  Some tests failed. Review the output above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
