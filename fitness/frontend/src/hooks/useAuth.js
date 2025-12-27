import { useState, useEffect } from 'react';

/**
 * Custom hook for authentication
 * Retrieves user and token from localStorage/sessionStorage
 * Also checks URL hash for auth passed from main switchboard
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // First, check URL hash for auth passed from main switchboard
    const hash = window.location.hash;
    if (hash && hash.startsWith('#auth=')) {
      try {
        const params = new URLSearchParams(hash.substring(6)); // Remove '#auth='
        const urlToken = params.get('token');
        const urlUser = params.get('user');

        if (urlToken && urlUser) {
          const parsedUser = JSON.parse(urlUser);
          // Store in localStorage for this app
          localStorage.setItem('token', urlToken);
          localStorage.setItem('auth_token', urlToken); // Also store as auth_token for consistency
          localStorage.setItem('user', urlUser);
          setUser(parsedUser);
          setToken(urlToken);
          // Clean up URL hash
          window.history.replaceState(null, '', window.location.pathname);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Failed to parse auth from URL:', err);
      }
    }

    // Try to get auth from localStorage (persisted from main app)
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token') || localStorage.getItem('auth_token');

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (err) {
        console.error('Failed to parse stored auth:', err);
        logout();
      }
    }

    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    window.location.href = '/';
  };

  return { user, token, loading, logout, setUser, setToken };
}
