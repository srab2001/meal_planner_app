/**
 * useStepMedia Hook
 *
 * React hook for fetching and managing step media in the meal planning flow.
 * Fetches active media for steps and provides it to components.
 *
 * Usage:
 * const { getMedia, allMedia, loading, error } = useStepMedia();
 * const cuisinesMedia = getMedia('CUISINES');
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// API Configuration
const PRODUCTION_API = 'https://meal-planner-app-mve2.onrender.com';
const API_BASE = process.env.REACT_APP_API_URL || PRODUCTION_API;

/**
 * Valid step keys for media
 */
export const STEP_KEYS = [
  'CUISINES',
  'SERVINGS',
  'INGREDIENTS',
  'DIETARY',
  'MEALS',
  'STORES',
  'RECIPES_WITH_PRICES'
];

/**
 * Step labels for display
 */
export const STEP_LABELS = {
  CUISINES: 'Cuisines Selection',
  SERVINGS: 'Number of Servings',
  INGREDIENTS: 'Ingredients List',
  DIETARY: 'Dietary Preferences',
  MEALS: 'Meal Types',
  STORES: 'Store Selection',
  RECIPES_WITH_PRICES: 'Recipes with Prices',
};

const useStepMedia = (options = {}) => {
  const {
    autoLoad = true,           // Automatically load media on mount
    cacheTime = 5 * 60 * 1000, // Cache duration in ms (default 5 min)
  } = options;

  const [mediaMap, setMediaMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  /**
   * Fetch all active media from API
   */
  const fetchAllMedia = useCallback(async (force = false) => {
    // Skip if recently fetched (unless forced)
    if (!force && lastFetch && Date.now() - lastFetch < cacheTime) {
      return mediaMap;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/step-media/active`);

      if (!response.ok) {
        throw new Error('Failed to fetch step media');
      }

      const data = await response.json();
      const newMediaMap = data.media || {};

      setMediaMap(newMediaMap);
      setLastFetch(Date.now());

      return newMediaMap;
    } catch (err) {
      console.error('[useStepMedia] Error fetching media:', err);
      setError(err.message);
      return {};
    } finally {
      setLoading(false);
    }
  }, [lastFetch, cacheTime, mediaMap]);

  /**
   * Fetch media for a specific step
   */
  const fetchStepMedia = useCallback(async (stepKey) => {
    if (!STEP_KEYS.includes(stepKey)) {
      console.warn(`[useStepMedia] Invalid step key: ${stepKey}`);
      return null;
    }

    // Return from cache if available
    if (mediaMap[stepKey]) {
      return mediaMap[stepKey];
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/step-media/active/${stepKey}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch media for ${stepKey}`);
      }

      const data = await response.json();

      if (data.media) {
        setMediaMap(prev => ({
          ...prev,
          [stepKey]: data.media
        }));
        return data.media;
      }

      return null;
    } catch (err) {
      console.error(`[useStepMedia] Error fetching ${stepKey} media:`, err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [mediaMap]);

  /**
   * Get media for a specific step (from cache)
   * Returns null if not loaded
   */
  const getMedia = useCallback((stepKey) => {
    return mediaMap[stepKey] || null;
  }, [mediaMap]);

  /**
   * Check if media exists for a step
   */
  const hasMedia = useCallback((stepKey) => {
    const media = mediaMap[stepKey];
    return !!(media && (media.videoUrl || media.posterUrl));
  }, [mediaMap]);

  /**
   * Get media with fallback for a step
   * Returns default values if no media available
   */
  const getMediaWithDefaults = useCallback((stepKey, defaults = {}) => {
    const media = mediaMap[stepKey];
    if (!media) {
      return {
        videoUrl: null,
        posterUrl: null,
        runRule: 'loop',
        ...defaults
      };
    }
    return {
      ...media,
      ...defaults
    };
  }, [mediaMap]);

  /**
   * Refresh all media (force fetch)
   */
  const refresh = useCallback(() => {
    return fetchAllMedia(true);
  }, [fetchAllMedia]);

  /**
   * Clear cache
   */
  const clearCache = useCallback(() => {
    setMediaMap({});
    setLastFetch(null);
  }, []);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      fetchAllMedia();
    }
  }, [autoLoad]); // eslint-disable-line react-hooks/exhaustive-deps

  // Computed: all step keys that have media
  const stepsWithMedia = useMemo(() => {
    return STEP_KEYS.filter(key => hasMedia(key));
  }, [hasMedia]);

  return {
    // State
    allMedia: mediaMap,
    loading,
    error,
    lastFetch,
    stepsWithMedia,

    // Getters
    getMedia,
    hasMedia,
    getMediaWithDefaults,

    // Actions
    fetchAllMedia,
    fetchStepMedia,
    refresh,
    clearCache,

    // Constants
    stepKeys: STEP_KEYS,
    stepLabels: STEP_LABELS,
  };
};

export default useStepMedia;
