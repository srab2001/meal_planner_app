/**
 * Admin API Helper
 * Centralized functions for admin panel API calls
 * Uses existing API patterns from api.js
 */

import { fetchWithAuth, API_BASE } from './api';

/**
 * List all users
 * @returns {Promise<Array>} Array of user objects
 */
export const adminListUsers = async () => {
  const url = `${API_BASE}/api/admin/users`;
  const response = await fetchWithAuth(url, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Update a user's role and/or status
 * @param {string} id - User ID
 * @param {object} payload - { role?, status? }
 * @returns {Promise<object>} Updated user object
 */
export const adminUpdateUser = async (id, payload) => {
  const url = `${API_BASE}/api/admin/users/${id}`;
  const response = await fetchWithAuth(url, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`Failed to update user: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Send an invitation to a new user
 * @param {object} payload - { email, role }
 * @returns {Promise<object>} Invitation object with token
 */
export const adminInviteUser = async (payload) => {
  const url = `${API_BASE}/api/admin/users/invite`;
  const response = await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to send invitation: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Approve a user directly (bypass invitation) / Add new user
 * @param {object} payload - { email, display_name?, role }
 * @returns {Promise<object>} User object
 */
export const adminApproveUser = async (payload) => {
  const url = `${API_BASE}/api/admin/users/approve`;
  const response = await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to add user: ${response.statusText}`);
  }
  return response.json();
};

/**
 * List all pending invitations
 * @returns {Promise<Array>} Array of invitation objects
 */
export const adminListInvites = async () => {
  const url = `${API_BASE}/api/admin/invites`;
  const response = await fetchWithAuth(url, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`Failed to fetch invitations: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Resend an invitation (generates new token)
 * @param {string} id - Invitation ID
 * @returns {Promise<object>} Updated invitation object
 */
export const adminResendInvite = async (id) => {
  const url = `${API_BASE}/api/admin/invites/${id}/resend`;
  const response = await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify({})
  });
  if (!response.ok) {
    throw new Error(`Failed to resend invitation: ${response.statusText}`);
  }
  return response.json();
};

// ============================================================================
// STEP MEDIA ADMIN API
// ============================================================================

/**
 * List all step media grouped by step key
 * @returns {Promise<object>} { stepKeys: string[], media: Record<string, MediaItem[]> }
 */
export const adminListStepMedia = async () => {
  const url = `${API_BASE}/api/admin/step-media`;
  const response = await fetchWithAuth(url, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`Failed to fetch step media: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Get a single step media item
 * @param {string} id - Media ID
 * @returns {Promise<object>} Media object
 */
export const adminGetStepMedia = async (id) => {
  const url = `${API_BASE}/api/admin/step-media/${id}`;
  const response = await fetchWithAuth(url, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`Failed to fetch step media: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Create a new step media version
 * @param {object} payload - { stepKey, label, videoUrl?, posterUrl?, runRule? }
 * @returns {Promise<object>} Created media object
 */
export const adminCreateStepMedia = async (payload) => {
  const url = `${API_BASE}/api/admin/step-media`;
  const response = await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create step media: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Update a step media version
 * @param {string} id - Media ID
 * @param {object} payload - { label?, videoUrl?, posterUrl?, runRule? }
 * @returns {Promise<object>} Updated media object
 */
export const adminUpdateStepMedia = async (id, payload) => {
  const url = `${API_BASE}/api/admin/step-media/${id}`;
  const response = await fetchWithAuth(url, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update step media: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Publish a step media version (make it active)
 * @param {string} id - Media ID
 * @returns {Promise<object>} Publish result
 */
export const adminPublishStepMedia = async (id) => {
  const url = `${API_BASE}/api/admin/step-media/${id}/publish`;
  const response = await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify({})
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to publish step media: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Delete a step media version
 * @param {string} id - Media ID
 * @returns {Promise<object>} Delete result
 */
export const adminDeleteStepMedia = async (id) => {
  const url = `${API_BASE}/api/admin/step-media/${id}`;
  const response = await fetchWithAuth(url, {
    method: 'DELETE'
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete step media: ${response.statusText}`);
  }
  return response.json();
};
