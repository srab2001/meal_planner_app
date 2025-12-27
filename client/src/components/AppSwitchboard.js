import React from 'react';
import featureFlags from '../shared/services/FeatureFlags';
import './AppSwitchboard.css';

/**
 * AppSwitchboard - Main app launcher/navigation hub
 * 
 * Shown after splash screen, allows user to select which app to use.
 * Future apps can be added here as tiles.
 */
export default function AppSwitchboard({ onSelectApp, user, onLogout, onLogin }) {
  // Check feature flag for integrations
  const integrationsEnabled = featureFlags.isEnabled('health_integrations');

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Demo login handler
  const handleDemoLogin = () => {
    const demoUser = {
      id: 'demo-user-001',
      email: 'demo@asr.app',
      name: 'Demo User',
      role: 'user',
    };
    const demoToken = 'demo-token-' + Date.now();
    localStorage.setItem('auth_token', demoToken);
    localStorage.setItem('user', JSON.stringify(demoUser));
    if (onLogin) {
      onLogin(demoUser);
    } else {
      window.location.reload();
    }
  };

  // Google login handler
  const handleGoogleLogin = () => {
    const redirectUrl = `${window.location.origin}/switchboard`;
    window.location.href = `${process.env.REACT_APP_API_URL || 'https://meal-planner-app-mve2.onrender.com'}/auth/google?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const apps = [
    {
      id: 'meal-planner',
      name: 'Meal Planner',
      description: 'AI-powered meal planning with price comparison',
      icon: '🍽️',
      color: 'var(--asr-purple-600)',
      available: true
    },
    {
      id: 'nutrition',
      name: 'Nutrition',
      description: 'Calorie counting and nutritional insights',
      icon: '🥗',
      color: 'var(--asr-orange-600)',
      available: true
    },
    {
      id: 'coaching',
      name: 'AI Coach',
      description: 'Personalized health coaching and programs',
      icon: '🎯',
      color: 'var(--asr-purple-500)',
      available: true
    },
    {
      id: 'progress',
      name: 'Progress',
      description: 'Streak tracking, badges, and referrals',
      icon: '🏆',
      color: '#f59e0b',
      available: true
    },
    // Integrations - conditionally shown based on feature flag
    ...(integrationsEnabled ? [{
      id: 'integrations',
      name: 'Integrations',
      description: 'Connect Apple Health, Fitbit, Google Fit',
      icon: '🔗',
      color: '#3b82f6',
      available: true
    }] : []),
    {
      id: 'health-tracker',
      name: 'Health Tracker',
      description: 'Track your health metrics and wellness goals',
      icon: '❤️',
      color: 'var(--asr-red-600)',
      available: false,
      comingSoon: true
    },
    {
      id: 'fitness',
      name: 'Fitness Coach',
      description: 'AI-powered workout planning with gym & pool options',
      icon: '💪',
      color: '#27ae60',
      available: true,
      comingSoon: false,
      externalUrl: 'https://frontend-6ba0ux9z7-stus-projects-458dd35a.vercel.app'
    },
    // Admin panel - always shown, but requires login + admin role
    {
      id: 'admin',
      name: 'Admin',
      description: 'User management and system administration',
      icon: '🔐',
      color: '#e91e63',
      available: true,
      comingSoon: false
    },
  ];

  const handleAppClick = (app) => {
    // Handle external URL apps (like new Fitness Coach)
    if (app.externalUrl) {
      window.open(app.externalUrl, '_blank');
      return;
    }

    // Special handling for admin tile
    if (app.id === 'admin') {
      if (!user) {
        // User not logged in - redirect to Google login
        // The redirect query param tells the backend to return to admin panel after login
        const redirectUrl = `${window.location.origin}/switchboard?admin=true`;
        window.location.href = `${process.env.REACT_APP_API_URL || 'https://meal-planner-app-mve2.onrender.com'}/auth/google?redirect=${encodeURIComponent(redirectUrl)}`;
      } else if (!isAdmin) {
        // User is logged in but not admin
        alert('You do not have admin privileges');
        return;
      } else {
        // User is logged in and is admin - navigate to admin panel
        onSelectApp(app.id);
      }
      return;
    }

    // Normal app click handling
    if (app.available && onSelectApp) {
      onSelectApp(app.id);
    }
  };

  return (
    <div className="switchboard-container">
      {/* Background */}
      <div className="switchboard-bg"></div>

      {/* Header */}
      <header className="switchboard-header">
        <div className="switchboard-logo">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="95" fill="none" stroke="white" strokeWidth="3"/>
            <circle cx="100" cy="100" r="85" fill="rgba(255,255,255,0.1)"/>
            <text 
              x="100" 
              y="115" 
              fontSize="52" 
              fontWeight="bold" 
              textAnchor="middle" 
              fill="white" 
              fontFamily="system-ui"
            >
              ASR
            </text>
          </svg>
        </div>
        <div className="switchboard-header-content">
          <div>
            <h1>ASR Digital Services</h1>
            <p className="switchboard-subtitle">Health & Wellness Portal</p>
            {user && (
              <p className="switchboard-welcome">
                Welcome back, {user.name || user.email}!
              </p>
            )}
          </div>
          <div className="switchboard-auth-buttons">
            {!user ? (
              <>
                <button
                  className="google-login-btn"
                  onClick={handleGoogleLogin}
                  style={{
                    background: 'white',
                    color: '#333',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginRight: '10px'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>🔐</span> Sign in with Google
                </button>
                <button
                  className="demo-login-btn"
                  onClick={handleDemoLogin}
                  style={{
                    background: '#F5A623',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>🎯</span> Demo Login
                </button>
              </>
            ) : (
              onLogout && (
                <button className="logout-btn" onClick={onLogout} title="Sign out">
                  <span>🚪</span> Logout
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {/* App Grid */}
      <main className="switchboard-grid">
        <h2>Choose Your App</h2>
        <div className="app-tiles">
          {apps.map((app) => (
            <button
              key={app.id}
              className={`app-tile ${!app.available ? 'disabled' : ''}`}
              onClick={() => handleAppClick(app)}
              disabled={!app.available}
              style={{ '--app-color': app.color }}
            >
              <span className="app-icon">{app.icon}</span>
              <h3>{app.name}</h3>
              <p>{app.description}</p>
              {app.comingSoon && (
                <span className="coming-soon-badge">Coming Soon</span>
              )}
            </button>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="switchboard-footer">
        <p>© 2025 ASR Digital Services. All rights reserved.</p>
      </footer>
    </div>
  );
}
