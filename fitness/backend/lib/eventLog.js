/**
 * Event Logger for Workout SMS Feature
 *
 * Logs events without exposing sensitive data (tokens, phone numbers).
 * Events are logged to console and can be extended to external services.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Event types for SMS workflow
 */
const EVENT_TYPES = {
  LINK_CREATED: 'workout_link_created',
  SMS_REQUESTED: 'sms_requested',
  SMS_SENT: 'sms_sent',
  SMS_FAILED: 'sms_failed',
  ITEM_CHECKED: 'item_checked',
  ITEM_UNCHECKED: 'item_unchecked',
  BULK_COMPLETE: 'bulk_mark_complete',
  BULK_CLEAR: 'bulk_clear_all',
  TOKEN_VALIDATED: 'token_validated',
  TOKEN_EXPIRED: 'token_expired',
  TOKEN_INVALID: 'token_invalid'
};

/**
 * Log an event (async, fire-and-forget)
 *
 * @param {Object} params
 * @param {string} params.event - Event type from EVENT_TYPES
 * @param {string} [params.userId] - User ID (masked if provided)
 * @param {string} [params.workoutId] - Workout ID
 * @param {Object} [params.metadata] - Additional non-sensitive metadata
 */
async function logEvent({ event, userId, workoutId, metadata = {} }) {
  const timestamp = new Date().toISOString();

  // Create log entry without sensitive data
  const logEntry = {
    timestamp,
    event,
    // Mask user ID for privacy (show last 4 chars)
    userId: userId ? `***${userId.slice(-4)}` : null,
    workoutId: workoutId ? `***${workoutId.slice(-4)}` : null,
    ...metadata
  };

  // Log to console in structured format
  console.log(`[EVENT] ${JSON.stringify(logEntry)}`);

  // Optionally persist to database (can be disabled in high-volume scenarios)
  if (process.env.PERSIST_EVENT_LOGS === 'true') {
    try {
      await prisma.$executeRaw`
        INSERT INTO event_logs (event_type, user_id, workout_id, metadata, created_at)
        VALUES (${event}, ${userId}, ${workoutId}, ${JSON.stringify(metadata)}::jsonb, NOW())
      `;
    } catch (err) {
      // Fail silently - event logging shouldn't break functionality
      console.error('[EventLog] DB persist failed:', err.message);
    }
  }
}

/**
 * Log workout link creation
 */
function logLinkCreated(userId, workoutId) {
  logEvent({
    event: EVENT_TYPES.LINK_CREATED,
    userId,
    workoutId
  });
}

/**
 * Log SMS request
 */
function logSmsRequested(userId, workoutId) {
  logEvent({
    event: EVENT_TYPES.SMS_REQUESTED,
    userId,
    workoutId
  });
}

/**
 * Log successful SMS send
 */
function logSmsSent(userId, workoutId) {
  logEvent({
    event: EVENT_TYPES.SMS_SENT,
    userId,
    workoutId
  });
}

/**
 * Log failed SMS send
 */
function logSmsFailed(userId, workoutId, reason) {
  logEvent({
    event: EVENT_TYPES.SMS_FAILED,
    userId,
    workoutId,
    metadata: { reason }
  });
}

/**
 * Log item check-off
 */
function logItemChecked(workoutId, itemId, completed) {
  logEvent({
    event: completed ? EVENT_TYPES.ITEM_CHECKED : EVENT_TYPES.ITEM_UNCHECKED,
    workoutId,
    metadata: { itemId: itemId ? `***${itemId.slice(-4)}` : null }
  });
}

/**
 * Log bulk operation
 */
function logBulkOperation(userId, workoutId, action) {
  logEvent({
    event: action === 'mark_all_done' ? EVENT_TYPES.BULK_COMPLETE : EVENT_TYPES.BULK_CLEAR,
    userId,
    workoutId
  });
}

/**
 * Log token validation result
 */
function logTokenValidation(workoutId, isValid, reason) {
  const event = isValid
    ? EVENT_TYPES.TOKEN_VALIDATED
    : (reason === 'Token expired' ? EVENT_TYPES.TOKEN_EXPIRED : EVENT_TYPES.TOKEN_INVALID);

  logEvent({
    event,
    workoutId
  });
}

module.exports = {
  EVENT_TYPES,
  logEvent,
  logLinkCreated,
  logSmsRequested,
  logSmsSent,
  logSmsFailed,
  logItemChecked,
  logBulkOperation,
  logTokenValidation
};
