/**
 * CoachingAuditService - Specialized audit logging for coaching module
 * 
 * Features:
 * - Structured logging of all coaching interactions
 * - Prompt and response tracking
 * - Guardrail trigger monitoring
 * - Compliance reporting support
 * 
 * @module coaching/services/CoachingAuditService
 */

import auditLogger from '../../../shared/services/AuditLogger';

// Audit event types specific to coaching
const COACHING_EVENTS = {
  // Chat events
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  CHAT_RESPONSE_RECEIVED: 'chat_response_received',
  CHAT_FALLBACK_USED: 'chat_fallback_used',
  CHAT_CLEARED: 'chat_cleared',
  
  // Guardrail events
  GUARDRAIL_TRIGGERED: 'guardrail_triggered',
  GUARDRAIL_BYPASSED: 'guardrail_bypassed', // Should never happen, for monitoring
  
  // Program events
  PROGRAM_ENROLLED: 'program_enrolled',
  PROGRAM_COMPLETED: 'program_completed',
  PROGRAM_UNENROLLED: 'program_unenrolled',
  MODULE_COMPLETED: 'module_completed',
  
  // Goal events
  GOAL_CREATED: 'goal_created',
  GOAL_UPDATED: 'goal_updated',
  GOAL_COMPLETED: 'goal_completed',
  GOAL_DELETED: 'goal_deleted',
  
  // Habit events
  HABIT_CREATED: 'habit_created',
  HABIT_CHECKED: 'habit_checked',
  HABIT_STREAK_MILESTONE: 'habit_streak_milestone',
  
  // Session events
  SESSION_STARTED: 'coaching_session_started',
  SESSION_ENDED: 'coaching_session_ended',
  VIEW_CHANGED: 'coaching_view_changed'
};

/**
 * CoachingAuditService class for specialized coaching audit logging
 */
class CoachingAuditService {
  constructor() {
    this.sessionId = null;
    this.sessionStartTime = null;
    this.interactionCount = 0;
  }

  /**
   * Start a new coaching session
   * @param {Object} user - User object
   * @returns {string} - Session ID
   */
  startSession(user) {
    this.sessionId = `coaching_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.sessionStartTime = new Date();
    this.interactionCount = 0;
    
    this.log(COACHING_EVENTS.SESSION_STARTED, {
      userId: user?.id,
      userName: user?.name,
      sessionId: this.sessionId
    });
    
    return this.sessionId;
  }

  /**
   * End the current coaching session
   */
  endSession() {
    if (this.sessionId) {
      const duration = this.sessionStartTime 
        ? Math.round((Date.now() - this.sessionStartTime.getTime()) / 1000)
        : 0;
      
      this.log(COACHING_EVENTS.SESSION_ENDED, {
        sessionId: this.sessionId,
        durationSeconds: duration,
        interactionCount: this.interactionCount
      });
      
      this.sessionId = null;
      this.sessionStartTime = null;
      this.interactionCount = 0;
    }
  }

  /**
   * Log a coaching event
   * @param {string} event - Event type from COACHING_EVENTS
   * @param {Object} details - Event details
   * @param {string} level - Log level (default: INFO)
   */
  log(event, details = {}, level = auditLogger.LEVELS.INFO) {
    // Increment interaction count for certain events
    if ([
      COACHING_EVENTS.CHAT_MESSAGE_SENT,
      COACHING_EVENTS.MODULE_COMPLETED,
      COACHING_EVENTS.GOAL_UPDATED,
      COACHING_EVENTS.HABIT_CHECKED
    ].includes(event)) {
      this.interactionCount++;
    }
    
    auditLogger.log({
      category: auditLogger.CATEGORIES.COACHING,
      action: event,
      level,
      details: {
        ...details,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log a chat message being sent
   * @param {Object} params - { message, messageLength, hasContext }
   */
  logChatMessageSent(params) {
    this.log(COACHING_EVENTS.CHAT_MESSAGE_SENT, {
      messageLength: params.messageLength || params.message?.length || 0,
      hasContext: params.hasContext || false,
      // Don't log actual message content for privacy
      messagePreview: params.message?.substring(0, 30) + '...'
    });
  }

  /**
   * Log a chat response received
   * @param {Object} params - { responseLength, durationMs, tokensUsed, fallback }
   */
  logChatResponseReceived(params) {
    this.log(COACHING_EVENTS.CHAT_RESPONSE_RECEIVED, {
      responseLength: params.responseLength || 0,
      durationMs: params.durationMs || 0,
      tokensUsed: params.tokensUsed || 'unknown',
      usedFallback: params.fallback || false
    });
  }

  /**
   * Log when medical guardrails are triggered
   * @param {Object} params - { reason, condition, pattern, messagePreview }
   */
  logGuardrailTriggered(params) {
    this.log(COACHING_EVENTS.GUARDRAIL_TRIGGERED, {
      reason: params.reason,
      condition: params.condition,
      pattern: params.pattern,
      // Truncate for privacy
      messagePreview: params.messagePreview?.substring(0, 50)
    }, auditLogger.LEVELS.WARNING);
  }

  /**
   * Log program enrollment
   * @param {Object} params - { programId, programName }
   */
  logProgramEnrolled(params) {
    this.log(COACHING_EVENTS.PROGRAM_ENROLLED, {
      programId: params.programId,
      programName: params.programName
    });
  }

  /**
   * Log program completion
   * @param {Object} params - { programId, programName, durationDays }
   */
  logProgramCompleted(params) {
    this.log(COACHING_EVENTS.PROGRAM_COMPLETED, {
      programId: params.programId,
      programName: params.programName,
      durationDays: params.durationDays
    });
  }

  /**
   * Log module completion
   * @param {Object} params - { programId, moduleId, moduleName, programProgress }
   */
  logModuleCompleted(params) {
    this.log(COACHING_EVENTS.MODULE_COMPLETED, {
      programId: params.programId,
      moduleId: params.moduleId,
      moduleName: params.moduleName,
      programProgress: params.programProgress
    });
  }

  /**
   * Log goal creation
   * @param {Object} params - { goalId, goalType, targetDate }
   */
  logGoalCreated(params) {
    this.log(COACHING_EVENTS.GOAL_CREATED, {
      goalId: params.goalId,
      goalType: params.goalType,
      hasTargetDate: !!params.targetDate
    });
  }

  /**
   * Log goal completion
   * @param {Object} params - { goalId, goalType, daysToComplete }
   */
  logGoalCompleted(params) {
    this.log(COACHING_EVENTS.GOAL_COMPLETED, {
      goalId: params.goalId,
      goalType: params.goalType,
      daysToComplete: params.daysToComplete
    });
  }

  /**
   * Log habit check
   * @param {Object} params - { habitId, habitName, currentStreak }
   */
  logHabitChecked(params) {
    this.log(COACHING_EVENTS.HABIT_CHECKED, {
      habitId: params.habitId,
      habitName: params.habitName,
      currentStreak: params.currentStreak
    }, auditLogger.LEVELS.DEBUG);
  }

  /**
   * Log view change within coaching app
   * @param {Object} params - { fromView, toView }
   */
  logViewChange(params) {
    this.log(COACHING_EVENTS.VIEW_CHANGED, {
      fromView: params.fromView,
      toView: params.toView
    }, auditLogger.LEVELS.DEBUG);
  }

  /**
   * Get audit report for a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Object} - Audit report
   */
  getAuditReport(startDate, endDate) {
    const logs = auditLogger.query({
      category: auditLogger.CATEGORIES.COACHING,
      startDate,
      endDate
    });
    
    const report = {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      summary: {
        totalEvents: logs.length,
        chatMessages: 0,
        guardrailTriggers: 0,
        programsEnrolled: 0,
        programsCompleted: 0,
        goalsCreated: 0,
        goalsCompleted: 0,
        habitChecks: 0
      },
      guardrailDetails: [],
      events: logs
    };
    
    logs.forEach(log => {
      switch (log.action) {
        case COACHING_EVENTS.CHAT_MESSAGE_SENT:
          report.summary.chatMessages++;
          break;
        case COACHING_EVENTS.GUARDRAIL_TRIGGERED:
          report.summary.guardrailTriggers++;
          report.guardrailDetails.push({
            timestamp: log.details.timestamp,
            reason: log.details.reason
          });
          break;
        case COACHING_EVENTS.PROGRAM_ENROLLED:
          report.summary.programsEnrolled++;
          break;
        case COACHING_EVENTS.PROGRAM_COMPLETED:
          report.summary.programsCompleted++;
          break;
        case COACHING_EVENTS.GOAL_CREATED:
          report.summary.goalsCreated++;
          break;
        case COACHING_EVENTS.GOAL_COMPLETED:
          report.summary.goalsCompleted++;
          break;
        case COACHING_EVENTS.HABIT_CHECKED:
          report.summary.habitChecks++;
          break;
        default:
          break;
      }
    });
    
    return report;
  }

  /**
   * Export audit logs for compliance
   * @returns {Object} - Exportable audit data
   */
  exportForCompliance() {
    const allLogs = auditLogger.getAll().filter(
      log => log.category === auditLogger.CATEGORIES.COACHING
    );
    
    return {
      exportDate: new Date().toISOString(),
      totalRecords: allLogs.length,
      logs: allLogs.map(log => ({
        timestamp: log.timestamp,
        action: log.action,
        level: log.level,
        // Remove potentially sensitive details
        details: {
          ...log.details,
          messagePreview: undefined // Don't export message content
        }
      }))
    };
  }
}

// Export event types for external use
export { COACHING_EVENTS };

// Export singleton instance
export const coachingAuditService = new CoachingAuditService();
export default coachingAuditService;
