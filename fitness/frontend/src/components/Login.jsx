import { useState } from 'react';
import './Login.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://meal-planner-app-mve2.onrender.com';

/**
 * Login Component for Fitness App
 * Supports:
 * - Google OAuth (primary)
 * - Demo login (for testing)
 * - Email/password (fallback)
 */
function Login({ onLoginSuccess }) {
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Main switchboard URL for SSO login
  // Use the stable Vercel project domain (not deployment-specific URL)
  const SWITCHBOARD_URL = 'https://meal-planner-gold-one.vercel.app';

  // Google OAuth login - redirect to main switchboard
  // After login there, user clicks Fitness Coach to return with SSO
  const handleGoogleLogin = () => {
    // Store fitness app URL so switchboard knows where to redirect
    const fitnessReturnUrl = window.location.origin;
    // Redirect to switchboard - user will login there and click Fitness Coach to return
    window.location.href = `${SWITCHBOARD_URL}?returnTo=fitness`;
  };

  // Demo login for testing
  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);

    try {
      // Try demo login endpoint first
      const response = await fetch(`${API_BASE}/api/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        if (onLoginSuccess) {
          onLoginSuccess(data.user, data.token);
        }
      } else {
        // Fallback: create a demo session locally
        const demoUser = {
          id: 'demo-user-001',
          email: 'demo@fitness.app',
          name: 'Demo User',
          role: 'user',
        };
        const demoToken = 'demo-token-' + Date.now();
        localStorage.setItem('user', JSON.stringify(demoUser));
        localStorage.setItem('token', demoToken);
        if (onLoginSuccess) {
          onLoginSuccess(demoUser, demoToken);
        }
      }
    } catch (err) {
      // Fallback to local demo if server unreachable
      const demoUser = {
        id: 'demo-user-001',
        email: 'demo@fitness.app',
        name: 'Demo User',
        role: 'user',
      };
      const demoToken = 'demo-token-' + Date.now();
      localStorage.setItem('user', JSON.stringify(demoUser));
      localStorage.setItem('token', demoToken);
      if (onLoginSuccess) {
        onLoginSuccess(demoUser, demoToken);
      }
    } finally {
      setLoading(false);
    }
  };

  // Email/password login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        if (onLoginSuccess) {
          onLoginSuccess(data.user, data.token);
        }
      } else {
        setError(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background */}
      <div className="login-bg"></div>

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="95" fill="none" stroke="#5B2C6F" strokeWidth="3"/>
            <circle cx="100" cy="100" r="85" fill="rgba(91, 44, 111, 0.1)"/>
            <text
              x="100"
              y="115"
              fontSize="52"
              fontWeight="bold"
              textAnchor="middle"
              fill="#5B2C6F"
              fontFamily="system-ui"
            >
              ASR
            </text>
          </svg>
        </div>

        <div className="login-header">
          <h1>Fitness Coach</h1>
          <p>AI-powered workout planning</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Main Login Options */}
        {!showEmailLogin ? (
          <div className="login-options">
            {/* Google Login - Primary */}
            <button
              className="login-btn login-btn--google"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in via ASR Portal
            </button>

            {/* Demo Login */}
            <button
              className="login-btn login-btn--demo"
              onClick={handleDemoLogin}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Quick Demo (No Login)'}
            </button>

            {/* Divider */}
            <div className="login-divider">
              <span>or</span>
            </div>

            {/* Email Login Toggle */}
            <button
              className="login-btn login-btn--secondary"
              onClick={() => setShowEmailLogin(true)}
            >
              Sign in with Email
            </button>
          </div>
        ) : (
          /* Email Login Form */
          <form onSubmit={handleEmailLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                autoFocus
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Log In'}
            </button>

            <button
              type="button"
              className="login-btn login-btn--secondary"
              onClick={() => setShowEmailLogin(false)}
            >
              Back to Login Options
            </button>
          </form>
        )}

        <div className="login-footer">
          <p>© 2025 ASR Digital Services</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
