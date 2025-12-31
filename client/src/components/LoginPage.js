import React, { useState, useEffect } from 'react';

// OAuth Configuration - Always use production URLs (Vercel/Render)
const PRODUCTION_OAUTH = 'https://meal-planner-app-mve2.onrender.com';
const OAUTH_BASE = process.env.REACT_APP_OAUTH_URL || PRODUCTION_OAUTH;

console.log('LoginPage OAUTH_BASE:', OAUTH_BASE);

function LoginPage({ onLogin }) {
  const [loginUrl, setLoginUrl] = useState('');

  useEffect(() => {
    // IMPORTANT: Clear any stale SSO returnTo value when using LoginPage
    // This prevents redirect loops when doing normal login (not SSO from fitness)
    localStorage.removeItem('sso_return_to');
    console.log('🔄 LoginPage: Cleared any stale sso_return_to');

    // Build OAuth URL with redirect destination if one was stored
    const redirect = localStorage.getItem('redirect_after_login');
    const state = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';
    const url = `${OAUTH_BASE}/auth/google${state}`;
    setLoginUrl(url);
    console.log('LoginPage LOGIN_URL:', url);
  }, []);

  const handleDemoLogin = () => {
    const demoUser = {
      id: 'demo-user-001',
      email: 'demo@asr.app',
      name: 'Demo User',
      role: 'user'
    };
    const demoToken = 'demo-token-' + Date.now();
    localStorage.setItem('auth_token', demoToken);
    localStorage.setItem('user', JSON.stringify(demoUser));
    if (onLogin) {
      onLogin(demoUser);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '28px', marginBottom: '10px', color: '#333' }}>
          AI Meal Planner
        </h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Plan your weekly meals with personalized AI-generated recipes
        </p>

        {/* Demo Login Button */}
        <button
          onClick={handleDemoLogin}
          style={{
            width: '100%',
            padding: '14px 20px',
            fontSize: '16px',
            fontWeight: '600',
            background: '#F5A623',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          Try Demo (No Login Required)
        </button>

        {/* Google Login Button */}
        {loginUrl && (
          <a
            href={loginUrl}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              padding: '14px 20px',
              fontSize: '16px',
              fontWeight: '600',
              background: 'white',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '8px',
              textDecoration: 'none',
              boxSizing: 'border-box'
            }}
          >
            <span style={{ fontSize: '20px' }}>G</span>
            Continue with Google
          </a>
        )}
      </div>
    </div>
  );
}

export default LoginPage;