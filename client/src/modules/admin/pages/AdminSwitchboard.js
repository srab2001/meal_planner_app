import React, { useState, useEffect } from 'react';
import '../styles/AdminPanel.css';

const PRODUCTION_API = 'https://meal-planner-app-mve2.onrender.com';
const API_BASE = process.env.REACT_APP_API_URL || PRODUCTION_API;

/**
 * AdminSwitchboard - Admin panel navigation hub
 * Shows different admin management options
 * 
 * Note: Authorization is enforced by the backend API endpoints.
 * If the user doesn't have admin role, the actual API calls will fail
 * with 403 Forbidden responses, which are handled by the individual
 * admin components (UserManagementPanel, AdminCoachPanel, etc).
 */
export default function AdminSwitchboard({ user, onBack, onNavigate }) {
  const adminOptions = [
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage users, roles, and invitations',
      icon: '👥',
      action: () => onNavigate ? onNavigate('admin-users') : null,
    },
    {
      id: 'step-media',
      title: 'Step Media',
      description: 'Manage videos and posters for meal planning steps',
      icon: '🎬',
      action: () => onNavigate ? onNavigate('admin-step-media') : null,
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
