/**
 * Local Store Finder Scraper - Node.js Bridge
 *
 * Spawns Python scraper process and handles communication via stdin/stdout.
 * Includes timeout enforcement, output validation, and error sanitization.
 *
 * Environment Variables:
 *   LOCAL_STORE_SCRAPER_PYTHON - Path to Python executable (default: python3)
 *   LOCAL_STORE_SCRAPER_ENTRY - Path to scraper entry script (default: python/local_store_finder_scraper/run_scrape.py)
 *   LOCAL_STORE_SCRAPER_TIMEOUT - Timeout in milliseconds (default: 30000)
 *   USE_AI_NORMALIZER - Enable AI normalization (default: false)
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration from environment variables
const PYTHON_PATH = process.env.LOCAL_STORE_SCRAPER_PYTHON || 'python3';
const SCRAPER_ENTRY = process.env.LOCAL_STORE_SCRAPER_ENTRY ||
  path.join(__dirname, '..', 'python', 'local_store_finder_scraper', 'run_scrape.py');
const SCRAPER_TIMEOUT = parseInt(process.env.LOCAL_STORE_SCRAPER_TIMEOUT) || 30000;
const USE_AI_NORMALIZER = process.env.USE_AI_NORMALIZER === 'true';

/**
 * Input schema for scraper
 * @typedef {Object} StoreInput
 * @property {string} id - Store UUID
 * @property {string} name - Store display name
 * @property {string} base_url - Store base URL
 * @property {string} [search_url_template] - URL template with {query}
 * @property {string} [source] - 'requests' or 'playwright'
 */

/**
 * Output result from scraper
 * @typedef {Object} ScraperResult
 * @property {string} store_id - Store UUID
 * @property {string} store_name - Store display name
 * @property {string} item_name - Product name
 * @property {string} price - Price string (e.g., "$99.99" or "not available")
 * @property {string} unit - Unit of measure
 * @property {string} product_url - Product page URL
 * @property {string} notes - Additional notes
 * @property {string} collected_at - Timestamp string
 */

/**
 * Validate scraper output schema
 * @param {Object} output - Raw output from scraper
 * @returns {boolean} True if valid
 */
function validateOutputSchema(output) {
  if (!output || typeof output !== 'object') {
    return false;
  }

  if (!Array.isArray(output.results)) {
    return false;
  }

  // Validate each result has required fields
  const requiredFields = ['store_id', 'store_name', 'item_name', 'price'];
  for (const result of output.results) {
    for (const field of requiredFields) {
      if (typeof result[field] !== 'string') {
        return false;
      }
    }
  }

  return true;
}

/**
 * Sanitize error message for user-safe display
 * @param {Error|string} error - Error to sanitize
 * @returns {string} Safe error message
 */
function sanitizeError(error) {
  const message = error instanceof Error ? error.message : String(error);

  // Remove file paths
  let sanitized = message.replace(/\/[^\s]+\//g, '');

  // Remove stack traces
  sanitized = sanitized.split('\n')[0];

  // Limit length
  sanitized = sanitized.substring(0, 150);

  // Generic error messages for common issues
  if (message.includes('ENOENT') || message.includes('spawn')) {
    return 'Python scraper not available';
  }
  if (message.includes('ETIMEDOUT') || message.includes('timeout')) {
    return 'Search timed out';
  }
  if (message.includes('ECONNREFUSED')) {
    return 'Could not connect to store';
  }

  return sanitized || 'An error occurred during search';
}

/**
 * Normalize results using AI (if enabled)
 * @param {ScraperResult[]} results - Raw scraper results
 * @param {string} query - Original search query
 * @returns {Promise<ScraperResult[]>} Normalized results
 */
async function normalizeWithAI(results, query) {
  if (!USE_AI_NORMALIZER) {
    return results;
  }

  const { normalizeScraperResults } = require('./aiNormalizer');
  try {
    return await normalizeScraperResults(results, query);
  } catch (error) {
    console.error('AI normalization failed, using raw results:', error.message);
    return results;
  }
}

/**
 * Run the Python scraper
 *
 * @param {StoreInput[]} stores - Array of store objects to scrape
 * @param {string} query - Search query
 * @returns {Promise<{results: ScraperResult[], errors: string[]}>}
 */
async function runScraper(stores, query) {
  return new Promise((resolve, reject) => {
    // Validate inputs
    if (!Array.isArray(stores) || stores.length === 0) {
      reject(new Error('No stores provided'));
      return;
    }

    if (!query || typeof query !== 'string') {
      reject(new Error('Invalid query'));
      return;
    }

    // Prepare input JSON
    const input = {
      stores: stores.map(s => ({
        id: s.id,
        name: s.name,
        base_url: s.base_url,
        search_url_template: s.search_url_template || '',
        source: s.source || 'requests'
      })),
      query: query.trim()
    };

    const inputJson = JSON.stringify(input);

    console.log(`[Scraper] Starting Python scraper for ${stores.length} stores, query: "${query}"`);
    console.log(`[Scraper] Python: ${PYTHON_PATH}, Entry: ${SCRAPER_ENTRY}`);

    // Spawn Python process
    const python = spawn(PYTHON_PATH, [SCRAPER_ENTRY], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });

    let stdout = '';
    let stderr = '';
    let killed = false;

    // Set timeout
    const timeoutId = setTimeout(() => {
      killed = true;
      python.kill('SIGTERM');
      setTimeout(() => python.kill('SIGKILL'), 1000);
    }, SCRAPER_TIMEOUT);

    // Handle stdout
    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    // Handle stderr (logging from Python)
    python.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log(`[Scraper Python] ${data.toString().trim()}`);
    });

    // Handle process exit
    python.on('close', async (code) => {
      clearTimeout(timeoutId);

      if (killed) {
        resolve({
          results: stores.map(s => ({
            store_id: s.id,
            store_name: s.name,
            item_name: query,
            price: 'not available',
            unit: 'each',
            product_url: s.base_url,
            notes: 'Search timed out',
            collected_at: new Date().toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })
          })),
          errors: ['Scraper timed out']
        });
        return;
      }

      if (!stdout.trim()) {
        resolve({
          results: stores.map(s => ({
            store_id: s.id,
            store_name: s.name,
            item_name: query,
            price: 'not available',
            unit: 'each',
            product_url: s.base_url,
            notes: 'No results returned',
            collected_at: new Date().toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })
          })),
          errors: ['Scraper returned no output']
        });
        return;
      }

      try {
        const output = JSON.parse(stdout);

        if (!validateOutputSchema(output)) {
          throw new Error('Invalid output schema');
        }

        // Apply AI normalization if enabled
        const normalizedResults = await normalizeWithAI(output.results, query);

        resolve({
          results: normalizedResults,
          errors: output.errors || []
        });

      } catch (parseError) {
        console.error('[Scraper] Failed to parse output:', parseError.message);
        console.error('[Scraper] Raw stdout:', stdout.substring(0, 500));

        resolve({
          results: stores.map(s => ({
            store_id: s.id,
            store_name: s.name,
            item_name: query,
            price: 'not available',
            unit: 'each',
            product_url: s.base_url,
            notes: sanitizeError(parseError),
            collected_at: new Date().toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })
          })),
          errors: [sanitizeError(parseError)]
        });
      }
    });

    // Handle spawn errors
    python.on('error', (err) => {
      clearTimeout(timeoutId);
      console.error('[Scraper] Spawn error:', err.message);

      resolve({
        results: stores.map(s => ({
          store_id: s.id,
          store_name: s.name,
          item_name: query,
          price: 'not available',
          unit: 'each',
          product_url: s.base_url,
          notes: sanitizeError(err),
          collected_at: new Date().toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
          })
        })),
        errors: [sanitizeError(err)]
      });
    });

    // Write input to stdin
    python.stdin.write(inputJson);
    python.stdin.end();
  });
}

/**
 * Convenience function to scrape a single store
 * @param {StoreInput} store - Store to scrape
 * @param {string} query - Search query
 * @returns {Promise<ScraperResult>}
 */
async function scrapeStore(store, query) {
  const { results } = await runScraper([store], query);
  return results[0] || {
    store_id: store.id,
    store_name: store.name,
    item_name: query,
    price: 'not available',
    unit: 'each',
    product_url: store.base_url,
    notes: 'No results',
    collected_at: new Date().toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  };
}

module.exports = {
  runScraper,
  scrapeStore,
  validateOutputSchema,
  sanitizeError,
  SCRAPER_TIMEOUT,
  PYTHON_PATH,
  SCRAPER_ENTRY
};
