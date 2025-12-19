/**
 * useFeedback Hook
 * 
 * React hook for collecting user feedback.
 * Integrates with FeedbackService singleton.
 * 
 * Usage:
 * const { submitRating, shouldPrompt, feedbackStats } = useFeedback();
 * submitRating(5, 'Great app!');
 */

import { useState, useEffect, useCallback } from 'react';
import FeedbackService, { 
  FEEDBACK_TYPES, 
  RATING_SCALE, 
  NPS_CATEGORIES 
} from '../services/engagement/FeedbackService';

const useFeedback = () => {
  const [stats, setStats] = useState(null);
  const [promptStatus, setPromptStatus] = useState(null);
  const [lastFeedback, setLastFeedback] = useState(null);

  /**
   * Refresh feedback state
   */
  const refresh = useCallback(() => {
    setStats(FeedbackService.getStats());
    setPromptStatus(FeedbackService.shouldPromptForFeedback());
  }, []);

  useEffect(() => {
    // Initial load
    refresh();

    // Subscribe to feedback events
    const unsubscribe = FeedbackService.subscribe((event, data) => {
      if (event === 'submitted') {
        setLastFeedback(data);
        refresh();
        
        // Clear last feedback notification after display
        setTimeout(() => setLastFeedback(null), 3000);
      } else if (event === 'reset') {
        setLastFeedback(null);
        refresh();
      }
    });

    return unsubscribe;
  }, [refresh]);

  /**
   * Submit a rating (1-5)
   */
  const submitRating = useCallback((rating, comment = '', context = {}) => {
    return FeedbackService.submitRating(rating, comment, context);
  }, []);

  /**
   * Submit NPS score (0-10)
   */
  const submitNPS = useCallback((score, comment = '', context = {}) => {
    return FeedbackService.submitNPS(score, comment, context);
  }, []);

  /**
   * Submit feature request
   */
  const submitFeatureRequest = useCallback((title, description, priority = 'medium', context = {}) => {
    return FeedbackService.submitFeatureRequest(title, description, priority, context);
  }, []);

  /**
   * Submit bug report
   */
  const submitBugReport = useCallback((title, description, severity = 'medium', context = {}) => {
    return FeedbackService.submitBugReport(title, description, severity, context);
  }, []);

  /**
   * Submit general feedback
   */
  const submitGeneral = useCallback((message, category = 'general', context = {}) => {
    return FeedbackService.submitGeneral(message, category, context);
  }, []);

  /**
   * Dismiss feedback prompt
   */
  const dismissPrompt = useCallback((days = 7) => {
    FeedbackService.dismissPrompt(days);
    refresh();
  }, [refresh]);

  /**
   * Check if should prompt for feedback
   */
  const shouldPrompt = useCallback(() => {
    return FeedbackService.shouldPromptForFeedback();
  }, []);

  /**
   * Get feedback history
   */
  const getHistory = useCallback((type = null) => {
    return FeedbackService.getHistory(type);
  }, []);

  /**
   * Clear last feedback notification
   */
  const clearLastFeedback = useCallback(() => {
    setLastFeedback(null);
  }, []);

  /**
   * Reset feedback data (for debug/testing)
   */
  const reset = useCallback(() => {
    FeedbackService.reset();
  }, []);

  return {
    // State
    stats,
    promptStatus,
    lastFeedback,
    
    // Config
    feedbackTypes: FEEDBACK_TYPES,
    ratingScale: RATING_SCALE,
    npsCategories: NPS_CATEGORIES,
    
    // Actions
    submitRating,
    submitNPS,
    submitFeatureRequest,
    submitBugReport,
    submitGeneral,
    dismissPrompt,
    shouldPrompt,
    getHistory,
    clearLastFeedback,
    refresh,
    reset
  };
};

export default useFeedback;
