/**
 * SMS Utilities - Twilio Integration
 *
 * Handles sending SMS messages for workout links.
 * Includes rate limiting and logging.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Rate limit: max 5 SMS per user per hour
const RATE_LIMIT_WINDOW_HOURS = 1;
const RATE_LIMIT_MAX = 5;

// Initialize Twilio client (lazy load)
let twilioClient = null;

function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      console.warn('[SMS] Twilio credentials not configured');
      return null;
    }

    const twilio = require('twilio');
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

/**
 * Validate phone number format (E.164)
 * @param {string} phone - Phone number to validate
 * @returns {boolean}
 */
function isValidPhoneNumber(phone) {
  // E.164 format: + followed by 1-15 digits
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

/**
 * Format phone number to E.164
 * @param {string} phone - Phone number to format
 * @param {string} defaultCountry - Default country code (default: 1 for US)
 * @returns {string|null}
 */
function formatPhoneNumber(phone, defaultCountry = '1') {
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // If already E.164 format
  if (cleaned.startsWith('+')) {
    return isValidPhoneNumber(cleaned) ? cleaned : null;
  }

  // Add country code
  if (cleaned.length === 10) {
    cleaned = `+${defaultCountry}${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith(defaultCountry)) {
    cleaned = `+${cleaned}`;
  }

  return isValidPhoneNumber(cleaned) ? cleaned : null;
}

/**
 * Check rate limit for user
 * @param {string} userId - User ID
 * @returns {Promise<{allowed: boolean, remaining: number}>}
 */
async function checkRateLimit(userId) {
  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - RATE_LIMIT_WINDOW_HOURS);

  const recentCount = await prisma.sms_log.count({
    where: {
      user_id: userId,
      created_at: { gte: windowStart },
      status: { in: ['sent', 'delivered'] }
    }
  });

  return {
    allowed: recentCount < RATE_LIMIT_MAX,
    remaining: Math.max(0, RATE_LIMIT_MAX - recentCount)
  };
}

/**
 * Log SMS attempt
 * @param {Object} params
 */
async function logSms(params) {
  await prisma.sms_log.create({
    data: {
      user_id: params.userId,
      phone_number: params.phoneNumber,
      message_type: params.messageType,
      status: params.status,
      twilio_sid: params.twilioSid || null,
      error: params.error || null
    }
  });
}

/**
 * Send an SMS message
 *
 * @param {Object} params
 * @param {string} params.to - Recipient phone number (E.164 format)
 * @param {string} params.body - Message body
 * @param {string} params.userId - User ID for logging
 * @param {string} params.messageType - Type of message for logging
 * @returns {Promise<{success: boolean, sid?: string, error?: string}>}
 */
async function sendSms({ to, body, userId, messageType }) {
  // Validate phone number
  const formattedPhone = formatPhoneNumber(to);
  if (!formattedPhone) {
    await logSms({
      userId,
      phoneNumber: to,
      messageType,
      status: 'failed',
      error: 'Invalid phone number format'
    });
    return { success: false, error: 'Invalid phone number format' };
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(userId);
  if (!rateLimit.allowed) {
    await logSms({
      userId,
      phoneNumber: formattedPhone,
      messageType,
      status: 'failed',
      error: 'Rate limit exceeded'
    });
    return { success: false, error: 'Rate limit exceeded. Try again later.' };
  }

  // Get Twilio client
  const client = getTwilioClient();
  if (!client) {
    await logSms({
      userId,
      phoneNumber: formattedPhone,
      messageType,
      status: 'failed',
      error: 'SMS service not configured'
    });
    return { success: false, error: 'SMS service not configured' };
  }

  try {
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!fromNumber) {
      throw new Error('TWILIO_PHONE_NUMBER not configured');
    }

    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: formattedPhone
    });

    await logSms({
      userId,
      phoneNumber: formattedPhone,
      messageType,
      status: 'sent',
      twilioSid: message.sid
    });

    console.log(`[SMS] Sent to ${formattedPhone}, SID: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (err) {
    console.error('[SMS] Failed to send:', err.message);

    await logSms({
      userId,
      phoneNumber: formattedPhone,
      messageType,
      status: 'failed',
      error: err.message
    });

    return { success: false, error: err.message };
  }
}

/**
 * Send workout link SMS
 *
 * @param {string} userId - User ID
 * @param {string} phoneNumber - Recipient phone
 * @param {string} shareUrl - The workout share URL
 * @param {string} workoutName - Name of the workout
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendWorkoutLinkSms(userId, phoneNumber, shareUrl, workoutName) {
  const body = `Your ${workoutName || 'workout'} is ready! Check off exercises as you complete them: ${shareUrl}`;

  return sendSms({
    to: phoneNumber,
    body,
    userId,
    messageType: 'workout_link'
  });
}

module.exports = {
  sendSms,
  sendWorkoutLinkSms,
  isValidPhoneNumber,
  formatPhoneNumber,
  checkRateLimit,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_HOURS
};
