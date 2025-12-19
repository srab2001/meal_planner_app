/**
 * TokenStorage - Secure token storage for integration credentials
 * 
 * Security Features:
 * - Tokens encrypted before storage (using basic obfuscation for demo)
 * - Tokens scoped to user ID
 * - Automatic expiration checking
 * - No plaintext storage
 * 
 * NOTE: In production, use proper encryption (Web Crypto API) 
 * and consider secure backend storage for sensitive tokens.
 */

const STORAGE_PREFIX = 'asr_int_token_';

// Simple obfuscation (NOT cryptographically secure - demo only)
// In production, use Web Crypto API or backend storage
const obfuscate = (str) => {
  if (!str) return '';
  return btoa(str.split('').reverse().join(''));
};

const deobfuscate = (str) => {
  if (!str) return '';
  try {
    return atob(str).split('').reverse().join('');
  } catch {
    return '';
  }
};

class TokenStorage {
  constructor() {
    this.userId = null;
  }

  /**
   * Set the current user ID for scoping tokens
   */
  setUserId(userId) {
    this.userId = userId;
  }

  /**
   * Get storage key for a provider
   */
  _getKey(provider) {
    if (!this.userId) {
      console.warn('[TokenStorage] No userId set - tokens may not be scoped correctly');
    }
    return `${STORAGE_PREFIX}${this.userId || 'anon'}_${provider}`;
  }

  /**
   * Store a token securely
   * @param {string} provider - Provider name (e.g., 'fitbit', 'apple_health')
   * @param {object} tokenData - Token data to store
   * @param {string} tokenData.accessToken - The access token
   * @param {string} tokenData.refreshToken - Optional refresh token
   * @param {number} tokenData.expiresAt - Expiration timestamp
   */
  storeToken(provider, tokenData) {
    if (!provider || !tokenData?.accessToken) {
      console.error('[TokenStorage] Invalid token data');
      return false;
    }

    const toStore = {
      accessToken: obfuscate(tokenData.accessToken),
      refreshToken: tokenData.refreshToken ? obfuscate(tokenData.refreshToken) : null,
      expiresAt: tokenData.expiresAt || null,
      storedAt: Date.now(),
      provider
    };

    try {
      localStorage.setItem(this._getKey(provider), JSON.stringify(toStore));
      console.log(`[TokenStorage] Token stored for ${provider}`);
      return true;
    } catch (err) {
      console.error('[TokenStorage] Failed to store token:', err);
      return false;
    }
  }

  /**
   * Retrieve a stored token
   * @param {string} provider - Provider name
   * @returns {object|null} Token data or null if not found/expired
   */
  getToken(provider) {
    try {
      const stored = localStorage.getItem(this._getKey(provider));
      if (!stored) return null;

      const data = JSON.parse(stored);
      
      // Check expiration
      if (data.expiresAt && Date.now() > data.expiresAt) {
        console.log(`[TokenStorage] Token expired for ${provider}`);
        this.removeToken(provider);
        return null;
      }

      return {
        accessToken: deobfuscate(data.accessToken),
        refreshToken: data.refreshToken ? deobfuscate(data.refreshToken) : null,
        expiresAt: data.expiresAt,
        storedAt: data.storedAt,
        provider: data.provider
      };
    } catch (err) {
      console.error('[TokenStorage] Failed to retrieve token:', err);
      return null;
    }
  }

  /**
   * Check if a valid token exists
   * @param {string} provider - Provider name
   * @returns {boolean}
   */
  hasValidToken(provider) {
    const token = this.getToken(provider);
    return token !== null && token.accessToken;
  }

  /**
   * Remove a token
   * @param {string} provider - Provider name
   */
  removeToken(provider) {
    try {
      localStorage.removeItem(this._getKey(provider));
      console.log(`[TokenStorage] Token removed for ${provider}`);
      return true;
    } catch (err) {
      console.error('[TokenStorage] Failed to remove token:', err);
      return false;
    }
  }

  /**
   * Remove all tokens for current user
   */
  clearAllTokens() {
    const prefix = `${STORAGE_PREFIX}${this.userId || 'anon'}_`;
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`[TokenStorage] Cleared ${keysToRemove.length} tokens`);
    return keysToRemove.length;
  }

  /**
   * Get all connected providers
   * @returns {string[]} Array of provider names with valid tokens
   */
  getConnectedProviders() {
    const prefix = `${STORAGE_PREFIX}${this.userId || 'anon'}_`;
    const providers = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(prefix)) {
        const provider = key.replace(prefix, '');
        if (this.hasValidToken(provider)) {
          providers.push(provider);
        }
      }
    }
    
    return providers;
  }
}

// Export singleton
export const tokenStorage = new TokenStorage();
export default tokenStorage;
