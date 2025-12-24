import React from 'react';
import featureFlags from '../shared/services/FeatureFlags';
import './AppSwitchboard.css';

/**
 * AppSwitchboard - Main app launcher/navigation hub
 * 
 * Shown after splash screen, allows user to select which app to use.
 * Future apps can be added here as tiles.
 */
export default function AppSwitchboard({ onSelectApp, user, onLogout }) {
  // Check feature flag for integrations
  const integrationsEnabled = featureFlags.isEnabled('health_integrations');
  
  // Check if user is admin
  const isAdmin = user?.role === 'admin';

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
      name: 'Fitness',
      description: 'Workout tracking and exercise planning',
      icon: '💪',
      color: '#27ae60',
      available: true,
      comingSoon: false
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
          {onLogout && (
            <button className="logout-btn" onClick={onLogout} title="Sign out">
              <span>🚪</span> Logout
            </button>
          )}
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
