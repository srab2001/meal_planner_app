import React, { useState, useEffect } from 'react';
import './SwitchboardNext.css';

/**
 * SwitchboardNext - Next-gen app launcher with household context
 *
 * Features:
 * - Household selector
 * - App tiles for all modules (RBAC-filtered)
 * - CORE DB status counts
 * - Environment banner
 */

const API_BASE = process.env.REACT_APP_API_URL || 'https://meal-planner-app-mve2.onrender.com';

export default function SwitchboardNext({
  user,
  onSelectApp,
  onLogout,
  onLogin
}) {
  const [households, setHouseholds] = useState([]);
  const [activeHousehold, setActiveHousehold] = useState(null);
  const [visibleApps, setVisibleApps] = useState([]);
  const [statusCounts, setStatusCounts] = useState({
    pantryExpiring: 0,
    complianceMissed: 0,
    constraintsCount: 0
  });
  const [loading, setLoading] = useState(true);

  // Environment detection
  const isPreview = window.location.hostname.includes('preview') ||
    window.location.hostname.includes('vercel') ||
    process.env.REACT_APP_ENV === 'preview';

  const isProduction = window.location.hostname === 'asr-health-portal.vercel.app' ||
    process.env.REACT_APP_ENV === 'production';

  // Fetch households on mount
  useEffect(() => {
    if (user) {
      fetchHouseholds();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Fetch status counts and visible apps when household changes
  useEffect(() => {
    if (activeHousehold) {
      fetchStatusCounts();
      fetchVisibleApps();
    }
  }, [activeHousehold]);

  const fetchHouseholds = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/core/households`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setHouseholds(data.households || []);

        // Set active household from cookie or first one
        const savedHouseholdId = localStorage.getItem('active_household_id');
        const active = data.households.find(h => h.id === savedHouseholdId) ||
          data.households[0];

        if (active) {
          setActiveHousehold(active);
          localStorage.setItem('active_household_id', active.id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch households:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusCounts = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${API_BASE}/api/core/status-counts?household_id=${activeHousehold.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setStatusCounts(data);
      }
    } catch (err) {
      console.error('Failed to fetch status counts:', err);
    }
  };

  const fetchVisibleApps = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${API_BASE}/api/core/visible-apps?household_id=${activeHousehold.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setVisibleApps(data.apps || []);
      } else {
        // Fallback: show all apps if API fails
        setVisibleApps([
          'meal-planner', 'fitness', 'coaching', 'pantry',
          'compliance', 'household', 'medical'
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch visible apps:', err);
      // Fallback: show all apps
      setVisibleApps([
        'meal-planner', 'fitness', 'coaching', 'pantry',
        'compliance', 'household', 'medical'
      ]);
    }
  };

  const handleHouseholdChange = (household) => {
    setActiveHousehold(household);
    localStorage.setItem('active_household_id', household.id);
  };

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
    if (onLogin) onLogin(demoUser);
  };

  const handleGoogleLogin = () => {
    const redirectUrl = `${window.location.origin}/switchboard`;
    window.location.href = `${API_BASE}/auth/google?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  // App definitions with RBAC visibility
  const allApps = [
    {
      id: 'meal-planner',
      name: 'Meal Planner',
      description: 'AI-powered meal planning',
      icon: '🍽️',
      color: '#5B2C6F'
    },
    {
      id: 'fitness',
      name: 'Fitness Coach',
      description: 'Workout planning & tracking',
      icon: '💪',
      color: '#27ae60',
      externalUrl: 'https://frontend-six-topaz-27.vercel.app'
    },
    {
      id: 'coaching',
      name: 'AI Coach',
      description: 'Personalized health coaching',
      icon: '🎯',
      color: '#9b59b6'
    },
    {
      id: 'pantry',
      name: 'Pantry',
      description: 'Track food inventory',
      icon: '🥫',
      color: '#e67e22',
      badge: statusCounts.pantryExpiring > 0 ? `${statusCounts.pantryExpiring} expiring` : null
    },
    {
      id: 'compliance',
      name: 'Compliance',
      description: 'Dietary compliance tracking',
      icon: '✓',
      color: '#3498db',
      badge: statusCounts.complianceMissed > 0 ? `${statusCounts.complianceMissed} missed` : null
    },
    {
      id: 'household',
      name: 'Household',
      description: 'Manage members & invites',
      icon: '👨‍👩‍👧‍👦',
      color: '#1abc9c'
    },
    {
      id: 'medical',
      name: 'Medical',
      description: 'Health profiles & restrictions',
      icon: '🏥',
      color: '#e74c3c',
      badge: statusCounts.constraintsCount > 0 ? `${statusCounts.constraintsCount} constraints` : null
    },
    {
      id: 'admin',
      name: 'Admin',
      description: 'System administration',
      icon: '🔐',
      color: '#95a5a6'
    }
  ];

  // Filter apps based on RBAC visibility
  const apps = allApps
    .filter(app => visibleApps.includes(app.id))
    .map(app => ({ ...app, available: true }));

  const handleAppClick = (app) => {
    if (!app.available) return;

    if (app.externalUrl) {
      // Pass auth to external app
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        const params = new URLSearchParams({ token, user: userStr });
        window.open(`${app.externalUrl}#auth=${params.toString()}`, '_blank');
      } else {
        window.open(app.externalUrl, '_blank');
      }
      return;
    }

    if (onSelectApp) {
      onSelectApp(app.id);
    }
  };

  if (loading) {
    return (
      <div className="switchboard-next loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="switchboard-next">
      {/* Environment Banner */}
      {isPreview && (
        <div className="environment-banner preview">
          ⚠️ Preview Environment — Data is isolated
        </div>
      )}

      {/* Background */}
      <div className="switchboard-bg"></div>

      {/* Header */}
      <header className="switchboard-header">
        <div className="switchboard-logo">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="95" fill="none" stroke="white" strokeWidth="3" />
            <circle cx="100" cy="100" r="85" fill="rgba(255,255,255,0.1)" />
            <text x="100" y="115" fontSize="52" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="system-ui">
              ASR
            </text>
          </svg>
        </div>

        <div className="switchboard-header-content">
          <div>
            <h1>ASR Health Portal</h1>
            <p className="switchboard-subtitle">Next Generation</p>
            {user && (
              <p className="switchboard-welcome">Welcome, {user.displayName || user.email}</p>
            )}
          </div>

          <div className="switchboard-auth">
            {!user ? (
              <div className="auth-buttons">
                <button className="btn-google" onClick={handleGoogleLogin}>
                  🔐 Sign in with Google
                </button>
                <button className="btn-demo" onClick={handleDemoLogin}>
                  🎯 Demo Login
                </button>
              </div>
            ) : (
              <div className="user-info">
                {/* Household Selector */}
                {households.length > 0 && (
                  <div className="household-selector">
                    <label>Household:</label>
                    <select
                      value={activeHousehold?.id || ''}
                      onChange={(e) => {
                        const h = households.find(h => h.id === e.target.value);
                        if (h) handleHouseholdChange(h);
                      }}
                    >
                      {households.map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <span className="user-email">{user.email}</span>
                <button className="btn-logout" onClick={onLogout}>
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* App Grid */}
      <main className="switchboard-grid">
        <h2>Choose Your App</h2>

        <div className="app-tiles">
          {apps.map(app => (
            <button
              key={app.id}
              className="app-tile"
              onClick={() => handleAppClick(app)}
              style={{ '--app-color': app.color }}
            >
              <span className="app-icon">{app.icon}</span>
              <h3>{app.name}</h3>
              <p>{app.description}</p>
              {app.badge && (
                <span className="app-badge">{app.badge}</span>
              )}
            </button>
          ))}
        </div>
      </main>

      {/* Status Footer */}
      {user && activeHousehold && (
        <div className="status-footer">
          <div className="status-item">
            <span className="status-icon">🥫</span>
            <span>{statusCounts.pantryExpiring} items expiring soon</span>
          </div>
          <div className="status-item">
            <span className="status-icon">✓</span>
            <span>{statusCounts.complianceMissed} compliance items missed</span>
          </div>
          <div className="status-item">
            <span className="status-icon">⚕️</span>
            <span>{statusCounts.constraintsCount} active constraints</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="switchboard-footer">
        <p>© 2025 ASR Digital Services. All rights reserved.</p>
      </footer>
    </div>
  );
}
