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
    throw new Error(`Failed to send invitation: ${response.statusText}`);
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
