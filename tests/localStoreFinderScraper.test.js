/**
 * Tests for Local Store Finder Scraper Service
 *
 * Uses mocked child_process to test the Node.js bridge without running Python.
 *
 * Run with: node tests/localStoreFinderScraper.test.js
 */

const assert = require('assert');
const { EventEmitter } = require('events');

// ============================================================================
// MOCK SETUP
// ============================================================================

// Store original require
const originalRequire = require;

// Mock child_process.spawn
const mockSpawn = {
  calls: [],
  nextResponse: null,
  nextError: null,
  timeout: null,

  reset() {
    this.calls = [];
    this.nextResponse = null;
    this.nextError = null;
    this.timeout = null;
  },

  setResponse(response) {
    this.nextResponse = response;
  },

  setError(error) {
    this.nextError = error;
  },

  setTimeout(ms) {
    this.timeout = ms;
  }
};

// Create a fake spawn function
function createMockSpawn() {
  return function spawn(command, args, options) {
    mockSpawn.calls.push({ command, args, options });

    const proc = new EventEmitter();
    proc.stdin = {
      write: () => {},
      end: () => {}
    };
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.kill = () => {};

    // Schedule response/error
    setTimeout(() => {
      if (mockSpawn.nextError) {
        proc.emit('error', mockSpawn.nextError);
      } else if (mockSpawn.timeout) {
        // Simulate timeout - don't emit close
        setTimeout(() => {
          proc.stdout.emit('data', '');
          proc.emit('close', 1);
        }, mockSpawn.timeout + 100);
      } else {
        const response = mockSpawn.nextResponse || { results: [], errors: [] };
        proc.stdout.emit('data', JSON.stringify(response));
        proc.emit('close', 0);
      }
    }, 10);

    return proc;
  };
}

// Override require for child_process
const mockChildProcess = {
  spawn: createMockSpawn()
};

// Patch the module cache
require.cache[require.resolve('child_process')] = {
  id: require.resolve('child_process'),
  filename: require.resolve('child_process'),
  loaded: true,
  exports: mockChildProcess
};

// Now require the service (it will get mocked child_process)
const {
  runScraper,
  scrapeStore,
  validateOutputSchema,
  sanitizeError
} = require('../services/localStoreFinderScraper');

// ============================================================================
// TEST HELPERS
// ============================================================================

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   ${error.message}`);
    testsFailed++;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   ${error.message}`);
    testsFailed++;
  }
}

// ============================================================================
// UNIT TESTS
// ============================================================================

console.log('\n🧪 Local Store Finder Scraper - Unit Tests\n');
console.log('─'.repeat(50));

// Test validateOutputSchema
test('validateOutputSchema - accepts valid output', () => {
  const valid = {
    results: [
      {
        store_id: '123',
        store_name: 'Test Store',
        item_name: 'Test Item',
        price: '$99.99'
      }
    ]
  };
  assert.strictEqual(validateOutputSchema(valid), true);
});

test('validateOutputSchema - rejects missing results', () => {
  assert.strictEqual(validateOutputSchema({}), false);
});

test('validateOutputSchema - rejects non-array results', () => {
  assert.strictEqual(validateOutputSchema({ results: 'not an array' }), false);
});

test('validateOutputSchema - rejects results with missing fields', () => {
  const invalid = {
    results: [{ store_id: '123' }] // missing other required fields
  };
  assert.strictEqual(validateOutputSchema(invalid), false);
});

// Test sanitizeError
test('sanitizeError - removes file paths', () => {
  const error = new Error('/Users/foo/bar/test.js: something went wrong');
  const sanitized = sanitizeError(error);
  assert.ok(!sanitized.includes('/Users/'));
});

test('sanitizeError - handles ENOENT errors', () => {
  const error = new Error('spawn python3 ENOENT');
  const sanitized = sanitizeError(error);
  assert.strictEqual(sanitized, 'Python scraper not available');
});

test('sanitizeError - handles timeout errors', () => {
  const error = new Error('operation timed out');
  const sanitized = sanitizeError(error);
  assert.strictEqual(sanitized, 'Search timed out');
});

test('sanitizeError - limits message length', () => {
  const error = new Error('a'.repeat(500));
  const sanitized = sanitizeError(error);
  assert.ok(sanitized.length <= 150);
});

// ============================================================================
// INTEGRATION TESTS WITH MOCKED SPAWN
// ============================================================================

console.log('\n📦 Integration Tests (with mocked spawn)\n');
console.log('─'.repeat(50));

testAsync('runScraper - returns results from Python output', async () => {
  mockSpawn.reset();
  mockSpawn.setResponse({
    results: [
      {
        store_id: 'store-1',
        store_name: 'Home Depot',
        item_name: 'Power Drill',
        price: '$129.99',
        unit: 'each',
        product_url: 'https://homedepot.com/p/123',
        notes: '',
        collected_at: 'Dec 27, 2025'
      }
    ],
    errors: [],
    meta: { query: 'drill', stores_processed: 1, total_results: 1 }
  });

  const stores = [
    { id: 'store-1', name: 'Home Depot', base_url: 'https://homedepot.com' }
  ];

  const { results, errors } = await runScraper(stores, 'drill');

  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].store_name, 'Home Depot');
  assert.strictEqual(results[0].price, '$129.99');
  assert.strictEqual(errors.length, 0);
}).then(() => {

  return testAsync('runScraper - handles multiple stores', async () => {
    mockSpawn.reset();
    mockSpawn.setResponse({
      results: [
        {
          store_id: 'store-1',
          store_name: 'Home Depot',
          item_name: 'Drill',
          price: '$129.99',
          unit: 'each',
          product_url: 'https://homedepot.com',
          notes: '',
          collected_at: 'Dec 27, 2025'
        },
        {
          store_id: 'store-2',
          store_name: 'Lowes',
          item_name: 'Drill',
          price: '$119.99',
          unit: 'each',
          product_url: 'https://lowes.com',
          notes: '',
          collected_at: 'Dec 27, 2025'
        }
      ],
      errors: []
    });

    const stores = [
      { id: 'store-1', name: 'Home Depot', base_url: 'https://homedepot.com' },
      { id: 'store-2', name: 'Lowes', base_url: 'https://lowes.com' }
    ];

    const { results } = await runScraper(stores, 'drill');

    assert.strictEqual(results.length, 2);
  });

}).then(() => {

  return testAsync('runScraper - handles Python spawn error', async () => {
    mockSpawn.reset();
    mockSpawn.setError(new Error('spawn python3 ENOENT'));

    const stores = [
      { id: 'store-1', name: 'Test Store', base_url: 'https://test.com' }
    ];

    const { results, errors } = await runScraper(stores, 'test');

    // Should return fallback results
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].price, 'not available');
    assert.ok(results[0].notes.includes('Python') || results[0].notes.includes('error'));
  });

}).then(() => {

  return testAsync('runScraper - handles empty stores array', async () => {
    try {
      await runScraper([], 'test');
      assert.fail('Should have thrown error');
    } catch (error) {
      assert.ok(error.message.includes('No stores'));
    }
  });

}).then(() => {

  return testAsync('runScraper - handles invalid query', async () => {
    try {
      await runScraper([{ id: '1', name: 'Test', base_url: 'https://test.com' }], '');
      assert.fail('Should have thrown error');
    } catch (error) {
      assert.ok(error.message.includes('query'));
    }
  });

}).then(() => {

  return testAsync('scrapeStore - returns single result', async () => {
    mockSpawn.reset();
    mockSpawn.setResponse({
      results: [
        {
          store_id: 'store-1',
          store_name: 'Best Buy',
          item_name: 'Samsung TV',
          price: '$599.99',
          unit: 'each',
          product_url: 'https://bestbuy.com/p/456',
          notes: 'In stock',
          collected_at: 'Dec 27, 2025'
        }
      ],
      errors: []
    });

    const store = { id: 'store-1', name: 'Best Buy', base_url: 'https://bestbuy.com' };
    const result = await scrapeStore(store, 'samsung tv');

    assert.strictEqual(result.store_name, 'Best Buy');
    assert.strictEqual(result.price, '$599.99');
  });

}).then(() => {

  // Print results
  console.log('\n' + '─'.repeat(50));
  console.log(`\nResults: ${testsPassed} passed, ${testsFailed} failed`);
  process.exit(testsFailed > 0 ? 1 : 0);

}).catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
