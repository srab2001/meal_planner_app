/**
 * ToastContainer Component
 * 
 * Renders toast notifications in a fixed position overlay.
 * Uses ASR theme colors for styling.
 */

import React from 'react';
import { useNotification } from '../hooks';
import './ToastContainer.css';

const Toast = ({ notification, onClose }) => {
  const { id, message, type, icon, persistent } = notification;

  const getIcon = () => {
    if (icon) return icon;
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '•';
    }
  };

  return (
    <div className={`toast toast-${type}`} role="alert">
      <span className="toast-icon">{getIcon()}</span>
      <span className="toast-message">{message}</span>
      {persistent && (
        <button 
          className="toast-close" 
          onClick={() => onClose(id)}
          aria-label="Close notification"
        >
          ×
        </button>
      )}
    </div>
  );
};

const ToastContainer = ({ position = 'top-right', maxToasts = 5 }) => {
  const { notifications, clear } = useNotification();

  // Only show the most recent maxToasts
  const visibleNotifications = notifications.slice(-maxToasts);

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className={`toast-container toast-${position}`}>
      {visibleNotifications.map((notification) => (
        <Toast
          key={notification.id}
          notification={notification}
          onClose={clear}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
