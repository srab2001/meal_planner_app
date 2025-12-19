/**
 * CalendarSyncIntegration - Sync meal plans to Google Calendar
 * 
 * Features:
 * - Sync meal plan to Google Calendar
 * - Create events for meals
 * - Update/delete synced events
 * - Two-way sync status
 * 
 * Behind feature flag: 'calendar_sync'
 */

import { IntegrationService, INTEGRATION_STATUS } from './IntegrationService';
import auditLogger from '../AuditLogger';

// Calendar event types
export const CALENDAR_EVENT_TYPES = {
  MEAL: 'meal',
  REMINDER: 'reminder',
  PREP: 'prep'
};

class CalendarSyncIntegration extends IntegrationService {
  constructor() {
    super('calendar_sync', 'calendar_sync');
    
    this.accessToken = null;
    this.calendarId = 'primary';
    this.syncedEvents = new Map(); // mealId -> eventId mapping
    this.lastSyncAt = null;
    
    // Load synced events from storage
    this._loadSyncedEvents();
  }

  /**
   * Initialize with Google OAuth config
   */
  async init(config = {}) {
    const initialized = await super.init(config);
    if (!initialized) return false;

    this.clientId = config.clientId || process.env.REACT_APP_GOOGLE_CLIENT_ID;
    this.scopes = config.scopes || [
      'https://www.googleapis.com/auth/calendar.events'
    ];
    
    // Check for existing token
    this._loadAccessToken();
    
    return true;
  }

  /**
   * Connect to Google Calendar (OAuth flow)
   */
  async _connect() {
    // Check for existing valid token
    if (this.accessToken && !this._isTokenExpired()) {
      return true;
    }

    // In a real implementation, this would trigger OAuth flow
    // For now, we simulate/mock the connection
    return new Promise((resolve, reject) => {
      // Check if we have a stored token
      const storedToken = localStorage.getItem('google_calendar_token');
      
      if (storedToken) {
        try {
          const tokenData = JSON.parse(storedToken);
          if (!this._isTokenExpired(tokenData)) {
            this.accessToken = tokenData.access_token;
            resolve(true);
            return;
          }
        } catch (e) {
          // Invalid stored token
        }
      }

      // Would normally open OAuth popup here
      // For development/testing, we'll simulate success if in mock mode
      if (this.config.mockMode) {
        this.accessToken = 'mock_token_' + Date.now();
        resolve(true);
        return;
      }

      // Real OAuth flow would go here
      reject(new Error('OAuth authentication required. Please enable mockMode for testing.'));
    });
  }

  /**
   * Disconnect from Google Calendar
   */
  async _disconnect() {
    this.accessToken = null;
    localStorage.removeItem('google_calendar_token');
  }

  /**
   * Health check - verify API access
   */
  async _healthCheck() {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    // Would normally call Calendar API to verify
    // For mock mode, just return success
    if (this.config.mockMode) {
      return true;
    }

    // Real API check would go here
    return true;
  }

  /**
   * Sync a meal plan to calendar
   * @param {object} mealPlan - Meal plan data
   * @param {object} options - Sync options
   */
  async syncMealPlan(mealPlan, options = {}) {
    return this.execute(async () => {
      const {
        createReminders = true,
        reminderMinutes = 30,
        includeIngredients = true
      } = options;

      const results = {
        created: [],
        updated: [],
        failed: []
      };

      // Process each day's meals
      for (const [date, meals] of Object.entries(mealPlan.days || {})) {
        for (const meal of meals) {
          try {
            const event = this._createCalendarEvent(date, meal, {
              includeIngredients,
              createReminders,
              reminderMinutes
            });

            const existingEventId = this.syncedEvents.get(meal.id);
            
            if (existingEventId) {
              // Update existing event
              await this._updateEvent(existingEventId, event);
              results.updated.push({ mealId: meal.id, eventId: existingEventId });
            } else {
              // Create new event
              const eventId = await this._createEvent(event);
              this.syncedEvents.set(meal.id, eventId);
              results.created.push({ mealId: meal.id, eventId });
            }
          } catch (error) {
            results.failed.push({ mealId: meal.id, error: error.message });
          }
        }
      }

      // Save sync state
      this._saveSyncedEvents();
      this.lastSyncAt = new Date().toISOString();

      // Log sync action
      auditLogger.log({
        category: auditLogger.CATEGORIES.DATA,
        action: 'calendar_sync_completed',
        level: auditLogger.LEVELS.INFO,
        details: {
          created: results.created.length,
          updated: results.updated.length,
          failed: results.failed.length
        }
      });

      return results;
    });
  }

  /**
   * Sync a single meal to calendar
   * @param {string} date - Date string (YYYY-MM-DD)
   * @param {object} meal - Meal data
   */
  async syncMeal(date, meal, options = {}) {
    return this.execute(async () => {
      const event = this._createCalendarEvent(date, meal, options);
      const existingEventId = this.syncedEvents.get(meal.id);

      if (existingEventId) {
        await this._updateEvent(existingEventId, event);
        return { updated: true, eventId: existingEventId };
      } else {
        const eventId = await this._createEvent(event);
        this.syncedEvents.set(meal.id, eventId);
        this._saveSyncedEvents();
        return { created: true, eventId };
      }
    });
  }

  /**
   * Remove a meal from calendar
   * @param {string} mealId - Meal ID to remove
   */
  async unsyncMeal(mealId) {
    return this.execute(async () => {
      const eventId = this.syncedEvents.get(mealId);
      
      if (eventId) {
        await this._deleteEvent(eventId);
        this.syncedEvents.delete(mealId);
        this._saveSyncedEvents();
        return { deleted: true, eventId };
      }
      
      return { deleted: false, reason: 'Event not found' };
    });
  }

  /**
   * Get sync status for meals
   * @param {Array} mealIds - Array of meal IDs
   */
  getSyncStatus(mealIds) {
    return mealIds.map(id => ({
      mealId: id,
      synced: this.syncedEvents.has(id),
      eventId: this.syncedEvents.get(id) || null
    }));
  }

  /**
   * Create calendar event object from meal
   */
  _createCalendarEvent(date, meal, options = {}) {
    const { includeIngredients = true, createReminders = true, reminderMinutes = 30 } = options;

    // Determine meal time based on type
    const mealTimes = {
      breakfast: { start: '08:00', end: '09:00' },
      lunch: { start: '12:00', end: '13:00' },
      dinner: { start: '18:00', end: '19:00' },
      snack: { start: '15:00', end: '15:30' }
    };

    const times = mealTimes[meal.type] || mealTimes.lunch;

    // Build description
    let description = meal.description || '';
    if (includeIngredients && meal.ingredients?.length) {
      description += '\n\nIngredients:\n';
      description += meal.ingredients.map(i => `• ${i.name}: ${i.amount}`).join('\n');
    }
    if (meal.calories) {
      description += `\n\nCalories: ${meal.calories}`;
    }

    const event = {
      summary: `🍽️ ${meal.name}`,
      description,
      start: {
        dateTime: `${date}T${times.start}:00`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: `${date}T${times.end}:00`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      colorId: this._getMealColorId(meal.type),
      source: {
        title: 'Meal Planner App',
        url: window.location.origin
      }
    };

    if (createReminders) {
      event.reminders = {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: reminderMinutes }
        ]
      };
    }

    return event;
  }

  /**
   * Get Google Calendar color ID for meal type
   */
  _getMealColorId(mealType) {
    const colors = {
      breakfast: '5',  // Yellow
      lunch: '7',      // Cyan
      dinner: '9',     // Blue
      snack: '2'       // Green
    };
    return colors[mealType] || '1';
  }

  /**
   * Create event via API
   */
  async _createEvent(event) {
    if (this.config.mockMode) {
      // Mock: return fake event ID
      const eventId = 'mock_event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      console.log('[CalendarSync] Mock create event:', event.summary);
      return eventId;
    }

    // Real API call would go here
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create event: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Update event via API
   */
  async _updateEvent(eventId, event) {
    if (this.config.mockMode) {
      console.log('[CalendarSync] Mock update event:', eventId, event.summary);
      return true;
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${eventId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update event: ${response.statusText}`);
    }

    return true;
  }

  /**
   * Delete event via API
   */
  async _deleteEvent(eventId) {
    if (this.config.mockMode) {
      console.log('[CalendarSync] Mock delete event:', eventId);
      return true;
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      }
    );

    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete event: ${response.statusText}`);
    }

    return true;
  }

  /**
   * Check if token is expired
   */
  _isTokenExpired(tokenData = null) {
    if (!tokenData) {
      return !this.accessToken;
    }
    
    if (tokenData.expires_at) {
      return Date.now() >= tokenData.expires_at;
    }
    
    return false;
  }

  /**
   * Load access token from storage
   */
  _loadAccessToken() {
    try {
      const stored = localStorage.getItem('google_calendar_token');
      if (stored) {
        const tokenData = JSON.parse(stored);
        if (!this._isTokenExpired(tokenData)) {
          this.accessToken = tokenData.access_token;
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }

  /**
   * Load synced events from storage
   */
  _loadSyncedEvents() {
    try {
      const stored = localStorage.getItem('calendar_synced_events');
      if (stored) {
        const data = JSON.parse(stored);
        this.syncedEvents = new Map(Object.entries(data));
      }
    } catch (e) {
      this.syncedEvents = new Map();
    }
  }

  /**
   * Save synced events to storage
   */
  _saveSyncedEvents() {
    try {
      const data = Object.fromEntries(this.syncedEvents);
      localStorage.setItem('calendar_synced_events', JSON.stringify(data));
    } catch (e) {
      console.error('[CalendarSync] Failed to save synced events:', e);
    }
  }

  /**
   * Clear all synced events (without deleting from calendar)
   */
  clearSyncData() {
    this.syncedEvents.clear();
    localStorage.removeItem('calendar_synced_events');
  }

  /**
   * Get integration info with calendar-specific data
   */
  getInfo() {
    return {
      ...super.getInfo(),
      lastSyncAt: this.lastSyncAt,
      syncedEventCount: this.syncedEvents.size,
      authenticated: !!this.accessToken,
      calendarId: this.calendarId
    };
  }
}

// Export singleton instance
const calendarSyncIntegration = new CalendarSyncIntegration();
export default calendarSyncIntegration;

// Also export class for testing
export { CalendarSyncIntegration };
