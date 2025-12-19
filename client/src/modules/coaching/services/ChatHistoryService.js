/**
 * ChatHistoryService - Persistent chat history management
 * 
 * Features:
 * - Per-user chat history storage
 * - Message pagination and retrieval
 * - History export/import
 * - Automatic cleanup of old messages
 * 
 * @module coaching/services/ChatHistoryService
 */

import auditLogger from '../../../shared/services/AuditLogger';

// Configuration
const CONFIG = {
  MAX_MESSAGES_PER_USER: 200,
  MAX_MESSAGE_AGE_DAYS: 90,
  STORAGE_KEY_PREFIX: 'coaching_chat_history_',
  AUTO_SAVE_INTERVAL_MS: 30000
};

/**
 * ChatHistoryService class for managing chat message persistence
 */
class ChatHistoryService {
  constructor() {
    this.currentUserId = null;
    this.messages = [];
    this.autoSaveTimer = null;
  }

  /**
   * Initialize service for a specific user
   * @param {string} userId - User ID
   */
  initialize(userId) {
    if (this.currentUserId !== userId) {
      // Save current user's data if switching
      if (this.currentUserId) {
        this.save();
      }
      
      this.currentUserId = userId;
      this.load();
      this.startAutoSave();
    }
  }

  /**
   * Get storage key for current user
   * @returns {string}
   */
  getStorageKey() {
    return `${CONFIG.STORAGE_KEY_PREFIX}${this.currentUserId || 'anonymous'}`;
  }

  /**
   * Load chat history from localStorage
   */
  load() {
    try {
      const key = this.getStorageKey();
      const stored = localStorage.getItem(key);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        this.messages = parsed.messages || [];
        
        // Clean up old messages
        this.cleanupOldMessages();
        
        auditLogger.log({
          category: auditLogger.CATEGORIES.DATA,
          action: 'chat_history_loaded',
          level: auditLogger.LEVELS.DEBUG,
          details: { messageCount: this.messages.length }
        });
      } else {
        this.messages = [];
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
      this.messages = [];
    }
  }

  /**
   * Save chat history to localStorage
   */
  save() {
    try {
      const key = this.getStorageKey();
      const data = {
        userId: this.currentUserId,
        messages: this.messages.slice(-CONFIG.MAX_MESSAGES_PER_USER),
        lastSaved: new Date().toISOString()
      };
      
      localStorage.setItem(key, JSON.stringify(data));
      
      auditLogger.log({
        category: auditLogger.CATEGORIES.DATA,
        action: 'chat_history_saved',
        level: auditLogger.LEVELS.DEBUG,
        details: { messageCount: this.messages.length }
      });
    } catch (err) {
      console.error('Error saving chat history:', err);
      
      auditLogger.log({
        category: auditLogger.CATEGORIES.ERROR,
        action: 'chat_history_save_failed',
        level: auditLogger.LEVELS.ERROR,
        details: { error: err.message }
      });
    }
  }

  /**
   * Add a message to history
   * @param {Object} message - Message object { role, content, timestamp, metadata }
   * @returns {Object} - Message with generated ID
   */
  addMessage(message) {
    const fullMessage = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      role: message.role, // 'user' | 'assistant' | 'system'
      content: message.content,
      timestamp: message.timestamp || new Date().toISOString(),
      metadata: message.metadata || {}
    };
    
    this.messages.push(fullMessage);
    
    // Trim if exceeding max
    if (this.messages.length > CONFIG.MAX_MESSAGES_PER_USER) {
      this.messages = this.messages.slice(-CONFIG.MAX_MESSAGES_PER_USER);
    }
    
    return fullMessage;
  }

  /**
   * Get all messages
   * @returns {Array} - All messages
   */
  getAllMessages() {
    return [...this.messages];
  }

  /**
   * Get recent messages
   * @param {number} count - Number of messages to retrieve
   * @returns {Array} - Recent messages
   */
  getRecentMessages(count = 50) {
    return this.messages.slice(-count);
  }

  /**
   * Get messages by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} - Messages in range
   */
  getMessagesByDateRange(startDate, endDate) {
    return this.messages.filter(msg => {
      const msgDate = new Date(msg.timestamp);
      return msgDate >= startDate && msgDate <= endDate;
    });
  }

  /**
   * Search messages by content
   * @param {string} query - Search query
   * @returns {Array} - Matching messages
   */
  searchMessages(query) {
    const lowerQuery = query.toLowerCase();
    return this.messages.filter(msg => 
      msg.content.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Delete a specific message
   * @param {string} messageId - Message ID to delete
   * @returns {boolean} - Success
   */
  deleteMessage(messageId) {
    const initialLength = this.messages.length;
    this.messages = this.messages.filter(msg => msg.id !== messageId);
    return this.messages.length < initialLength;
  }

  /**
   * Clear all messages
   */
  clearAll() {
    this.messages = [];
    this.save();
    
    auditLogger.log({
      category: auditLogger.CATEGORIES.DATA,
      action: 'chat_history_cleared',
      level: auditLogger.LEVELS.INFO,
      details: { userId: this.currentUserId }
    });
  }

  /**
   * Remove messages older than MAX_MESSAGE_AGE_DAYS
   */
  cleanupOldMessages() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CONFIG.MAX_MESSAGE_AGE_DAYS);
    
    const initialCount = this.messages.length;
    this.messages = this.messages.filter(msg => 
      new Date(msg.timestamp) >= cutoffDate
    );
    
    const removedCount = initialCount - this.messages.length;
    if (removedCount > 0) {
      auditLogger.log({
        category: auditLogger.CATEGORIES.DATA,
        action: 'old_messages_cleaned',
        level: auditLogger.LEVELS.DEBUG,
        details: { removedCount }
      });
    }
  }

  /**
   * Export chat history for backup
   * @returns {Object} - Exportable history object
   */
  exportHistory() {
    return {
      userId: this.currentUserId,
      exportDate: new Date().toISOString(),
      messageCount: this.messages.length,
      messages: this.messages
    };
  }

  /**
   * Import chat history from backup
   * @param {Object} data - Imported history data
   * @returns {boolean} - Success
   */
  importHistory(data) {
    try {
      if (data.messages && Array.isArray(data.messages)) {
        this.messages = data.messages.slice(-CONFIG.MAX_MESSAGES_PER_USER);
        this.save();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error importing chat history:', err);
      return false;
    }
  }

  /**
   * Get statistics about chat history
   * @returns {Object} - Statistics
   */
  getStatistics() {
    const userMessages = this.messages.filter(m => m.role === 'user');
    const assistantMessages = this.messages.filter(m => m.role === 'assistant');
    
    const totalUserChars = userMessages.reduce((sum, m) => sum + m.content.length, 0);
    const totalAssistantChars = assistantMessages.reduce((sum, m) => sum + m.content.length, 0);
    
    let firstMessageDate = null;
    let lastMessageDate = null;
    
    if (this.messages.length > 0) {
      firstMessageDate = this.messages[0].timestamp;
      lastMessageDate = this.messages[this.messages.length - 1].timestamp;
    }
    
    return {
      totalMessages: this.messages.length,
      userMessages: userMessages.length,
      assistantMessages: assistantMessages.length,
      avgUserMessageLength: userMessages.length > 0 
        ? Math.round(totalUserChars / userMessages.length) 
        : 0,
      avgAssistantMessageLength: assistantMessages.length > 0 
        ? Math.round(totalAssistantChars / assistantMessages.length) 
        : 0,
      firstMessageDate,
      lastMessageDate
    };
  }

  /**
   * Start auto-save timer
   */
  startAutoSave() {
    this.stopAutoSave();
    this.autoSaveTimer = setInterval(() => {
      if (this.messages.length > 0) {
        this.save();
      }
    }, CONFIG.AUTO_SAVE_INTERVAL_MS);
  }

  /**
   * Stop auto-save timer
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Cleanup on unmount
   */
  destroy() {
    this.save();
    this.stopAutoSave();
  }
}

// Export singleton instance
export const chatHistoryService = new ChatHistoryService();
export default chatHistoryService;
