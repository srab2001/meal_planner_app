/**
 * AI Normalizer Service
 *
 * Uses ChatGPT API to normalize and clean up scraper results.
 * Ensures consistent formatting and picks the best match per store.
 *
 * Environment Variables:
 *   USE_AI_NORMALIZER - Set to 'true' to enable (default: false)
 *   OPENAI_API_KEY - Required for AI normalization
 */

const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * AI Normalization Prompt
 *
 * Rules:
 * - Do not invent prices - use exactly what's in the input or "not available"
 * - Pick the best/most relevant hit per store
 * - Clean up item names (remove excessive text)
 * - Ensure price format is consistent ($X.XX)
 * - Return JSON only, no prose
 */
const NORMALIZATION_PROMPT = `You are a data normalization assistant for a product price comparison tool.

Your task is to clean and normalize scraped product data.

STRICT RULES:
1. DO NOT invent or make up prices. Use EXACTLY the price from input, or set to "not available"
2. Pick the BEST/most relevant hit per store based on the search query
3. Clean up item names: remove excessive marketing text, keep product name concise (max 100 chars)
4. Normalize price format: Always use "$X.XX" format (e.g., "$99.99", "$1,299.00")
5. If price is missing, empty, or unclear, set to "not available"
6. Keep the same store_id, store_name, product_url, and collected_at from input
7. Preserve unit if provided, default to "each"
8. Clean up notes: remove technical errors, keep useful info

OUTPUT FORMAT:
Return ONLY a JSON array of normalized results. No explanations, no markdown, just JSON.

Example output:
[
  {
    "store_id": "abc-123",
    "store_name": "Home Depot",
    "item_name": "DEWALT 20V MAX Cordless Drill",
    "price": "$129.00",
    "unit": "each",
    "product_url": "https://...",
    "notes": "Model: DCD771",
    "collected_at": "Dec 27, 2025 14:30"
  }
]`;

/**
 * Normalize scraper results using ChatGPT
 *
 * @param {Array} results - Raw scraper results
 * @param {string} query - Original search query
 * @returns {Promise<Array>} Normalized results
 */
async function normalizeScraperResults(results, query) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[AI Normalizer] OPENAI_API_KEY not set, skipping normalization');
    return results;
  }

  if (!results || results.length === 0) {
    return results;
  }

  console.log(`[AI Normalizer] Normalizing ${results.length} results for query: "${query}"`);

  try {
    const userMessage = `Search query: "${query}"

Raw scraper results to normalize:
${JSON.stringify(results, null, 2)}

Return the normalized JSON array:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: NORMALIZATION_PROMPT
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      temperature: 0.1, // Low temperature for consistent output
      max_tokens: 2000,
    });

    let responseText = completion.choices[0].message.content.trim();

    // Remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the response
    const normalizedResults = JSON.parse(responseText);

    if (!Array.isArray(normalizedResults)) {
      throw new Error('Response is not an array');
    }

    // Validate each result has required fields
    const validatedResults = normalizedResults.map((result, idx) => {
      const original = results[idx] || results[0];
      return {
        store_id: result.store_id || original.store_id,
        store_name: result.store_name || original.store_name,
        item_name: result.item_name || original.item_name || query,
        price: result.price || 'not available',
        unit: result.unit || 'each',
        product_url: result.product_url || original.product_url,
        notes: result.notes || '',
        collected_at: result.collected_at || original.collected_at
      };
    });

    console.log(`[AI Normalizer] Successfully normalized ${validatedResults.length} results`);
    return validatedResults;

  } catch (error) {
    console.error('[AI Normalizer] Error:', error.message);
    // Return original results on error
    return results;
  }
}

/**
 * Check if AI normalization is enabled
 * @returns {boolean}
 */
function isEnabled() {
  return process.env.USE_AI_NORMALIZER === 'true' && !!process.env.OPENAI_API_KEY;
}

module.exports = {
  normalizeScraperResults,
  isEnabled,
  NORMALIZATION_PROMPT
};
