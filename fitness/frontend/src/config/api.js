/**
 * Fitness App Frontend - API Configuration
 * 
 * This module provides the API base URL for the frontend.
 * The URL is loaded from REACT_APP_API_URL environment variable.
 * 
 * Environment variables:
 * - REACT_APP_API_URL: Base URL for fitness API (e.g., http://localhost:5001)
 *
 * Usage:
 *   import { API_BASE } from '@/config/api';
 *   
 *   const response = await fetch(`${API_BASE}/fitness/profile`, {
 *     headers: { 'Authorization': `Bearer ${token}` }
 *   });
 */

/**
 * Get the API base URL from environment.
 * Throws error if not set - prevents silent failures.
 */
const API_BASE = (() => {
  const url = process.env.REACT_APP_API_URL;
  
  if (!url) {
    throw new Error(
      'REACT_APP_API_URL environment variable is not set.\n' +
      'Run: cd fitness && ./env-sync.sh'
    );
  }
  
  // Remove trailing slash if present
  return url.endsWith('/') ? url.slice(0, -1) : url;
})();

/**
 * Get the Google Client ID from environment.
 * Optional - only required if using OAuth authentication.
 */
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

/**
 * API endpoints for fitness module
 */
const ENDPOINTS = {
  // User profile management
  PROFILE: '/api/fitness/profile',
  
  // Workout logging and history
  WORKOUTS: '/api/fitness/workouts',
  
  // Goals and targets
  GOALS: '/api/fitness/goals',
};

/**
 * Helper function to build full API URLs
 * @param {string} endpoint - The endpoint path (e.g., '/api/fitness/profile')
 * @param {object} params - Optional query parameters
 * @returns {string} Full API URL with query string
 */
function buildURL(endpoint, params = {}) {
  const url = new URL(`${API_BASE}${endpoint}`);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.append(key, value);
    }
  });
  
  return url.toString();
}

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint path
 * @param {object} options - Fetch options (method, body, etc.)
 * @param {string} token - JWT token for authentication
 * @returns {Promise<object>} Parsed JSON response
 * @throws {Error} If request fails or token is missing
 */
async function apiRequest(endpoint, options = {}, token) {
  if (!token) {
    throw new Error('Authentication token required for API request');
  }
  
  const url = buildURL(endpoint);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || `API Error: ${response.status} ${response.statusText}`
      );
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Request Failed (${endpoint}):`, error);
    throw error;
  }
}

/**
 * Health check - verify API is running
 * Does not require authentication
 */
async function healthCheck() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

module.exports = {
  API_BASE,
  GOOGLE_CLIENT_ID,
  ENDPOINTS,
  buildURL,
  apiRequest,
  healthCheck,
};
