/**
 * NotificationService - Toast and in-app notification management
 * 
 * Features:
 * - Toast notifications (success, error, warning, info)
 * - Persistent notifications
 * - Notification queue management
 * - Auto-dismiss with configurable duration
 */

class NotificationServiceClass {
  constructor() {
    this.listeners = new Set();
    this.notifications = [];
    this.nextId = 1;
  }

  /**
   * Subscribe to notification changes
   * @param {Function} callback - Called when notifications change
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of changes
   */
  notify() {
    this.listeners.forEach(callback => callback([...this.notifications]));
  }

  /**
   * Add a notification
   * @param {Object} options - Notification options
   * @returns {number} Notification ID
   */
  add({ 
    type = 'info', 
    title, 
    message, 
    duration = 5000, 
    persistent = false,
    action = null,
    icon = null 
  }) {
    const id = this.nextId++;
    
    const notification = {
      id,
      type,
      title,
      message,
      duration,
      persistent,
      action,
      icon: icon || this.getDefaultIcon(type),
      createdAt: Date.now()
    };

    this.notifications.push(notification);
    this.notify();

    // Auto-dismiss non-persistent notifications
    if (!persistent && duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }

    return id;
  }

  /**
   * Get default icon for notification type
   */
  getDefaultIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      achievement: '🏆',
      streak: '🔥'
    };
    return icons[type] || icons.info;
  }

  /**
   * Dismiss a notification
   * @param {number} id - Notification ID
   */
  dismiss(id) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      this.notify();
    }
  }

  /**
   * Dismiss all notifications
   */
  dismissAll() {
    this.notifications = [];
    this.notify();
  }

  /**
   * Get all current notifications
   */
  getAll() {
    return [...this.notifications];
  }

  // Convenience methods
  success(message, title = 'Success') {
    return this.add({ type: 'success', title, message });
  }

  error(message, title = 'Error') {
    return this.add({ type: 'error', title, message, duration: 8000 });
  }

  warning(message, title = 'Warning') {
    return this.add({ type: 'warning', title, message });
  }

  info(message, title = 'Info') {
    return this.add({ type: 'info', title, message });
  }

  achievement(message, title = 'Achievement Unlocked!') {
    return this.add({ 
      type: 'achievement', 
      title, 
      message, 
      duration: 6000,
      icon: '🏆'
    });
  }

  streak(message, title = 'Streak!') {
    return this.add({ 
      type: 'streak', 
      title, 
      message, 
      duration: 5000,
      icon: '🔥'
    });
  }
}

// Export singleton instance
export const NotificationService = new NotificationServiceClass();
