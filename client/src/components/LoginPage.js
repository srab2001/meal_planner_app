import React, { useState, useEffect } from 'react';

// OAuth Configuration - Always use production URLs (Vercel/Render)
const PRODUCTION_OAUTH = 'https://meal-planner-app-mve2.onrender.com';
const OAUTH_BASE = process.env.REACT_APP_OAUTH_URL || PRODUCTION_OAUTH;

console.log('LoginPage OAUTH_BASE:', OAUTH_BASE);

function LoginPage() {
  const [loginUrl, setLoginUrl] = useState('');

  useEffect(() => {
    // Build OAuth URL with redirect destination if one was stored
    const redirect = localStorage.getItem('redirect_after_login');
    const state = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';
    const url = `${OAUTH_BASE}/auth/google${state}`;
    setLoginUrl(url);
    console.log('LoginPage LOGIN_URL:', url);
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Meal planner login</h1>

      <p>Step 1: start Google login.</p>

      {/* This is a plain anchor. No JS, no button wrapper. */}
      <p>
        {loginUrl ? (
          <a href={loginUrl}>Start Google login</a>
        ) : (
          <span>Loading...</span>
        )}
      </p>

      <p>Step 2: if the link above does nothing, copy this URL and paste in a new tab:</p>
      <pre>{loginUrl}</pre>
    </div>
  );
}

export default LoginPage;