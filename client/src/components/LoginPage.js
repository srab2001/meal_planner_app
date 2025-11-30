import React from 'react';
import './LoginPage.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const LOGIN_URL = (API_BASE || '').replace(/\/$/, '') + '/auth/google';

console.log('LoginPage API_BASE:', API_BASE);
console.log('LoginPage LOGIN_URL:', LOGIN_URL);

function LoginPage({ onLogin }) {
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Meal planner</h1>
          <p>Plan meals for the week</p>
        </div>

        <div className="login-content">
          <div className="features">
            <div className="feature">
              <span className="icon">🎯</span>
              <h3>Food choices</h3>
              <p>Use cuisine and diet options</p>
            </div>
            <div className="feature">
              <span className="icon">📅</span>
              <h3>Weekly plan</h3>
              <p>Seven days of meals</p>
            </div>
            <div className="feature">
              <span className="icon">📖</span>
              <h3>Recipes</h3>
              <p>Steps for each meal</p>
            </div>
          </div>

          {/* Main Google button as link */}
          <a
            href={LOGIN_URL}
            className="google-login-btn"
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </a>

          {/* Debug block: shows raw link so you can click or copy */}
          <div style={{ marginTop: '16px', fontSize: '12px', wordBreak: 'break-all' }}>
            <div>Debug login link:</div>
            <a href={LOGIN_URL}>{LOGIN_URL}</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;