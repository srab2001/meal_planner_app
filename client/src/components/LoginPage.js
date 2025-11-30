import React from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const LOGIN_URL = (API_BASE || '').replace(/\/$/, '') + '/auth/google';

console.log('LoginPage API_BASE:', API_BASE);
console.log('LoginPage LOGIN_URL:', LOGIN_URL);

function LoginPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Meal planner login</h1>

      <p>Step 1: start Google login.</p>

      {/* This is a plain anchor. No JS, no button wrapper. */}
      <p>
        <a href={LOGIN_URL}>Start Google login</a>
      </p>

      <p>Step 2: if the link above does nothing, copy this URL and paste in a new tab:</p>
      <pre>{LOGIN_URL}</pre>
    </div>
  );
}

export default LoginPage;