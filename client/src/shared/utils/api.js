/**
 * Shared API utilities for ASR Health Portal
 * Used by all modules for consistent API communication
 */

// API Configuration - Always use production URLs (Vercel/Render)
// Local development should also point to production to avoid port conflicts
const PRODUCTION_API = 'https://meal-planner-app-mve2.onrender.com';
export const API_BASE = process.env.REACT_APP_API_URL || PRODUCTION_API;

/**
 * Get authentication token from localStorage
 */
export const getToken = () => localStorage.getItem('auth_token');

/**
 * Set authentication token in localStorage
 */
export const setToken = (token) => localStorage.setItem('auth_token', token);

/**
 * Remove authentication token from localStorage
 */
export const removeToken = () => localStorage.removeItem('auth_token');

/**
 * Make an authenticated API request
 * Automatically adds Authorization header and handles JSON
 * 
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @param {function} onAuthError - Callback when auth fails (401/403)
 * @returns {Promise<Response>}
 */
export const fetchWithAuth = async (url, options = {}, onAuthError = null) => {
  const token = getToken();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });

  // Handle authentication failures
  if (response.status === 401 || response.status === 403) {
    console.error('🔐 Authentication failed');
    if (onAuthError) {
      onAuthError();
    }
  }

  return response;
};

/**
 * Make an authenticated GET request and parse JSON
 * 
 * @param {string} endpoint - API endpoint (relative to API_BASE)
 * @param {function} onAuthError - Callback when auth fails
 * @returns {Promise<object>}
 */
export const apiGet = async (endpoint, onAuthError = null) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const response = await fetchWithAuth(url, { method: 'GET' }, onAuthError);
  return response.json();
};

/**
 * Make an authenticated POST request and parse JSON
 * 
 * @param {string} endpoint - API endpoint (relative to API_BASE)
 * @param {object} body - Request body
 * @param {function} onAuthError - Callback when auth fails
 * @returns {Promise<object>}
 */
export const apiPost = async (endpoint, body, onAuthError = null) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const response = await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(body)
  }, onAuthError);
  return response.json();
};
