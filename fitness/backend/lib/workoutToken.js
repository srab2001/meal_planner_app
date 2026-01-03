/**
 * Workout Share Token Utilities
 *
 * Generates and validates secure tokens for SMS workout links.
 * Allows unauthenticated access to check-off workout items.
 */

const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Token expiration: 24 hours
const TOKEN_EXPIRY_HOURS = 24;

/**
 * Generate a secure share token for a workout
 *
 * @param {string} workoutId - The workout ID to share
 * @param {string} userId - The user who owns the workout
 * @returns {Promise<{token: string, expiresAt: Date}>}
 */
async function generateShareToken(workoutId, userId) {
  // Generate a cryptographically secure random token
  const token = crypto.randomBytes(32).toString('hex');

  // Calculate expiration time
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

  // Store token in database
  await prisma.workout_share_tokens.create({
    data: {
      workout_id: workoutId,
      user_id: userId,
      token,
      expires_at: expiresAt
    }
  });

  return { token, expiresAt };
}

/**
 * Validate a share token and return the workout ID if valid
 *
 * @param {string} token - The token to validate
 * @returns {Promise<{valid: boolean, workoutId?: string, userId?: string, error?: string}>}
 */
async function validateShareToken(token) {
  if (!token || token.length !== 64) {
    return { valid: false, error: 'Invalid token format' };
  }

  const shareToken = await prisma.workout_share_tokens.findUnique({
    where: { token }
  });

  if (!shareToken) {
    return { valid: false, error: 'Token not found' };
  }

  // Check expiration
  if (new Date() > shareToken.expires_at) {
    return { valid: false, error: 'Token expired' };
  }

  return {
    valid: true,
    workoutId: shareToken.workout_id,
    userId: shareToken.user_id
  };
}

/**
 * Mark a token as used (optional - for single-use tokens)
 *
 * @param {string} token - The token to mark as used
 */
async function markTokenUsed(token) {
  await prisma.workout_share_tokens.update({
    where: { token },
    data: {
      is_used: true,
      used_at: new Date()
    }
  });
}

/**
 * Clean up expired tokens (run periodically)
 */
async function cleanupExpiredTokens() {
  const result = await prisma.workout_share_tokens.deleteMany({
    where: {
      expires_at: { lt: new Date() }
    }
  });

  console.log(`[WorkoutToken] Cleaned up ${result.count} expired tokens`);
  return result.count;
}

/**
 * Get the share URL for a workout token
 *
 * @param {string} token - The share token
 * @param {string} baseUrl - The base URL of the app
 * @returns {string}
 */
function getShareUrl(token, baseUrl) {
  // Remove trailing slash if present
  const base = baseUrl.replace(/\/$/, '');
  return `${base}/workout/check-off/${token}`;
}

/**
 * Revoke all tokens for a workout
 *
 * @param {string} workoutId - The workout ID
 */
async function revokeWorkoutTokens(workoutId) {
  const result = await prisma.workout_share_tokens.deleteMany({
    where: { workout_id: workoutId }
  });

  console.log(`[WorkoutToken] Revoked ${result.count} tokens for workout ${workoutId}`);
  return result.count;
}

module.exports = {
  generateShareToken,
  validateShareToken,
  markTokenUsed,
  cleanupExpiredTokens,
  getShareUrl,
  revokeWorkoutTokens,
  TOKEN_EXPIRY_HOURS
};
