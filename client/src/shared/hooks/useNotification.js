/**
 * useNotification Hook
 * 
 * React hook for displaying toast notifications.
 * Integrates with NotificationService singleton.
 * 
 * Usage:
 * const { showNotification, showSuccess, showError } = useNotification();
 * showSuccess('Operation completed!');
 */

import { useState, useEffect, useCallback } from 'react';
import { NotificationService } from '../services/engagement/NotificationService';

const useNotification = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Subscribe to notification service updates
    const unsubscribe = NotificationService.subscribe((queue) => {
      setNotifications([...queue]);
    });

    // Initialize with current queue
    setNotifications([...NotificationService.getAll()]);

    return unsubscribe;
  }, []);

  /**
   * Show a notification
   */
  const showNotification = useCallback((message, options = {}) => {
    return NotificationService.add({ message, ...options });
  }, []);

  /**
   * Show a success notification
   */
  const showSuccess = useCallback((message, options = {}) => {
    return NotificationService.success(message, options);
  }, []);

  /**
   * Show an error notification
   */
  const showError = useCallback((message, options = {}) => {
    return NotificationService.error(message, options);
  }, []);

  /**
   * Show a warning notification
   */
  const showWarning = useCallback((message, options = {}) => {
    return NotificationService.warning(message, options);
  }, []);

  /**
   * Show an info notification
   */
  const showInfo = useCallback((message, options = {}) => {
    return NotificationService.info(message, options);
  }, []);

  /**
   * Clear a specific notification or all notifications
   */
  const clear = useCallback((id = null) => {
    if (id) {
      NotificationService.dismiss(id);
    } else {
      NotificationService.dismissAll();
    }
  }, []);

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(() => {
    NotificationService.dismissAll();
  }, []);

  return {
    notifications,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clear,
    clearAll
  };
};

export default useNotification;
