/**
 * Haptic Feedback Utility
 * Provides vibration feedback for touch interactions on supported devices
 */

/**
 * Trigger haptic feedback with different intensity levels
 * @param {string} type - Type of haptic feedback ('light', 'medium', 'heavy', 'success', 'error')
 */
export const hapticFeedback = (type = 'light') => {
  // Check if vibration API is available
  if (!('vibrate' in navigator)) {
    return;
  }

  const patterns = {
    light: 10,
    medium: 20,
    heavy: 30,
    success: [10, 50, 10],
    error: [20, 100, 20, 100, 20],
    warning: [15, 75, 15],
    notification: [10, 30, 10, 30, 10]
  };

  const pattern = patterns[type] || patterns.light;

  try {
    navigator.vibrate(pattern);
  } catch (error) {
    // Silently fail if vibration is not supported or blocked
    console.debug('Haptic feedback not available:', error);
  }
};

/**
 * Cancel any ongoing vibration
 */
export const cancelHaptic = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(0);
  }
};

/**
 * Check if haptic feedback is available
 * @returns {boolean}
 */
export const isHapticAvailable = () => {
  return 'vibrate' in navigator;
};

// Example usage patterns:
// hapticFeedback('light') - on button press
// hapticFeedback('medium') - on toggle switch
// hapticFeedback('heavy') - on important action
// hapticFeedback('success') - on successful operation
// hapticFeedback('error') - on error or validation failure
// hapticFeedback('warning') - on warning message
// hapticFeedback('notification') - on new notification

export default {
  hapticFeedback,
  cancelHaptic,
  isHapticAvailable
};
