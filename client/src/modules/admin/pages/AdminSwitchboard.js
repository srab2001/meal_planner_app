import React, { useState, useEffect } from 'react';
import '../styles/AdminPanel.css';

const PRODUCTION_API = 'https://meal-planner-app-mve2.onrender.com';
const API_BASE = process.env.REACT_APP_API_URL || PRODUCTION_API;

/**
 * AdminSwitchboard - Admin panel navigation hub
 * Shows different admin management options
 */
export default function AdminSwitchboard({ user, onBack, onNavigate }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verify user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('auth_token');
        
        // Try to access admin endpoint to verify admin role
        const response = await fetch(`${API_BASE}/api/admin/users`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 403) {
          setIsAdmin(false);
        } else if (response.ok) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-state">Loading admin panel...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-container">
        <div className="error-state">
          <h2>Access Denied</h2>
          <p>You do not have admin privileges to access this page.</p>
          <button className="back-button" onClick={onBack}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const adminOptions = [
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage users, roles, and invitations',
      icon: '👥',
      action: () => onNavigate ? onNavigate('admin-users') : null,
    },
  ];

  return (
    <div className="admin-container">
      <div className="admin-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1>Admin Panel</h1>
        <p className="subtitle">Welcome, {user?.name || user?.email || 'Admin'}</p>
      </div>

      <div className="admin-switchboard">
        <div className="options-grid">
          {adminOptions.map((option) => (
            <button
              key={option.id}
              className="admin-option-card"
              onClick={option.action}
            >
              <div className="option-icon">{option.icon}</div>
              <h3>{option.title}</h3>
              <p>{option.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
